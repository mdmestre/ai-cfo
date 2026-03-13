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
        .select("*, expense_categories(name)")
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
          status: "pending",
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
        .update({ status: approved ? "approved" : "rejected" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });

  const uploadReceipt = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `receipts/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("expense-receipts")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("expense-receipts")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const totalPending = expenses.filter((e: any) => e.status === "pending").reduce((s: number, e: any) => s + Number(e.amount), 0);
  const totalApproved = expenses.filter((e: any) => e.status === "approved").reduce((s: number, e: any) => s + Number(e.amount), 0);
  const totalThisMonth = expenses
    .filter((e: any) => {
      const d = new Date(e.expense_date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s: number, e: any) => s + Number(e.amount), 0);

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
