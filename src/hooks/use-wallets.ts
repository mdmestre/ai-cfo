import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./use-company";

export function useWallets() {
  const { company } = useCompany();

  const { data: wallets = [], isLoading } = useQuery({
    queryKey: ["wallets", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("company_id", company!.id)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!company,
  });

  const totalWalletBalance = wallets.reduce((s, w) => s + Number(w.balance), 0);

  return { wallets, isLoading, totalWalletBalance };
}
