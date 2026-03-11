import { Calendar, ArrowRight, Loader2 } from "lucide-react";
import { useInvoices } from "@/hooks/use-invoices";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}K`;
  return `R$ ${value.toFixed(0)}`;
};

export function UpcomingPayments() {
  const { payables } = useInvoices();
  const navigate = useNavigate();

  const openPayables = (payables.data || [])
    .filter((p) => p.status === "open")
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5);

  return (
    <div className="metric-card animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px] font-medium text-muted-foreground">Próximos Pagamentos</p>
        <button
          onClick={() => navigate("/invoices")}
          className="flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
        >
          Ver todos <ArrowRight className="h-3 w-3" />
        </button>
      </div>
      <div className="space-y-0">
        {openPayables.length > 0 ? (
          openPayables.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-foreground">
                    {(payment as any).vendor?.name || "Fornecedor"}
                  </p>
                  <p className="text-xxs text-muted-foreground">
                    {format(new Date(payment.due_date), "dd/MM")}
                  </p>
                </div>
              </div>
              <p className="text-[13px] font-semibold text-foreground">
                {formatCurrency(Number(payment.amount_due) - Number(payment.amount_paid))}
              </p>
            </div>
          ))
        ) : (
          <p className="text-[13px] text-muted-foreground py-8 text-center">Nenhum pagamento pendente.</p>
        )}
      </div>
    </div>
  );
}
