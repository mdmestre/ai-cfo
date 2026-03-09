import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccounts } from "./use-accounts";

export function useTransactions() {
  const { accounts } = useAccounts();
  const queryClient = useQueryClient();
  const accountIds = accounts.map((a) => a.id);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions", accountIds],
    queryFn: async () => {
      if (accountIds.length === 0) return [];
      const { data, error } = await supabase
        .from("transactions")
        .select("*, accounts(bank_name)")
        .in("account_id", accountIds)
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

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyRevenue = transactions
    .filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && Number(t.amount) > 0;
    })
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const monthlyExpenses = transactions
    .filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && Number(t.amount) < 0;
    })
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

  return { transactions, isLoading, createTransaction, monthlyRevenue, monthlyExpenses };
}
