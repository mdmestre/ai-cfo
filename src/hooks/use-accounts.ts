import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./use-company";

export function useAccounts() {
  const { company } = useCompany();
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["accounts", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("company_id", company!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!company,
  });

  const createAccount = useMutation({
    mutationFn: async (account: { bank_name: string; account_type: string; balance: number }) => {
      const { data, error } = await supabase
        .from("accounts")
        .insert({ ...account, company_id: company!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounts"] }),
  });

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  return { accounts, isLoading, createAccount, totalBalance };
}
