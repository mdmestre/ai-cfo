import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useCompany() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query companies where user has a membership (not just owner)
  const { data: company, isLoading } = useQuery({
    queryKey: ["company", user?.id],
    queryFn: async () => {
      // First try via memberships
      const { data: memberships, error: memErr } = await supabase
        .from("memberships")
        .select("company_id, role, companies(*)")
        .eq("user_id", user!.id)
        .limit(1)
        .maybeSingle();

      if (memErr) {
        // Fallback to owner_id query for backwards compat
        const { data, error } = await supabase
          .from("companies")
          .select("*")
          .eq("owner_id", user!.id)
          .maybeSingle();
        if (error) throw error;
        return data;
      }

      if (memberships?.companies) {
        return memberships.companies as any;
      }

      // Fallback
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
      // Membership is auto-created by trigger
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["company"] }),
  });

  return { company, isLoading, createCompany };
}
