import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./use-company";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useBelvo() {
  const { company } = useCompany();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const getConnectToken = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("belvo-token");
    if (error) throw error;
    return data.access;
  }, []);

  const triggerFullSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("belvo-sync", {
        body: { companyId: company?.id },
      });
      if (error) throw error;
      return data;
    } finally {
      setIsSyncing(false);
    }
  }, [company?.id]);

  const saveConnection = useCallback(
    async (linkId: string, institution: string) => {
      const { error } = await supabase.from("bank_connections").insert({
        company_id: company?.id,
        provider: "belvo",
        institution_name: institution,
        account_id: linkId,
        status: "active",
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["bank-connections"] });
    },
    [company?.id, queryClient]
  );

  const loadBelvoScript = async (): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      // @ts-expect-error Belvo is injected globally
      if (window.belvo) {
        // @ts-expect-error Belvo is injected globally
        return resolve(window.belvo);
      }
      const script = document.createElement("script");
      script.src = "https://cdn.belvo.io/belvo-widget-1.x.x.js";
      script.async = true;
      script.onload = () => {
        // @ts-expect-error Belvo is injected globally
        resolve(window.belvo);
      };
      script.onerror = () => reject(new Error("Failed to load Belvo widget script"));
      document.body.appendChild(script);
    });
  };

  const openBelvoConnect = useCallback(
    async (onSuccess?: (linkId: string) => void) => {
      setIsConnecting(true);
      try {
        const accessToken = await getConnectToken();
        const belvo = await loadBelvoScript();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (belvo as any).createWidget(accessToken, {
          locale: "pt",
          callback: async (link: string, institution: string) => {
            // Success handler
            if (company) {
              await saveConnection(link, institution);
            }

            toast.info("Sincronizando dados bancários...");
            try {
              await triggerFullSync();
              toast.success(`Sincronização iniciada com sucesso!`);
            } catch (syncErr) {
              console.error("Post-connect sync error:", syncErr);
              toast.warning("Conexão salva, mas a sincronização será feita em breve.");
            }

            onSuccess?.(link);
            setIsConnecting(false);
          },
          onExit: () => {
            // Exit handler
            setIsConnecting(false);
          },
          onEvent: (event: unknown) => {
            // Optional event logging
            console.log(event);
          }
        }).build();

      } catch (error) {
        console.error("Error opening Belvo Connect:", error);
        toast.error("Processo interrompido ou falhou.");
        setIsConnecting(false);
        throw error;
      }
    },
    [company, getConnectToken, triggerFullSync, saveConnection]
  );


  const syncAllConnections = useCallback(async () => {
    return triggerFullSync();
  }, [triggerFullSync]);

  const deleteItem = useCallback(
    async (itemId: string) => {
      const { error } = await supabase
        .from("bank_connections")
        .delete()
        .eq("account_id", itemId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["bank-connections"] });
    },
    [queryClient]
  );

  return {
    isConnecting,
    isSyncing,
    openBelvoConnect,
    syncAllConnections,
    deleteItem,
  };
}
