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
        .order("name");
      if (error) {
        console.error("treasury_positions:", error.message);
        return [];
      }
      return data;
    },
    enabled: !!companyId,
    retry: false,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["yield-products", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("yield_products")
        .select("*")
        .eq("company_id", companyId!)
        .order("annual_rate", { ascending: false });
       if (error) {
         console.error("yield_products:", error.message);
         return [];
       }
       return data;
    },
    enabled: !!companyId,
    retry: false,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["yield-events", companyId],
    queryFn: async () => {
       const { data, error } = await supabase
        .from("yield_events")
        .select("*, treasury_positions(name)")
        .eq("company_id", companyId!)
        .order("event_date", { ascending: false });
       if (error) {
         console.error("yield_events:", error.message);
         return [];
       }
       return data;
    },
    enabled: !!companyId,
    retry: false,
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
      const { error } = await supabase.rpc("record_treasury_investment", {
        p_position_id: position_id,
        p_product_id: product_id,
        p_amount: amount,
      });
      if (error) throw error;
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
