import { AppLayout } from "@/components/layout/AppLayout";
import { useCards } from "@/hooks/use-cards";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, CreditCard, Snowflake, Play, Ban, DollarSign, ShieldCheck } from "lucide-react";
import { format } from "date-fns";

const fmt = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `R$ ${(v / 1_000).toFixed(1)}K`;
  return `R$ ${v.toFixed(2)}`;
};

const Cards = () => {
  const { cards, createCard, toggleCardStatus, cardTransactions, totalSpendLimit, totalSpent, isLoading } = useCards();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ holder_name: "", card_type: "virtual", spending_limit: "" });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCard.mutateAsync({
        holder_name: form.holder_name,
        card_type: form.card_type,
        spending_limit: Number(form.spending_limit),
      });
      toast.success("Card created");
      setForm({ holder_name: "", card_type: "virtual", spending_limit: "" });
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message || "Failed");
    }
  };

  if (isLoading) {
    return <AppLayout><div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="max-w-[1200px] space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Corporate Cards</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Issue virtual cards and monitor spending</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground hover:opacity-90">
            <Plus className="h-3.5 w-3.5" /> Issue Card
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="metric-card">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <p className="text-[13px] font-medium text-muted-foreground">Active Cards</p>
            </div>
            <p className="text-2xl font-semibold text-foreground">{cards.filter((c) => c.status === "active").length}</p>
          </div>
          <div className="metric-card">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <p className="text-[13px] font-medium text-muted-foreground">Total Limit</p>
            </div>
            <p className="text-2xl font-semibold text-foreground">{fmt(totalSpendLimit)}</p>
          </div>
          <div className="metric-card bg-primary text-primary-foreground border-0">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-primary-foreground/60" />
              <p className="text-[13px] font-medium text-primary-foreground/70">Spent This Month</p>
            </div>
            <p className="text-2xl font-semibold">{fmt(totalSpent)}</p>
          </div>
        </div>

        {/* Create Card Form */}
        {showForm && (
          <form onSubmit={handleCreate} className="metric-card space-y-3 animate-slide-up">
            <p className="text-[14px] font-bold text-foreground">Issue New Card</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <input type="text" placeholder="Cardholder name" value={form.holder_name} onChange={(e) => setForm({ ...form, holder_name: e.target.value })} required className="rounded-md border border-border bg-card px-3 py-2 text-[13px] outline-none" />
              <select value={form.card_type} onChange={(e) => setForm({ ...form, card_type: e.target.value })} className="rounded-md border border-border bg-card px-3 py-2 text-[13px]">
                <option value="virtual">Virtual</option>
                <option value="physical">Physical</option>
              </select>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-[13px]">R$</span>
                <input type="number" step="0.01" placeholder="Spending limit" value={form.spending_limit} onChange={(e) => setForm({ ...form, spending_limit: e.target.value })} required className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-2 text-[13px] outline-none" />
              </div>
              <button type="submit" disabled={createCard.isPending} className="rounded-md bg-foreground px-3 py-2 text-[13px] font-medium text-background hover:opacity-90 disabled:opacity-50">
                {createCard.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" /> : "Issue"}
              </button>
            </div>
          </form>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.length === 0 ? (
            <div className="col-span-full py-12 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/10">
              <CreditCard className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <p className="text-[13px] font-medium text-muted-foreground">No cards issued yet.</p>
            </div>
          ) : (
            cards.map((card) => {
              const utilization = card.spending_limit > 0 ? (Number(card.spent_current_month) / Number(card.spending_limit)) * 100 : 0;
              return (
                <div key={card.id} className="metric-card group relative overflow-hidden">
                  {/* Card visual */}
                  <div className={`rounded-xl p-5 mb-4 ${card.status === "active" ? "bg-gradient-to-br from-primary to-primary/70" : "bg-gradient-to-br from-muted to-muted/70"} text-white`}>
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-[11px] font-bold uppercase tracking-widest opacity-70">{card.card_type}</span>
                      <CreditCard className="h-5 w-5 opacity-70" />
                    </div>
                    <p className="text-lg font-mono tracking-[0.2em] mb-4">•••• •••• •••• {card.last_four}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase opacity-60">Holder</p>
                        <p className="text-[13px] font-bold">{card.holder_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase opacity-60">Expires</p>
                        <p className="text-[13px] font-bold">{card.expires_at ? format(new Date(card.expires_at), "MM/yy") : "—"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Usage */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-muted-foreground">Spent / Limit</span>
                      <span className="font-bold text-foreground">{fmt(Number(card.spent_current_month))} / {fmt(Number(card.spending_limit))}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(utilization, 100)}%` }} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    {card.status === "active" ? (
                      <button onClick={() => toggleCardStatus.mutate({ id: card.id, status: "frozen" })} className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-[12px] font-medium text-muted-foreground hover:bg-secondary">
                        <Snowflake className="h-3 w-3" /> Freeze
                      </button>
                    ) : card.status === "frozen" ? (
                      <button onClick={() => toggleCardStatus.mutate({ id: card.id, status: "active" })} className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-[12px] font-medium text-primary hover:bg-primary/5">
                        <Play className="h-3 w-3" /> Unfreeze
                      </button>
                    ) : null}
                    {card.status !== "cancelled" && (
                      <button onClick={() => toggleCardStatus.mutate({ id: card.id, status: "cancelled" })} className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-[12px] font-medium text-destructive hover:bg-destructive/5">
                        <Ban className="h-3 w-3" /> Cancel
                      </button>
                    )}
                  </div>

                  {/* Status badge */}
                  <span className={`absolute top-3 right-3 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    card.status === "active" ? "bg-primary/10 text-primary" :
                    card.status === "frozen" ? "bg-blue-100 text-blue-600" :
                    "bg-destructive/10 text-destructive"
                  }`}>{card.status}</span>
                </div>
              );
            })
          )}
        </div>

        {/* Card Transactions */}
        {cardTransactions.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-[14px] font-bold text-foreground">Recent Card Transactions</p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Date", "Card", "Merchant", "Category", "Amount", "Status"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xxs font-medium uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cardTransactions.map((tx: any) => (
                  <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">{format(new Date(tx.transaction_date), "MMM d, HH:mm")}</td>
                    <td className="px-4 py-3 text-[13px] text-foreground">•••• {tx.cards?.last_four}</td>
                    <td className="px-4 py-3 text-[13px] font-medium text-foreground">{tx.merchant}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2 py-0.5 text-xxs font-medium">{tx.category}</span></td>
                    <td className="px-4 py-3 text-[13px] font-semibold text-foreground">{fmt(Number(tx.amount))}</td>
                    <td className="px-4 py-3"><span className={`text-xxs font-bold uppercase ${tx.status === "completed" ? "text-primary" : "text-muted-foreground"}`}>{tx.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Cards;
