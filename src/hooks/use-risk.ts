import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./use-company";
import { toast } from "sonner";

export function useRiskEngine() {
  const { company } = useCompany();
  const qc = useQueryClient();
  const companyId = company?.id;

  const { data: scores = [], isLoading: scoresLoading } = useQuery({
    queryKey: ["risk-scores", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risk_scores")
        .select("*")
        .eq("company_id", companyId!)
        .order("calculated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["risk-events", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risk_events")
        .select("*")
        .eq("company_id", companyId!)
        .order("event_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const runAnalysis = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("risk-analysis", {
        body: { companyId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["risk-scores"] });
      qc.invalidateQueries({ queryKey: ["risk-events"] });
      toast.success("Risk analysis complete");
    },
    onError: (e: any) => toast.error(e.message || "Analysis failed"),
  });

  const latestScore = scores[0] || null;

  return {
    scores,
    events,
    latestScore,
    isLoading: scoresLoading || eventsLoading,
    runAnalysis,
  };
}
