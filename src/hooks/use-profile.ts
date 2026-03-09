import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export function useProfile() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await api.get("/profile");
      return data;
    },
  });

  return { profile, isLoading };
}
