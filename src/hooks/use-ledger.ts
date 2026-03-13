import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./use-company";
import { useAuth } from "@/contexts/AuthContext";

export function useLedger() {
  const { company } = useCompany();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const companyId = company?.id;

  const { data: ledgerAccounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ["ledger-accounts", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ledger_accounts")
        .select("*")
        .eq("company_id", companyId!)
        .order("code");
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
    retry: false,
  });

  const createLedgerAccount = useMutation({
    mutationFn: async (account: { code: string; name: string; account_type: string }) => {
      const { data, error } = await supabase
        .from("ledger_accounts")
        .insert({ ...account, company_id: companyId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ledger-accounts"] }),
  });

  const { data: wallets = [], isLoading: walletsLoading } = useQuery({
    queryKey: ["wallets", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("company_id", companyId!)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const createWallet = useMutation({
    mutationFn: async (wallet: { name: string; wallet_type: string }) => {
      const { data, error } = await supabase
        .from("wallets")
        .insert({ ...wallet, company_id: companyId!, balance: 0 })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wallets"] }),
  });

  const { data: journalEntries = [], isLoading: journalLoading } = useQuery({
    queryKey: ["journal-entries", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ledger_entries")
        .select("*, ledger_entry_lines(*, ledger_accounts(name))")
        .eq("company_id", companyId!)
        .order("entry_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const createJournalEntry = useMutation({
    mutationFn: async (entry: {
      description: string;
      reference?: string;
      entry_date?: string;
      lines: { ledger_account_id: string; debit: number; credit: number }[];
    }) => {
      const { data: mainEntry, error: mainErr } = await supabase
        .from("ledger_entries")
        .insert({
          company_id: companyId!,
          description: entry.description,
          reference: entry.reference,
          entry_date: entry.entry_date || new Date().toISOString(),
          created_by: user!.id,
        })
        .select()
        .single();

      if (mainErr) throw mainErr;

      const linesToInsert = entry.lines.map((l) => ({
        ledger_entry_id: (mainEntry as any).id,
        ...l,
      }));

      const { error: linesErr } = await supabase.from("ledger_entry_lines").insert(linesToInsert);
      if (linesErr) throw linesErr;

      return mainEntry;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["journal-entries"] }),
  });

  const totalWalletBalance = wallets.reduce((s: number, w: any) => s + Number(w.balance), 0);

  return {
    ledgerAccounts, accountsLoading, createLedgerAccount,
    wallets, walletsLoading, createWallet,
    journalEntries, journalLoading, createJournalEntry,
    totalWalletBalance,
    isLoading: accountsLoading || walletsLoading || journalLoading,
  };
}
