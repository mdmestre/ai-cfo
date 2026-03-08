import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccounts } from "./use-accounts";
import type { TablesInsert } from "@/integrations/supabase/types";

export function useTransactions() {
  const { accounts } = useAccounts();
  const accountIds = accounts.map((a) => a.id);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions", accountIds],
    queryFn: async () => {
      if (accountIds.length === 0) return [];
      const { data, error } = await supabase
        .from("transactions")
        .select("*, accounts(bank_name, account_type)")
        .in("account_id", accountIds)
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: accountIds.length > 0,
  });

  const queryClient = useQueryClient();

  const createTransaction = useMutation({
    mutationFn: async (tx: TablesInsert<"transactions">) => {
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

  const monthlyRevenue = transactions
    .filter((t) => {
      const d = new Date(t.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.amount > 0;
    })
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const monthlyExpenses = transactions
    .filter((t) => {
      const d = new Date(t.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.amount < 0;
    })
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

  return { transactions, isLoading, createTransaction, monthlyRevenue, monthlyExpenses };
}
