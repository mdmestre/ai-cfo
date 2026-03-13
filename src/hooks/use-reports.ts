import { supabase } from "@/integrations/supabase/client";
import { useAccounts } from "./use-accounts";
import { toast } from "sonner";

export function useReports() {
  const { accounts } = useAccounts();

  const exportCSV = async () => {
    try {
      const accountIds = (accounts as any[]).map((a) => a.id);
      if (accountIds.length === 0) {
        toast.error("No accounts connected");
        return;
      }

      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*")
        .in("account_id", accountIds)
        .order("date", { ascending: false });

      if (error) throw error;

      if (!transactions || transactions.length === 0) {
        toast.error("No data to export");
        return;
      }

      const headers = ["Data", "Descrição", "Categoria", "Valor", "Status"];
      const rows = (transactions as any[]).map((t) => [
        t.date,
        t.description,
        t.category,
        t.amount,
        t.status,
      ]);

      const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `report-${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate report");
    }
  };

  return { exportCSV };
}
