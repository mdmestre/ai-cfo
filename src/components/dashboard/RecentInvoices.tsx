import { FileText, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface Invoice {
  id: string;
  invoice_number: string;
  direction: string;
  status: string;
  total_amount: number;
  due_date: string;
  customer?: { name: string } | null;
  vendor?: { name: string } | null;
}

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-info/10 text-info",
  paid: "bg-success/10 text-success",
  overdue: "bg-destructive/10 text-destructive",
  partial: "bg-warning/10 text-warning",
};

export function RecentInvoices({ invoices }: { invoices: Invoice[] }) {
  const navigate = useNavigate();
  const recent = invoices.slice(0, 5);

  return (
    <div className="metric-card animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-[13px] font-medium text-muted-foreground">Recent Invoices</p>
        </div>
        <button
          onClick={() => navigate("/invoices")}
          className="text-[11px] font-medium text-primary hover:underline"
        >
          View all
        </button>
      </div>
      {recent.length > 0 ? (
        <div className="space-y-0">
          {recent.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-3">
                <div className={`rounded-md p-1.5 ${inv.direction === "receivable" ? "bg-success/8" : "bg-primary/8"}`}>
                  {inv.direction === "receivable" ? (
                    <ArrowDownLeft className="h-3 w-3 text-success" />
                  ) : (
                    <ArrowUpRight className="h-3 w-3 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-[13px] font-medium text-foreground">
                    {inv.invoice_number}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {inv.customer?.name || inv.vendor?.name || "—"} · Due {format(new Date(inv.due_date), "MMM dd")}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[13px] font-semibold text-foreground">{formatCurrency(Number(inv.total_amount))}</p>
                <span className={`inline-block mt-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${statusColors[inv.status] || statusColors.draft}`}>
                  {inv.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-muted-foreground py-8 text-center">No invoices yet. Create your first invoice.</p>
      )}
    </div>
  );
}
