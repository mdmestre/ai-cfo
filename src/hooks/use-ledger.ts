import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./use-company";
import { useAuth } from "@/contexts/AuthContext";

export function useLedger() {
  const { company } = useCompany();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const companyId = company?.id;

  // Ledger Accounts (Chart of Accounts)
  const { data: ledgerAccounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ["ledger-accounts", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ledger_accounts")
        .select("*")
        .eq("company_id", companyId!)
        .eq("is_active", true)
        .order("code");
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const createLedgerAccount = useMutation({
    mutationFn: async (account: { code: string; name: string; account_type: string; parent_id?: string }) => {
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

  // Wallets
  const { data: wallets = [], isLoading: walletsLoading } = useQuery({
    queryKey: ["wallets", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("company_id", companyId!)
        .eq("is_active", true)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const createWallet = useMutation({
    mutationFn: async (wallet: { name: string; wallet_type: string; currency?: string }) => {
      const { data, error } = await supabase
        .from("wallets")
        .insert({ ...wallet, company_id: companyId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wallets"] }),
  });

  // Journal Entries with lines
  const { data: journalEntries = [], isLoading: journalLoading } = useQuery({
    queryKey: ["journal-entries", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*, ledger_entries(*, ledger_accounts(code, name))")
        .eq("company_id", companyId!)
        .order("entry_date", { ascending: false })
        .limit(100);
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
      lines: { ledger_account_id: string; debit: number; credit: number; description?: string }[];
    }) => {
      // Validate: total debits must equal total credits
      const totalDebit = entry.lines.reduce((s, l) => s + l.debit, 0);
      const totalCredit = entry.lines.reduce((s, l) => s + l.credit, 0);
      if (Math.abs(totalDebit - totalCredit) > 0.001) {
        throw new Error(`Entry must balance: debits (${totalDebit}) ≠ credits (${totalCredit})`);
      }

      // Create journal entry
      const { data: je, error: jeError } = await supabase
        .from("journal_entries")
        .insert({
          company_id: companyId!,
          description: entry.description,
          reference: entry.reference,
          entry_date: entry.entry_date || new Date().toISOString().split("T")[0],
          created_by: user!.id,
        })
        .select()
        .single();
      if (jeError) throw jeError;

      // Create ledger entries
      const ledgerLines = entry.lines.map((l) => ({
        journal_entry_id: je.id,
        ledger_account_id: l.ledger_account_id,
        debit: l.debit,
        credit: l.credit,
        description: l.description || "",
      }));

      const { error: leError } = await supabase.from("ledger_entries").insert(ledgerLines);
      if (leError) throw leError;

      return je;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
    },
  });

  const totalWalletBalance = wallets.reduce((s, w) => s + Number(w.balance), 0);

  return {
    ledgerAccounts,
    accountsLoading,
    createLedgerAccount,
    wallets,
    walletsLoading,
    createWallet,
    journalEntries,
    journalLoading,
    createJournalEntry,
    totalWalletBalance,
    isLoading: accountsLoading || walletsLoading || journalLoading,
  };
}
