import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./use-company";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useAutomationRules() {
  const { company } = useCompany();
  const { user } = useAuth();
  const qc = useQueryClient();
  const companyId = company?.id;

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["automation-rules", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_rules")
        .select("*")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["automation-logs", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_logs")
        .select("*")
        .eq("company_id", companyId!)
        .order("executed_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const createRule = useMutation({
    mutationFn: async (rule: {
      name: string;
      description: string;
      trigger_type: string;
      trigger_config: any;
      action_type: string;
      action_config: any;
    }) => {
      const { data, error } = await supabase
        .from("automation_rules")
        .insert({
          ...rule,
          company_id: companyId!,
          created_by: user!.id,
          is_active: true,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automation-rules"] });
      toast.success("Regra criada");
    },
  });

  const toggleRule = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("automation_rules")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automation-rules"] }),
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("automation_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automation-rules"] });
      toast.success("Regra excluida");
    },
  });

  const activeRules = rules.filter((r: any) => r.is_active);

  return { rules, logs, activeRules, isLoading, createRule, toggleRule, deleteRule };
}
