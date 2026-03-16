import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./use-company";
import { useAuth } from "@/contexts/AuthContext";

export type ReconciliationStatus = "pending" | "reconciled" | "divergent";

export type ReconciliationRow = {
  id: string;
  company_id: string;
  transaction_id: string;
  ledger_entry_id: string | null;
  status: ReconciliationStatus;
  match_score: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export function useReconciliations() {
  const { company } = useCompany();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const reconciliations = useQuery({
    queryKey: ["reconciliations", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reconciliations")
        .select("*")
        .eq("company_id", company!.id)
        .order("updated_at", { ascending: false });

      // If the table doesn't exist yet (migration not applied), we fail soft.
      if (error) {
        console.warn("reconciliations:", error.message);
        return [];
      }

      return (data as any) as ReconciliationRow[];
    },
    enabled: !!company,
    retry: false,
  });

  const upsertReconciliation = useMutation({
    mutationFn: async (payload: {
      transaction_id: string;
      ledger_entry_id?: string | null;
      status: ReconciliationStatus;
      match_score?: number | null;
      notes?: string | null;
    }) => {
      const row = {
        company_id: company!.id,
        transaction_id: payload.transaction_id,
        ledger_entry_id: payload.ledger_entry_id ?? null,
        status: payload.status,
        match_score: payload.match_score ?? null,
        notes: payload.notes ?? null,
        created_by: user?.id ?? null,
      };

      const { data, error } = await supabase
        .from("reconciliations")
        .upsert(row, { onConflict: "transaction_id" })
        .select()
        .single();
      if (error) throw error;
      return data as any;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reconciliations"] }),
  });

  return { reconciliations, upsertReconciliation };
}

