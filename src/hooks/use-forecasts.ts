import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./use-company";

export function useForecasts() {
  const { company } = useCompany();

  const { data: forecasts = [], isLoading } = useQuery({
    queryKey: ["forecasts", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_flow_forecasts")
        .select("*")
        .eq("company_id", company!.id)
        .order("forecast_date");
      if (error) {
        console.error("cash_flow_forecasts:", error.message);
        return [];
      }
      return data;
    },
    enabled: !!company,
    retry: false,
  });

  return { forecasts, isLoading };
}
