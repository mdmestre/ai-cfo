import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./use-company";
import { useAuth } from "@/contexts/AuthContext";
import { sha256Hex } from "@/lib/sha256";

export function useReportHashes() {
  const { company } = useCompany();
  const { user } = useAuth();

  const registerReportHash = async (params: {
    report_type: string;
    period_start?: string | null; // YYYY-MM-DD
    period_end?: string | null; // YYYY-MM-DD
    payload: Record<string, unknown>;
  }) => {
    if (!company?.id) throw new Error("Empresa nao encontrada");
    const canonical = JSON.stringify(params.payload);
    const report_hash = await sha256Hex(canonical);

    const { error } = await supabase.from("report_hashes").insert({
      company_id: company.id,
      report_type: params.report_type,
      period_start: params.period_start ?? null,
      period_end: params.period_end ?? null,
      hash_algo: "sha256",
      report_hash,
      payload: params.payload,
      generated_by: user?.id ?? null,
    } as any);

    if (error) throw error;
    return report_hash;
  };

  return { registerReportHash };
}

