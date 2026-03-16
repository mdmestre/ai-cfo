import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./use-company";

export interface BankConnection {
  id: string;
  company_id: string;
  institution_name: string;
  provider: string;
  status: string;
  account_id: string | null;
  last_synced_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function useBankConnections() {
  const { company } = useCompany();
  const queryClient = useQueryClient();

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ["bank-connections", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_connections")
        .select("*")
        .eq("company_id", company!.id)
        .order("institution_name");
      if (error) {
        console.error("bank_connections:", error.message);
        return [];
      }
      return (data as any) as BankConnection[];
    },
    enabled: !!company,
    retry: false,
  });

  const connectBank = useMutation({
    mutationFn: async ({
      provider,
      institution,
      accountId,
    }: {
      provider: string;
      institution: string;
      accountId?: string;
    }) => {
      const { data, error } = await supabase
        .from("bank_connections")
        .insert({
          company_id: company!.id,
          provider,
          institution_name: institution,
          account_id: accountId,
          status: "connected",
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

  const disconnectBank = useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase.from("bank_connections").delete().eq("id", connectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-connections"] });
    },
  });

  const syncConnection = useMutation({
    mutationFn: async (connectionId: string) => {
      const { data, error } = await supabase.functions.invoke("sync-bank-data", {
        body: { connectionId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-connections"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  return { connections, isLoading, connectBank, disconnectBank, syncConnection };
}
