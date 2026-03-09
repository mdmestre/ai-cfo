import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useCompany() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: company, isLoading } = useQuery({
    queryKey: ["company", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("owner_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createCompany = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("companies")
        .insert({ name, owner_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["company"] }),
  });

  return { company, isLoading, createCompany };
}
