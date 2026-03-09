import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./use-company";
import { toast } from "sonner";

export function useTreasury() {
  const { company } = useCompany();
  const qc = useQueryClient();
  const companyId = company?.id;

  const { data: positions = [], isLoading: positionsLoading } = useQuery({
    queryKey: ["treasury-positions", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treasury_positions")
        .select("*")
        .eq("company_id", companyId!)
        .eq("is_active", true)
        .order("balance", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["yield-products", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("yield_products")
        .select("*")
        .eq("company_id", companyId!)
        .eq("is_available", true)
        .order("annual_rate", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["yield-events", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("yield_events")
        .select("*, treasury_positions(name)")
        .eq("company_id", companyId!)
        .order("event_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const createPosition = useMutation({
    mutationFn: async (pos: {
      name: string;
      position_type: string;
      institution: string;
      balance: number;
      annual_yield_rate: number;
      maturity_date?: string;
    }) => {
      const { data, error } = await supabase
        .from("treasury_positions")
        .insert({ ...pos, company_id: companyId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treasury-positions"] });
      toast.success("Position created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const createProduct = useMutation({
    mutationFn: async (prod: {
      name: string;
      product_type: string;
      institution: string;
      annual_rate: number;
      min_investment: number;
      liquidity_days: number;
      risk_level: string;
      description?: string;
    }) => {
      const { data, error } = await supabase
        .from("yield_products")
        .insert({ ...prod, company_id: companyId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["yield-products"] });
      toast.success("Product added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const invest = useMutation({
    mutationFn: async ({ position_id, product_id, amount }: { position_id: string; product_id?: string; amount: number }) => {
      // Create event
      const { error: evErr } = await supabase.from("yield_events").insert({
        company_id: companyId!,
        position_id,
        product_id: product_id || null,
        event_type: "investment",
        amount,
        description: `Investment of ${amount}`,
      });
      if (evErr) throw evErr;

      // Update position balance
      const pos = positions.find((p: any) => p.id === position_id);
      if (pos) {
        const { error } = await supabase
          .from("treasury_positions")
          .update({ allocated_amount: Number(pos.allocated_amount) + amount })
          .eq("id", position_id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treasury-positions"] });
      qc.invalidateQueries({ queryKey: ["yield-events"] });
      toast.success("Investment recorded");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const totalBalance = positions.reduce((s: number, p: any) => s + Number(p.balance), 0);
  const totalAllocated = positions.reduce((s: number, p: any) => s + Number(p.allocated_amount), 0);
  const avgYield = positions.length > 0
    ? positions.reduce((s: number, p: any) => s + Number(p.annual_yield_rate), 0) / positions.length
    : 0;

  return {
    positions,
    products,
    events,
    isLoading: positionsLoading || productsLoading || eventsLoading,
    createPosition,
    createProduct,
    invest,
    totalBalance,
    totalAllocated,
    avgYield,
  };
}
