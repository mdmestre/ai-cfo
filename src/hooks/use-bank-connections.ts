import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./use-company";

export function useBankConnections() {
  const { company } = useCompany();
  const queryClient = useQueryClient();

  // For now, bank connections are stored as accounts with a provider field
  // This is a placeholder until Open Finance integration is built
  const { data: connections = [], isLoading } = useQuery({
    queryKey: ["bank-connections", company?.id],
    queryFn: async () => {
      // Return empty - bank connections require external API integration
      return [] as any[];
    },
    enabled: !!company,
  });

  const connectBank = useMutation({
    mutationFn: async ({ provider, institution }: { provider: string; institution: string }) => {
      // Create an account entry for the connected bank
      const { data, error } = await supabase
        .from("accounts")
        .insert({
          company_id: company!.id,
          bank_name: institution,
          account_type: "checking",
          balance: 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-connections"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const syncTransactions = useMutation({
    mutationFn: async (_connectionId: string) => {
      // Placeholder for Open Finance sync
      return {};
    },
  });

  return { connections, isLoading, connectBank, syncTransactions };
}
