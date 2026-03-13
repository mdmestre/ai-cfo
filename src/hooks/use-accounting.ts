import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "./use-company";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type ChartOfAccount = Database["public"]["Tables"]["chart_of_accounts"]["Row"];
type AccountingPeriod = Database["public"]["Tables"]["accounting_periods"]["Row"];
type JournalEntry = Database["public"]["Tables"]["journal_entries"]["Row"] & {
  journal_lines?: Database["public"]["Tables"]["journal_lines"]["Row"][];
};

export const useAccounting = () => {
  const { user } = useAuth();
  const { company } = useCompany();
  const queryClient = useQueryClient();

  const enabled = !!user && !!company?.id;

  // --- CHART OF ACCOUNTS ---
  const accounts = useQuery({
    queryKey: ["chart_of_accounts", company?.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .eq("company_id", company!.id)
        .order("code", { ascending: true });

      if (error) throw error;
      return data as ChartOfAccount[];
    },
  });

  const createAccount = useMutation({
    mutationFn: async (newAccount: Omit<Database["public"]["Tables"]["chart_of_accounts"]["Insert"], "company_id">) => {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .insert([{ ...newAccount, company_id: company!.id }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart_of_accounts"] });
    },
  });

  // --- ACCOUNTING PERIODS ---
  const periods = useQuery({
    queryKey: ["accounting_periods", company?.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounting_periods")
        .select("*")
        .eq("company_id", company!.id)
        .order("period_start", { ascending: false });

      if (error) throw error;
      return data as AccountingPeriod[];
    },
  });

  const createPeriod = useMutation({
    mutationFn: async (newPeriod: Omit<Database["public"]["Tables"]["accounting_periods"]["Insert"], "company_id">) => {
      const { data, error } = await supabase
        .from("accounting_periods")
        .insert([{ ...newPeriod, company_id: company!.id }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounting_periods"] });
    },
  });

  const updatePeriodStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "open" | "closing" | "closed" }) => {
      const updates: any = { status };
      if (status === "closed") {
        updates.closed_at = new Date().toISOString();
        updates.closed_by = user!.id;
      }
      
      const { data, error } = await supabase
        .from("accounting_periods")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounting_periods"] });
    },
  });

  // --- JOURNAL ENTRIES ---
  const journalEntries = useQuery({
    queryKey: ["journal_entries", company?.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entries")
        .select(`
          *,
          journal_lines (*)
        `)
        .eq("company_id", company!.id)
        .order("entry_date", { ascending: false });

      if (error) throw error;
      return data as JournalEntry[];
    },
  });

  const createJournalEntry = useMutation({
    mutationFn: async (payload: {
      description: string;
      entry_date: string;
      reference_type?: string;
      reference_id?: string;
      is_auto_suggested?: boolean;
      lines: { account_id: string; debit?: number; credit?: number }[];
    }) => {
      // Find the right period
      let periodId: string | null = null;
      if (payload.entry_date) {
        const entryDate = new Date(payload.entry_date);
        const activePeriods = queryClient.getQueryData<AccountingPeriod[]>(["accounting_periods", company?.id]) || [];
        
        const foundPeriod = activePeriods.find(p => {
          const start = new Date(p.period_start);
          const end = new Date(p.period_end);
          return entryDate >= start && entryDate <= end;
        });

        if (foundPeriod) {
          if (foundPeriod.status === "closed") {
            throw new Error("O período contábil para esta data já está fechado.");
          }
          periodId = foundPeriod.id;
        }
      }

      // Insert Journal Entry
      const { data: entry, error: entryError } = await supabase
        .from("journal_entries")
        .insert([{
          company_id: company!.id,
          description: payload.description,
          entry_date: payload.entry_date,
          reference_type: payload.reference_type,
          reference_id: payload.reference_id,
          is_auto_suggested: payload.is_auto_suggested,
          created_by: user!.id,
          accounting_period_id: periodId,
        }])
        .select()
        .single();

      if (entryError) throw entryError;

      // Insert Journal Lines
      if (payload.lines.length > 0) {
        const linesData = payload.lines.map(line => ({
          journal_entry_id: entry.id,
          account_id: line.account_id,
          debit: line.debit || 0,
          credit: line.credit || 0
        }));

        const { error: linesError } = await supabase
          .from("journal_lines")
          .insert(linesData);

        if (linesError) throw linesError;
      }

      return entry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal_entries"] });
    },
  });

  return {
    // Data
    accounts,
    periods,
    journalEntries,
    
    // Mutations
    createAccount,
    createPeriod,
    updatePeriodStatus,
    createJournalEntry,
    
    // State
    isLoading: accounts.isLoading || periods.isLoading || journalEntries.isLoading,
  };
};
