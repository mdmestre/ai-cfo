import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useProfile() {
  const { user } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Use maybeSingle to avoid 406 when profile doesn't exist
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      // Auto-create profile if missing (user signed up before trigger was set)
      if (!data) {
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User",
          })
          .select()
          .maybeSingle();

        if (insertError) {
          // If insert fails (e.g., already exists from race condition), ignore silently
          console.warn("Profile auto-create:", insertError.message);
          return null;
        }
        return newProfile;
      }

      return data;
    },
    enabled: !!user,
    retry: 1,
  });

  return { profile, isLoading };
}
