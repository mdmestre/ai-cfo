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
      const { data: existing, error: existingErr } = await supabase
        .from("bank_connections")
        .select("id,status")
        .eq("company_id", company?.id)
        .eq("provider", "belvo")
        .eq("account_id", linkId)
        .maybeSingle();

      if (existingErr) throw existingErr;

      const status = String((existing as any)?.status || "").toLowerCase();
      const safeStatus =
        status === "connected" || status === "active" || status === "needs_attention"
          ? status
          : "connecting";

      if (existing?.id) {
        const { error } = await supabase
          .from("bank_connections")
          .update({ institution_name: institution, status: safeStatus })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("bank_connections").insert({
          company_id: company?.id,
          provider: "belvo",
          institution_name: institution,
          account_id: linkId,
          status: "connecting",
        });
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ["bank-connections"] });
    },
    [company?.id, queryClient]
  );

  const loadBelvoScript = async (): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      // @ts-expect-error belvoSDK is injected globally by Belvo's widget script
      if (window.belvoSDK) {
        // @ts-expect-error belvoSDK is injected globally by Belvo's widget script
        return resolve(window.belvoSDK);
      }
      const script = document.createElement("script");
      script.id = "belvo-widget";
      script.src = "https://cdn.belvo.io/belvo-widget-1-stable.js";
      script.async = true;
      script.onload = () => {
        // Favor belvoSDK as it's more specific
        const sdk = (window as any).belvoSDK || (window as any).belvo;
        console.log("BELVO SDK LOADED. Keys:", sdk ? Object.keys(sdk) : "null");
        resolve(sdk);
      };
      script.onerror = () => reject(new Error("Falha ao carregar o widget da Belvo"));
      document.body.appendChild(script);
    });
  };

  const openBelvoConnect = useCallback(
    async (onSuccess?: (linkId: string) => void) => {
      setIsConnecting(true);
      try {
        const accessToken = await getConnectToken();
        console.log("BELVO ACCESS TOKEN RECEIVED:", !!accessToken);
        
        if (!accessToken) {
          throw new Error("Token de acesso Belvo não retornado.");
        }

        const belvo = await loadBelvoScript();
        
        // Strictly use belvoSDK to avoid conflict with the 'belvo' DOM element
        const sdk = (window as any).belvoSDK || (belvo && !(belvo instanceof HTMLElement) ? belvo : null);
        
        if (!sdk || typeof sdk.createWidget !== 'function') {
          console.error("SDK (belvoSDK) not found or missing createWidget. window.belvo is:", (window as any).belvo);
          throw new Error("SDK da Belvo (belvoSDK) não encontrado ou inválido.");
        }

        const container = document.getElementById("belvo");
        if (!container) {
          throw new Error("Elemento <div id='belvo'></div> não encontrado no DOM.");
        }

        console.log("INITIALIZING BELVO WIDGET (STANDARD MODE)...");
        
        // Standard options as per Belvo docs
        const options = {
          container: "#belvo",
          locale: "pt",
          country_codes: ["BR"],
          institution_types: ["bank"],
          callback: async (data: any) => {
            console.log("BELVO SUCCESS:", data);
            const linkId = data?.link || data?.link_id;
            const institution = data?.institution;
            if (company && linkId) await saveConnection(linkId, institution);
            toast.info("Banco conectado!");
            triggerFullSync().catch(console.error);
            onSuccess?.(linkId);
            setIsConnecting(false);
          },
          onExit: (data: any) => {
            console.log("BELVO EXIT:", data);
            setIsConnecting(false);
          },
          onEvent: (event: any) => {
            console.log("BELVO EVENT:", event);
          }
        };

        // Call createWidget on the SDK instance
        const widget = sdk.createWidget(accessToken, options);

        if (widget && typeof widget.build === 'function') {
          console.log("BUILDING...");
          widget.build();
        } else {
          console.warn("Widget object has no .build(). It might be auto-building.");
        }

      } catch (error: any) {
        console.error("Critical Belvo Widget Error:", error);
        if (error.context && typeof error.context.json === 'function') {
           error.context.json().then((details: any) => {
               console.error("Edge function error details:", details);
           }).catch(() => {});
        }
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
