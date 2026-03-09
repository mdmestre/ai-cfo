import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useBankConnections() {
    const queryClient = useQueryClient();

    const { data: connections = [], isLoading } = useQuery({
        queryKey: ["bank-connections"],
        queryFn: async () => {
            const { data } = await api.get("/bank-connections");
            return data;
        },
    });

    const connectBank = useMutation({
        mutationFn: async ({ provider, institution }: { provider: string; institution: string }) => {
            const { data } = await api.post("/bank-connections", { provider, institution });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bank-connections"] });
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
        },
    });

    const syncTransactions = useMutation({
        mutationFn: async (connectionId: string) => {
            const { data } = await api.post(`/bank-connections/${connectionId}/sync`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
        },
    });

    return { connections, isLoading, connectBank, syncTransactions };
}
