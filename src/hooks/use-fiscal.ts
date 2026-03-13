import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./use-company";
import { Database } from "@/integrations/supabase/types";

type TaxApuration = Database["public"]["Tables"]["tax_apurations"]["Row"];
type TaxItem = Database["public"]["Tables"]["tax_items"]["Row"];

export const useFiscal = () => {
  const { company } = useCompany();
  const queryClient = useQueryClient();
  const enabled = !!company?.id;

  const apurations = useQuery({
    queryKey: ["tax_apurations", company?.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tax_apurations")
        .select("*")
        .eq("company_id", company!.id)
        .order("period", { ascending: false });

      if (error) throw error;
      return data as TaxApuration[];
    },
  });

  const createApuration = useMutation({
    mutationFn: async (payload: Omit<Database["public"]["Tables"]["tax_apurations"]["Insert"], "company_id">) => {
      const { data, error } = await supabase
        .from("tax_apurations")
        .insert([{ ...payload, company_id: company!.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax_apurations"] });
    },
  });

  const updateApurationStatus = useMutation({
    mutationFn: async ({ id, status, amount_paid }: { id: string; status: string; amount_paid?: number }) => {
      const { data, error } = await supabase
        .from("tax_apurations")
        .update({ status, amount_paid })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax_apurations"] });
    },
  });

  const generateApurationsForPeriod = useMutation({
    mutationFn: async (period: string) => {
      // Aqui agregamos valores das faturas (tax_items) para o período (ex: 2023-10).
      // Mas para o MVP de frontend simulamos a lógica chamando o backend ou iterando faturas.
      // Retornaremos um mock para a UI gerenciar a apuração:
      return null;
    }
  });

  return {
    apurations,
    createApuration,
    updateApurationStatus,
    generateApurationsForPeriod,
    isLoading: apurations.isLoading,
  };
};
