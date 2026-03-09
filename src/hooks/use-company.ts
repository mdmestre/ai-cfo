import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useCompany() {
  const { data: company, isLoading } = useQuery({
    queryKey: ["company"],
    queryFn: async () => {
      const { data } = await api.get("/company");
      return data;
    },
  });

  const queryClient = useQueryClient();

  const createCompany = useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post("/company", { name });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["company"] }),
  });

  return { company, isLoading, createCompany };
}
