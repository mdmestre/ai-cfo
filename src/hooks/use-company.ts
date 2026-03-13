import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Company {
  id: string;
  name: string;
  owner_id: string;
  created_at: string | null;
}

export function useCompany() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: company, isLoading } = useQuery({
    queryKey: ["company", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Query directly via owner_id — no circular join through memberships
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("useCompany error:", error.message);
        return null; // Return null instead of throwing to prevent infinite retries
      }
      return data as Company | null;
    },
    enabled: !!user,
    retry: false,      // Don't retry on failure — prevents console spam
    staleTime: 30000,  // Cache for 30s to prevent excessive re-fetches
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
