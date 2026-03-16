import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./use-company";
import { Database } from "@/integrations/supabase/types";
import { format } from "date-fns";

type TaxApuration = Database["public"]["Tables"]["tax_apurations"]["Row"];

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
    mutationFn: async (input: { period: string; simplesRate?: number }) => {
      const period = input.period;
      const simplesRate = input.simplesRate ?? 0.06; // 6% default (configurable later)

      const [yearStr, monthStr] = period.split("-");
      const year = Number(yearStr);
      const month = Number(monthStr);
      if (!year || !month) throw new Error("Periodo invalido");

      const periodStart = `${period}-01`;
      const nextMonthDate = new Date(year, month, 1); // month here is already next month (JS Date is 0-based)
      const nextMonthStart = format(nextMonthDate, "yyyy-MM-dd");

      const { data: invoices, error: invErr } = await supabase
        .from("invoices")
        .select("direction, total_amount, invoice_date")
        .eq("company_id", company!.id)
        .gte("invoice_date", periodStart)
        .lt("invoice_date", nextMonthStart);

      if (invErr) throw invErr;

      const revenue = (invoices || [])
        .filter((i: any) => i.direction === "receivable")
        .reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0);

      const estimatedSimples = Math.max(0, revenue * simplesRate);
      const dueDate = format(new Date(year, month, 20), "yyyy-MM-dd"); // 20th of next month

      const { data: existing, error: exErr } = await supabase
        .from("tax_apurations")
        .select("id, status")
        .eq("company_id", company!.id)
        .eq("period", period)
        .eq("tax_type", "Simples Nacional")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (exErr) throw exErr;

      if (existing?.id) {
        if (String(existing.status || "").toLowerCase() !== "paid") {
          const { error } = await supabase
            .from("tax_apurations")
            .update({ amount_due: estimatedSimples, due_date: dueDate, status: "open" })
            .eq("id", existing.id);
          if (error) throw error;
        }
      } else {
        const { error } = await supabase
          .from("tax_apurations")
          .insert({
            company_id: company!.id,
            period,
            tax_type: "Simples Nacional",
            amount_due: estimatedSimples,
            amount_paid: 0,
            due_date: dueDate,
            status: "open",
          });
        if (error) throw error;
      }

      return { revenue, estimatedSimples, dueDate };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax_apurations"] });
    },
  });

  return {
    apurations,
    createApuration,
    updateApurationStatus,
    generateApurationsForPeriod,
    isLoading: apurations.isLoading,
  };
};

