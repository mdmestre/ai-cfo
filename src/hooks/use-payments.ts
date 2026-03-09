import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./use-company";

export function usePayments() {
  const { company } = useCompany();
  const queryClient = useQueryClient();
  const companyId = company?.id;

  // PIX Keys
  const { data: pixKeys = [], isLoading: keysLoading } = useQuery({
    queryKey: ["pix-keys", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pix_keys")
        .select("*")
        .eq("company_id", companyId!)
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const createPixKey = useMutation({
    mutationFn: async (key: { key_type: string; key_value: string }) => {
      const { data, error } = await supabase
        .from("pix_keys")
        .insert({ ...key, company_id: companyId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pix-keys"] }),
  });

  // PIX Transactions
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ["pix-transactions", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pix_transactions")
        .select("*")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Generate PIX QR Code (creates transaction + QR code)
  const generatePix = useMutation({
    mutationFn: async ({ amount, description }: { amount: number; description: string }) => {
      // Create pix transaction
      const endToEndId = `E${Date.now()}${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const { data: tx, error: txError } = await supabase
        .from("pix_transactions")
        .insert({
          company_id: companyId!,
          direction: "inbound",
          amount,
          description,
          end_to_end_id: endToEndId,
          status: "pending",
        })
        .select()
        .single();
      if (txError) throw txError;

      // Create QR code
      const qrCodeData = `00020126580014br.gov.bcb.pix0136${endToEndId}5204000053039865802BR5913Atlas Finance6008SaoPaulo62070503***6304`;
      const { data: qr, error: qrError } = await supabase
        .from("pix_qr_codes")
        .insert({
          company_id: companyId!,
          pix_transaction_id: tx.id,
          amount,
          description,
          qr_code_data: qrCodeData,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        })
        .select()
        .single();
      if (qrError) throw qrError;

      return { ...tx, qrCodeString: qrCodeData, qrCodeId: qr.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pix-transactions"] });
    },
  });

  const isLoading = keysLoading || paymentsLoading;

  return { pixKeys, createPixKey, payments, generatePix, isLoading };
}
