import { supabase } from "@/integrations/supabase/client";
import { useAccounts } from "./use-accounts";
import { toast } from "sonner";

export function useReports() {
  const { accounts } = useAccounts();

  const exportCSV = async () => {
    try {
      if (accounts.length === 0) {
        toast.error("No accounts to export");
        return;
      }
      const accountIds = accounts.map((a) => a.id);
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*")
        .in("account_id", accountIds)
        .order("date", { ascending: false });

      if (error) throw error;

      const header = "Date,Description,Category,Amount,Account ID\n";
      const rows = (transactions || [])
        .map((t) => `${t.date},${t.description},${t.category},${t.amount},${t.account_id}`)
        .join("\n");

      const blob = new Blob([header + rows], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `atlas_report_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Report downloaded successfully");
    } catch {
      toast.error("Failed to generate report");
    }
  };

  return { exportCSV };
}
