import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

export function useTeam() {
    const queryClient = useQueryClient();

    const { data: members = [], isLoading } = useQuery({
        queryKey: ["team"],
        queryFn: async () => {
            const { data } = await api.get("/team");
            return data;
        },
    });

    const inviteMember = useMutation({
        mutationFn: async (inviteData: { email: string; role: string }) => {
            const { data } = await api.post("/team/invite", inviteData);
            return data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries({ queryKey: ["team"] });
        },
    });

    return { members, isLoading, inviteMember };
}
