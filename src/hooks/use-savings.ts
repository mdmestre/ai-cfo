import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./use-company";
import { toast } from "sonner";

export function useSavingsIntelligence() {
  const { company } = useCompany();
  const qc = useQueryClient();
  const companyId = company?.id;

  const { data: insights = [], isLoading } = useQuery({
    queryKey: ["savings-insights", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("savings_insights")
        .select("*")
        .eq("company_id", companyId!)
        .order("potential_savings", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const runAnalysis = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("savings-analysis", {
        body: { company_id: companyId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["savings-insights"] });
      toast.success("Savings analysis complete");
    },
    onError: (e: any) => toast.error(e.message || "Analysis failed"),
  });

  const dismissInsight = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("savings_insights")
        .update({ status: "dismissed", resolved_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["savings-insights"] }),
  });

  const activeInsights = insights.filter((i: any) => i.status === "active");
  const totalPotentialSavings = activeInsights.reduce((s: number, i: any) => s + Number(i.potential_savings), 0);
  const totalCurrentSpend = activeInsights.reduce((s: number, i: any) => s + Number(i.current_spend), 0);

  return {
    insights,
    activeInsights,
    isLoading,
    runAnalysis,
    dismissInsight,
    totalPotentialSavings,
    totalCurrentSpend,
  };
}
