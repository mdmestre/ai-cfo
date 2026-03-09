import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useAutomations() {
    const queryClient = useQueryClient();

    const { data: automations = [], isLoading } = useQuery({
        queryKey: ["automations"],
        queryFn: async () => {
            const { data } = await api.get("/automations");
            return data;
        },
    });

    const createAutomation = useMutation({
        mutationFn: async (automationData: any) => {
            const { data } = await api.post("/automations", automationData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["automations"] });
        },
    });

    const deleteAutomation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/automations/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["automations"] });
        },
    });

    return { automations, isLoading, createAutomation, deleteAutomation };
}
