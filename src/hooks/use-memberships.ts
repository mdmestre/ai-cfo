import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./use-company";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type AppRole = "owner" | "admin" | "member" | "viewer";

export interface Membership {
  id: string;
  user_id: string;
  company_id: string;
  role: AppRole;
  invited_by: string | null;
  invited_email: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { name: string; email: string } | null;
}

const ROLE_HIERARCHY: Record<AppRole, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

export function useMemberships() {
  const { company } = useCompany();
  const { user } = useAuth();
  const qc = useQueryClient();
  const companyId = company?.id;

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["memberships", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memberships")
        .select("*")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: true });
      if (error) throw error;

      // Enrich with profile data
      const userIds = (data || []).map((m: any) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, email")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      return (data || []).map((m: any) => ({
        ...m,
        profiles: profileMap.get(m.user_id) || null,
      })) as Membership[];
    },
    enabled: !!companyId,
  });

  const currentMembership = members.find((m) => m.user_id === user?.id);
  const currentRole = currentMembership?.role || null;
  const isAdmin = currentRole === "owner" || currentRole === "admin";

  const inviteMember = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: AppRole }) => {
      // Look up user by email in profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", email)
        .maybeSingle();

      if (!profile) {
        throw new Error("No user found with that email. They must sign up first.");
      }

      // Check if already a member
      const existing = members.find((m) => m.user_id === profile.user_id);
      if (existing) {
        throw new Error("This user is already a member of this company.");
      }

      const { data, error } = await supabase
        .from("memberships")
        .insert({
          user_id: profile.user_id,
          company_id: companyId!,
          role,
          invited_by: user!.id,
          invited_email: email,
          accepted_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["memberships"] });
      toast.success("Member added successfully");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateRole = useMutation({
    mutationFn: async ({ membershipId, newRole }: { membershipId: string; newRole: AppRole }) => {
      const target = members.find((m) => m.id === membershipId);
      if (!target) throw new Error("Member not found");
      if (target.role === "owner") throw new Error("Cannot change owner role");
      if (newRole === "owner") throw new Error("Cannot promote to owner");

      const { error } = await supabase
        .from("memberships")
        .update({ role: newRole })
        .eq("id", membershipId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["memberships"] });
      toast.success("Role updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeMember = useMutation({
    mutationFn: async (membershipId: string) => {
      const target = members.find((m) => m.id === membershipId);
      if (!target) throw new Error("Member not found");
      if (target.role === "owner") throw new Error("Cannot remove the owner");
      if (target.user_id === user?.id) throw new Error("Cannot remove yourself");

      const { error } = await supabase
        .from("memberships")
        .delete()
        .eq("id", membershipId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["memberships"] });
      toast.success("Member removed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return {
    members,
    isLoading,
    currentRole,
    isAdmin,
    inviteMember,
    updateRole,
    removeMember,
    ROLE_HIERARCHY,
  };
}
