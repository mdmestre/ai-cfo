import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./use-company";

export function useAuditLogs() {
  const { company } = useCompany();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit-logs", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("company_id", company!.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
    enabled: !!company,
  });

  return { logs, isLoading };
}
