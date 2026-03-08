import { AppLayout } from "@/components/layout/AppLayout";
import { Search, Filter, Download, ArrowUpDown } from "lucide-react";
import { useState } from "react";

const transactions = [
  { id: 1, date: "Mar 8, 2026", vendor: "Stripe", category: "Revenue", amount: "+$42,300", account: "Operating", status: "Completed" },
  { id: 2, date: "Mar 7, 2026", vendor: "AWS", category: "Infrastructure", amount: "-$12,400", account: "Operating", status: "Completed" },
  { id: 3, date: "Mar 7, 2026", vendor: "Gusto", category: "Payroll", amount: "-$89,200", account: "Payroll", status: "Pending" },
  { id: 4, date: "Mar 6, 2026", vendor: "Hubspot", category: "Software", amount: "-$3,600", account: "Operating", status: "Completed" },
  { id: 5, date: "Mar 6, 2026", vendor: "Client - Acme Corp", category: "Revenue", amount: "+$85,000", account: "Operating", status: "Completed" },
  { id: 6, date: "Mar 5, 2026", vendor: "WeWork", category: "Rent", amount: "-$8,500", account: "Operating", status: "Completed" },
  { id: 7, date: "Mar 5, 2026", vendor: "Google Workspace", category: "Software", amount: "-$1,200", account: "Operating", status: "Completed" },
  { id: 8, date: "Mar 4, 2026", vendor: "Client - TechStart", category: "Revenue", amount: "+$28,500", account: "Operating", status: "Completed" },
  { id: 9, date: "Mar 3, 2026", vendor: "Figma", category: "Software", amount: "-$450", account: "Operating", status: "Completed" },
  { id: 10, date: "Mar 3, 2026", vendor: "Delta Airlines", category: "Travel", amount: "-$2,800", account: "Corporate Card", status: "Completed" },
];

const Transactions = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = transactions.filter(
    (t) =>
      (t.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (activeFilter === "All" || 
       (activeFilter === "Revenue" && t.amount.startsWith("+")) ||
       (activeFilter === "Expenses" && t.amount.startsWith("-")))
  );

  return (
    <AppLayout>
      <div className="max-w-[1200px] space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Transactions</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">View and manage all financial transactions</p>
          </div>
          <button className="flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-[13px] font-medium text-background hover:opacity-90 transition-opacity">
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 max-w-sm">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
          <button className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[13px] font-medium text-foreground hover:bg-secondary transition-colors">
            <Filter className="h-3.5 w-3.5" />
            Filters
          </button>
          {["All", "Revenue", "Expenses"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                cat === activeFilter
                  ? "bg-foreground text-background"
                  : "border border-border bg-card text-foreground hover:bg-secondary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Date", "Vendor", "Category", "Amount", "Account", "Status"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xxs font-medium uppercase tracking-wider text-muted-foreground">
                    <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                      {h}
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors cursor-pointer">
                  <td className="px-4 py-3 text-[13px] text-muted-foreground">{t.date}</td>
                  <td className="px-4 py-3 text-[13px] font-medium text-foreground">{t.vendor}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xxs font-medium text-secondary-foreground">
                      {t.category}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-[13px] font-semibold ${t.amount.startsWith("+") ? "text-success" : "text-foreground"}`}>
                    {t.amount}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-muted-foreground">{t.account}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xxs font-medium ${
                      t.status === "Completed" ? "bg-success/8 text-success" : "bg-warning/8 text-warning"
                    }`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
};

export default Transactions;
