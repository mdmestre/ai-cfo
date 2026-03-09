import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";

export function useInsights(companyId?: string) {
    const query = useQuery({
        queryKey: ["insights", companyId],
        queryFn: async () => {
            if (!companyId) return null;
            const { data } = await api.get(`/insights/${companyId}`);
            return data;
        },
        enabled: !!companyId,
    });

    const chat = useMutation({
        mutationFn: async ({ message, companyId: cid }: { message: string; companyId: string }) => {
            const { data } = await api.post("/insights/chat", { message, company_id: cid });
            return data;
        },
    });

    return { ...query, chat };
}
