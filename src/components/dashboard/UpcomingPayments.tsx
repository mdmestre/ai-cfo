import { Calendar, ArrowRight } from "lucide-react";

const payments = [
  { vendor: "AWS Services", amount: "$12,400", date: "Mar 15", category: "Infrastructure" },
  { vendor: "Gusto Payroll", amount: "$89,200", date: "Mar 15", category: "Payroll" },
  { vendor: "Hubspot CRM", amount: "$3,600", date: "Mar 18", category: "Software" },
  { vendor: "WeWork Office", amount: "$8,500", date: "Mar 20", category: "Rent" },
  { vendor: "Google Workspace", amount: "$1,200", date: "Mar 22", category: "Software" },
];

export function UpcomingPayments() {
  return (
    <div className="metric-card animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-muted-foreground">Upcoming Payments</p>
        <button className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          View all <ArrowRight className="h-3 w-3" />
        </button>
      </div>
      <div className="space-y-3">
        {payments.map((payment, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{payment.vendor}</p>
                <p className="text-xs text-muted-foreground">{payment.date} · {payment.category}</p>
              </div>
            </div>
            <p className="text-sm font-semibold text-foreground">{payment.amount}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
