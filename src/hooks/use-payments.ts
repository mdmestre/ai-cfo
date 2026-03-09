import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function usePayments() {
    const queryClient = useQueryClient();

    const generatePix = useMutation({
        mutationFn: async ({ amount, description, companyId }: { amount: number; description: string; companyId: string }) => {
            const { data } = await api.post("/payments/pix", { amount, description, company_id: companyId });
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payments"] }),
    });

    const { data: payments = [], isLoading } = useQuery({
        queryKey: ["payments"],
        queryFn: async () => {
            const { data } = await api.get("/payments");
            return data;
        },
    });

    return { generatePix, payments, isLoading };
}
