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

export const ROLE_HIERARCHY: Record<AppRole, number> = {
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
        .select(`
          *,
          profiles:profiles!user_id(name, email)
        `)
        .eq("company_id", companyId!);
      if (error) throw error;
      return (data as any) as Membership[];
    },
    enabled: !!companyId,
  });

  const currentMembership = members.find((m) => m.user_id === user?.id);
  const currentRole = currentMembership?.role || null;
  const isAdmin = currentRole === "owner" || currentRole === "admin";

  const inviteMember = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: AppRole }) => {
      const { data, error } = await supabase
        .from("memberships")
        .insert({
          company_id: companyId!,
          role,
          invited_email: email,
          invited_by: user!.id,
          user_id: null,
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
      const { error } = await supabase.from("memberships").delete().eq("id", membershipId);
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
