import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useTransactions() {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data } = await api.get("/transactions");
      return data;
    },
  });

  const queryClient = useQueryClient();

  const createTransaction = useMutation({
    mutationFn: async (tx: any) => {
      const { data } = await api.post("/transactions", tx);
      return data;
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

  return { transactions, isLoading, createTransaction, monthlyRevenue, monthlyExpenses };
}
