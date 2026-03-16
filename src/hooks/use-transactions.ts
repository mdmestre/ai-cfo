import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccounts } from "./use-accounts";
import { classifyTransaction } from "@/lib/classify-transaction";

export function useTransactions() {
  const { accounts } = useAccounts();
  const queryClient = useQueryClient();
  const accountIds = (accounts as any[]).map((a) => a.id);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions", accountIds],
    queryFn: async () => {
      if (accountIds.length === 0) return [];
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .in("account_id", accountIds)
        .neq("status", "deleted")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: accountIds.length > 0,
  });

  const createTransaction = useMutation({
    mutationFn: async (tx: { account_id: string; amount: number; category: string; description: string; date: string }) => {
      const { data, error } = await supabase
        .from("transactions")
        .insert(tx)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transactions"] }),
  });

  const autoCategorizeTransactions = useMutation({
    mutationFn: async () => {
      const uncategorized = transactions.filter((t: any) => {
        const c = String(t.category || "").trim().toLowerCase();
        return c === "" || c === "uncategorized";
      });

      const updates = uncategorized
        .map((t: any) => {
          const category = classifyTransaction({ description: t.description, amount: Number(t.amount) });
          return category && category !== t.category ? { id: t.id, category } : null;
        })
        .filter(Boolean) as Array<{ id: string; category: string }>;

      if (updates.length === 0) return { updated: 0 };

      const { error } = await supabase.from("transactions").upsert(updates, { onConflict: "id" });
      if (error) throw error;
      return { updated: updates.length };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transactions"] }),
  });

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyRevenue = transactions
    .filter((t: any) => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && Number(t.amount) > 0;
    })
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

  const monthlyExpenses = transactions
    .filter((t: any) => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && Number(t.amount) < 0;
    })
    .reduce((sum: number, t: any) => sum + Math.abs(Number(t.amount)), 0);

  return { transactions, isLoading, createTransaction, autoCategorizeTransactions, monthlyRevenue, monthlyExpenses };
}
