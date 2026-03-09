import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./use-company";
import { useAuth } from "@/contexts/AuthContext";

export function useExpenses() {
  const { company } = useCompany();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const companyId = company?.id;

  // Categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["expense-categories", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_categories")
        .select("*")
        .eq("company_id", companyId!)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const createCategory = useMutation({
    mutationFn: async (cat: { name: string; code: string; budget_limit?: number }) => {
      const { data, error } = await supabase
        .from("expense_categories")
        .insert({ ...cat, company_id: companyId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expense-categories"] }),
  });

  // Expenses
  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ["expenses", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*, expense_categories(name, code)")
        .eq("company_id", companyId!)
        .order("expense_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const createExpense = useMutation({
    mutationFn: async (expense: {
      amount: number;
      description: string;
      merchant?: string;
      category_id?: string;
      expense_date?: string;
      receipt_url?: string;
    }) => {
      const { data, error } = await supabase
        .from("expenses")
        .insert({
          ...expense,
          company_id: companyId!,
          submitted_by: user!.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });

  const approveExpense = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await supabase
        .from("expenses")
        .update({
          status: approved ? "approved" : "rejected",
          approved_by: user!.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });

  const uploadReceipt = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${companyId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("receipts").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("receipts").getPublicUrl(path);
    return data.publicUrl;
  };

  const totalPending = expenses.filter((e) => e.status === "pending").reduce((s, e) => s + Number(e.amount), 0);
  const totalApproved = expenses.filter((e) => e.status === "approved").reduce((s, e) => s + Number(e.amount), 0);
  const totalThisMonth = expenses
    .filter((e) => {
      const d = new Date(e.expense_date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, e) => s + Number(e.amount), 0);

  return {
    categories,
    categoriesLoading,
    createCategory,
    expenses,
    expensesLoading,
    createExpense,
    approveExpense,
    uploadReceipt,
    totalPending,
    totalApproved,
    totalThisMonth,
    isLoading: categoriesLoading || expensesLoading,
  };
}
