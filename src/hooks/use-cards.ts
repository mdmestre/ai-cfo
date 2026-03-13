import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./use-company";
import { useAuth } from "@/contexts/AuthContext";

export function useCards() {
  const { company } = useCompany();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const companyId = company?.id;

  const { data: cards = [], isLoading: cardsLoading } = useQuery({
    queryKey: ["cards", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cards")
        .select("*")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("cards:", error.message);
        return [];
      }
      return data;
    },
    enabled: !!companyId,
    retry: false,
  });

  const createCard = useMutation({
    mutationFn: async (card: { holder_name: string; card_type: string; spending_limit: number }) => {
      const { data, error } = await supabase
        .from("cards")
        .insert({
          ...card,
          company_id: companyId!,
          holder_id: user!.id,
          status: "active",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cards"] }),
  });

  const toggleCardStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("cards").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cards"] }),
  });

  // Card transactions
  const cardIds = cards.map((c) => c.id);
  const { data: cardTransactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["card-transactions", cardIds],
    queryFn: async () => {
      if (cardIds.length === 0) return [];
      const { data, error } = await supabase
        .from("card_transactions")
        .select("*, cards(institution)")
        .in("card_id", cardIds)
        .order("transaction_date", { ascending: false });
      if (error) {
        console.error("card_transactions:", error.message);
        return [];
      }
      return data;
    },
    enabled: cardIds.length > 0,
    retry: false,
  });

  const totalSpendLimit = cards.filter((c) => c.status === "active").reduce((s, c) => s + Number(c.spending_limit), 0);
  const totalSpent = cards.reduce((s, c) => s + Number(c.spent_current_month), 0);

  return {
    cards,
    cardsLoading,
    createCard,
    toggleCardStatus,
    cardTransactions,
    txLoading,
    totalSpendLimit,
    totalSpent,
    isLoading: cardsLoading || txLoading,
  };
}
