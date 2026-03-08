import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./use-company";

export function useForecasts() {
  const { company } = useCompany();

  const { data: forecasts = [], isLoading } = useQuery({
    queryKey: ["forecasts", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cashflow_forecasts")
        .select("*")
        .eq("company_id", company!.id)
        .order("forecast_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!company,
  });

  return { forecasts, isLoading };
}
