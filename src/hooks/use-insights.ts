import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useInsights(companyId?: string) {
    const query = useQuery({
        queryKey: ["insights", companyId],
        queryFn: async () => {
            if (!companyId) return null;
            
            // Substituído temporariamente chamada ao backend localhost:3001
            // por dados da tabela savings_insights, para evitar ERR_CONNECTION_REFUSED
            const { data, error } = await supabase
              .from('savings_insights')
              .select('*')
              .eq('company_id', companyId);
              
            if (error) {
               console.error("Insights error:", error.message);
               return [];
            }
            return data;
        },
        enabled: !!companyId,
        retry: false, // Prevents infinite console spam
    });

    const chat = useMutation({
        mutationFn: async ({ message, companyId: cid }: { message: string; companyId: string }) => {
            // Em vez de chamar api.post no Localhost, chamamos a Supabase Edge Function
            const { data, error } = await supabase.functions.invoke('ai-chat', {
              body: { message, company_id: cid }
            });
            if (error) throw error;
            return data;
        },
    });

    return { ...query, chat };
}
