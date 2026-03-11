import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./use-company";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const PLUGGY_CONNECT_URL = "https://connect.pluggy.ai";

export function usePluggy() {
  const { company } = useCompany();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const getConnectToken = useCallback(async (itemId?: string) => {
    const { data, error } = await supabase.functions.invoke("pluggy-auth/connect-token", {
      body: itemId ? { itemId } : {},
    });
    if (error) throw error;
    return data.accessToken as string;
  }, []);

  const triggerFullSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("pluggy-sync");
      if (error) throw error;

      // Invalidate all relevant queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ["bank-connections"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["forecasts"] });

      return data;
    } finally {
      setIsSyncing(false);
    }
  }, [queryClient]);

  const openPluggyConnect = useCallback(
    async (onSuccess?: (itemId: string) => void) => {
      setIsConnecting(true);
      try {
        const accessToken = await getConnectToken();

        const width = 450;
        const height = 700;
        const left = window.screenX + (window.innerWidth - width) / 2;
        const top = window.screenY + (window.innerHeight - height) / 2;

        const popup = window.open(
          `${PLUGGY_CONNECT_URL}?connect_token=${accessToken}`,
          "pluggy-connect",
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
        );

        const handleMessage = async (event: MessageEvent) => {
          if (event.origin !== "https://connect.pluggy.ai") return;

          const { type, itemId } = event.data || {};

          if (type === "close" || type === "CLOSE") {
            window.removeEventListener("message", handleMessage);
            popup?.close();
            setIsConnecting(false);
          }

          if ((type === "success" || type === "ITEM_SUCCESS") && itemId) {
            window.removeEventListener("message", handleMessage);
            popup?.close();

            // Save the connection to our database
            if (company) {
              await saveConnection(itemId);
            }

            // Trigger immediate full sync to fetch accounts and transactions
            toast.info("Sincronizando dados bancários...");
            try {
              const syncResult = await triggerFullSync();
              const txCount = syncResult?.transactions || 0;
              const accCount = syncResult?.accounts || 0;
              toast.success(`Sincronização completa! ${accCount} conta(s), ${txCount} transação(ões) importadas.`);
            } catch (syncErr) {
              console.error("Post-connect sync error:", syncErr);
              toast.warning("Conexão salva, mas a sincronização será feita em breve automaticamente.");
            }

            onSuccess?.(itemId);
            setIsConnecting(false);
          }
        };

        window.addEventListener("message", handleMessage);

        const interval = setInterval(() => {
          if (popup?.closed) {
            clearInterval(interval);
            window.removeEventListener("message", handleMessage);
            setIsConnecting(false);
          }
        }, 1000);
      } catch (error) {
        console.error("Error opening Pluggy Connect:", error);
        setIsConnecting(false);
        throw error;
      }
    },
    [company, getConnectToken, queryClient, triggerFullSync]
  );

  const saveConnection = useCallback(
    async (itemId: string) => {
      if (!company) return;

      // Fetch item details from Pluggy
      const { data: items } = await supabase.functions.invoke("pluggy-auth/items");
      const item = items?.results?.find((i: { id: string }) => i.id === itemId);

      const institutionName = item?.connector?.name || "Banco conectado via Pluggy";

      const { error } = await supabase.from("bank_connections").insert({
        company_id: company.id,
        institution_name: institutionName,
        provider: "pluggy",
        status: "connected",
        last_synced_at: new Date().toISOString(),
        metadata: {
          pluggy_item_id: itemId,
          pluggy_connector_id: item?.connector?.id,
          pluggy_connector: item?.connector?.name,
          pluggy_status: item?.status,
        },
      });

      if (error) throw error;
    },
    [company]
  );

  const syncAllConnections = useCallback(async () => {
    return triggerFullSync();
  }, [triggerFullSync]);

  const getAccounts = useCallback(async (itemId: string) => {
    const { data, error } = await supabase.functions.invoke(
      `pluggy-auth/accounts?itemId=${itemId}`
    );
    if (error) throw error;
    return data.results || [];
  }, []);

  const getTransactions = useCallback(
    async (accountId: string, from?: string, to?: string) => {
      let path = `pluggy-auth/transactions?accountId=${accountId}`;
      if (from) path += `&from=${from}`;
      if (to) path += `&to=${to}`;
      const { data, error } = await supabase.functions.invoke(path);
      if (error) throw error;
      return data.results || [];
    },
    []
  );

  const deleteItem = useCallback(
    async (itemId: string) => {
      const { error } = await supabase.functions.invoke("pluggy-auth/delete-item", {
        body: { itemId },
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["bank-connections"] });
    },
    [queryClient]
  );

  const getInvestments = useCallback(async (itemId: string) => {
    const { data, error } = await supabase.functions.invoke(
      `pluggy-auth/investments?itemId=${itemId}`
    );
    if (error) throw error;
    return data.results || [];
  }, []);

  return {
    isConnecting,
    isSyncing,
    openPluggyConnect,
    syncAllConnections,
    getAccounts,
    getTransactions,
    getInvestments,
    deleteItem,
    getConnectToken,
  };
}
