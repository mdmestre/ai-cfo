import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useAccounts() {
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data } = await api.get("/accounts");
      return data;
    },
  });

  const queryClient = useQueryClient();

  const createAccount = useMutation({
    mutationFn: async (account: any) => {
      const { data } = await api.post("/accounts", account);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounts"] }),
  });

  const totalBalance = accounts.reduce((sum: number, a: any) => sum + Number(a.balance), 0);

  return { accounts, isLoading, createAccount, totalBalance };
}
