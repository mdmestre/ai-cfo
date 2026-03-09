import { AppLayout } from "@/components/layout/AppLayout";
import { useTreasury } from "@/hooks/use-treasury";
import { Loader2, Plus, Landmark, TrendingUp, PiggyBank, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const fmt = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `R$${(v / 1_000).toFixed(1)}K`;
  return `R$${v.toFixed(2)}`;
};

const typeLabels: Record<string, string> = {
  cash: "Caixa",
  fixed_income: "Renda Fixa",
  money_market: "Money Market",
  cdb: "CDB",
  lci: "LCI",
  lca: "LCA",
  treasury_bond: "Tesouro Direto",
  fund: "Fundo",
};

const riskLabels: Record<string, string> = {
  low: "Baixo",
  medium: "Médio",
  high: "Alto",
};

const riskColors: Record<string, string> = {
  low: "text-success",
  medium: "text-warning",
  high: "text-destructive",
};

const eventIcons: Record<string, any> = {
  investment: ArrowUpRight,
  redemption: ArrowDownRight,
  yield_accrual: TrendingUp,
  maturity: Clock,
  auto_sweep: PiggyBank,
};

export default function Treasury() {
  const { positions, products, events, isLoading, createPosition, createProduct, totalBalance, totalAllocated, avgYield } = useTreasury();
  const [showNewPosition, setShowNewPosition] = useState(false);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [form, setForm] = useState({ name: "", position_type: "cdb", institution: "", balance: "", annual_yield_rate: "" });
  const [prodForm, setProdForm] = useState({ name: "", product_type: "cdb", institution: "", annual_rate: "", min_investment: "", liquidity_days: "1", risk_level: "low", description: "" });

  const handleCreatePosition = () => {
    if (!form.name || !form.balance) return;
    createPosition.mutate({
      name: form.name,
      position_type: form.position_type,
      institution: form.institution,
      balance: Number(form.balance),
      annual_yield_rate: Number(form.annual_yield_rate) || 0,
    });
    setForm({ name: "", position_type: "cdb", institution: "", balance: "", annual_yield_rate: "" });
    setShowNewPosition(false);
  };

  const handleCreateProduct = () => {
    if (!prodForm.name) return;
    createProduct.mutate({
      name: prodForm.name,
      product_type: prodForm.product_type,
      institution: prodForm.institution,
      annual_rate: Number(prodForm.annual_rate) || 0,
      min_investment: Number(prodForm.min_investment) || 0,
      liquidity_days: Number(prodForm.liquidity_days) || 0,
      risk_level: prodForm.risk_level,
      description: prodForm.description || undefined,
    });
    setProdForm({ name: "", product_type: "cdb", institution: "", annual_rate: "", min_investment: "", liquidity_days: "1", risk_level: "low", description: "" });
    setShowNewProduct(false);
  };

  return (
    <AppLayout>
      <div className="max-w-[1120px] space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold text-foreground tracking-tight">Tesouraria</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Gestão de caixa, produtos de rendimento e acompanhamento de investimentos.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowNewProduct(!showNewProduct)} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[13px] font-medium text-foreground hover:bg-secondary transition-colors">
              <Plus className="h-3.5 w-3.5" /> Produto
            </button>
            <button onClick={() => setShowNewPosition(!showNewPosition)} className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-[13px] font-semibold text-background hover:bg-foreground/90 transition-all">
              <Plus className="h-4 w-4" /> Posição
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="metric-card animate-slide-up">
            <p className="section-label">Saldo Total</p>
            <p className="mt-3 text-[28px] font-bold text-foreground leading-none">{fmt(totalBalance)}</p>
            <p className="mt-1 text-[12px] text-muted-foreground">{positions.length} posição(ões)</p>
          </div>
          <div className="metric-card animate-slide-up">
            <p className="section-label">Alocado</p>
            <p className="mt-3 text-[28px] font-bold text-success leading-none">{fmt(totalAllocated)}</p>
            <p className="mt-1 text-[12px] text-muted-foreground">capital investido</p>
          </div>
          <div className="metric-card animate-slide-up">
            <p className="section-label">Rendimento Médio</p>
            <p className="mt-3 text-[28px] font-bold text-foreground leading-none">{avgYield.toFixed(2)}%</p>
            <p className="mt-1 text-[12px] text-muted-foreground">taxa anual</p>
          </div>
        </div>

        {/* Formulário Nova Posição */}
        {showNewPosition && (
          <div className="metric-card animate-slide-up space-y-3">
            <h3 className="text-[14px] font-semibold text-foreground">Nova Posição</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome" className="rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground" />
              <select value={form.position_type} onChange={(e) => setForm({ ...form, position_type: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground">
                {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} placeholder="Instituição" className="rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground" />
              <input value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} placeholder="Saldo" type="number" className="rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground" />
              <input value={form.annual_yield_rate} onChange={(e) => setForm({ ...form, annual_yield_rate: e.target.value })} placeholder="Rendimento % a.a." type="number" step="0.01" className="rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground" />
            </div>
            <button onClick={handleCreatePosition} disabled={createPosition.isPending} className="rounded-lg bg-foreground px-4 py-2 text-[13px] font-semibold text-background hover:bg-foreground/90">
              {createPosition.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar"}
            </button>
          </div>
        )}

        {/* Formulário Novo Produto */}
        {showNewProduct && (
          <div className="metric-card animate-slide-up space-y-3">
            <h3 className="text-[14px] font-semibold text-foreground">Novo Produto de Rendimento</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <input value={prodForm.name} onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })} placeholder="Nome do produto" className="rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground" />
              <select value={prodForm.product_type} onChange={(e) => setProdForm({ ...prodForm, product_type: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground">
                {Object.entries(typeLabels).filter(([k]) => k !== "cash").map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input value={prodForm.institution} onChange={(e) => setProdForm({ ...prodForm, institution: e.target.value })} placeholder="Instituição" className="rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground" />
              <input value={prodForm.annual_rate} onChange={(e) => setProdForm({ ...prodForm, annual_rate: e.target.value })} placeholder="Taxa % a.a." type="number" step="0.01" className="rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground" />
              <input value={prodForm.min_investment} onChange={(e) => setProdForm({ ...prodForm, min_investment: e.target.value })} placeholder="Investimento mínimo" type="number" className="rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground" />
              <input value={prodForm.liquidity_days} onChange={(e) => setProdForm({ ...prodForm, liquidity_days: e.target.value })} placeholder="Liquidez (dias)" type="number" className="rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground" />
              <select value={prodForm.risk_level} onChange={(e) => setProdForm({ ...prodForm, risk_level: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground">
                <option value="low">Risco Baixo</option>
                <option value="medium">Risco Médio</option>
                <option value="high">Risco Alto</option>
              </select>
              <input value={prodForm.description} onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })} placeholder="Descrição" className="rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground" />
            </div>
            <button onClick={handleCreateProduct} disabled={createProduct.isPending} className="rounded-lg bg-foreground px-4 py-2 text-[13px] font-semibold text-background hover:bg-foreground/90">
              {createProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar Produto"}
            </button>
          </div>
        )}

        {/* Posições */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-6">
            <div>
              <p className="section-label mb-3">POSIÇÕES</p>
              {positions.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {positions.map((pos: any) => (
                    <div key={pos.id} className="metric-card animate-slide-up">
                      <div className="flex items-center gap-2 mb-2">
                        <Landmark className="h-4 w-4 text-accent" />
                        <h3 className="text-[14px] font-semibold text-foreground">{pos.name}</h3>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {typeLabels[pos.position_type] || pos.position_type}
                        </span>
                        {pos.institution && (
                          <span className="text-[11px] text-muted-foreground">{pos.institution}</span>
                        )}
                      </div>
                      <p className="text-[22px] font-bold text-foreground">{fmt(Number(pos.balance))}</p>
                      <div className="mt-2 flex items-center gap-4 text-[12px] text-muted-foreground">
                        <span>Alocado: <span className="font-medium text-foreground">{fmt(Number(pos.allocated_amount))}</span></span>
                        <span>Rendimento: <span className="font-medium text-success">{Number(pos.annual_yield_rate).toFixed(2)}% a.a.</span></span>
                      </div>
                      {pos.maturity_date && (
                        <p className="mt-1 text-[11px] text-muted-foreground">Vencimento: {format(new Date(pos.maturity_date), "dd/MM/yyyy", { locale: ptBR })}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="metric-card flex flex-col items-center justify-center py-12">
                  <PiggyBank className="h-8 w-8 text-muted-foreground/30 mb-3" />
                  <p className="text-[14px] font-medium text-foreground">Nenhuma posição ainda</p>
                  <p className="mt-1 text-[13px] text-muted-foreground">Adicione uma posição para começar a acompanhar.</p>
                </div>
              )}
            </div>

            {products.length > 0 && (
              <div>
                <p className="section-label mb-3">PRODUTOS DE RENDIMENTO</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((prod: any) => (
                    <div key={prod.id} className="metric-card animate-slide-up">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-[14px] font-semibold text-foreground">{prod.name}</h3>
                        <span className={`text-[12px] font-semibold ${riskColors[prod.risk_level] || "text-foreground"}`}>
                          {riskLabels[prod.risk_level] || prod.risk_level}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {typeLabels[prod.product_type] || prod.product_type}
                        </span>
                        <span className="text-[11px] text-muted-foreground">{prod.institution}</span>
                      </div>
                      <p className="text-[20px] font-bold text-success">{Number(prod.annual_rate).toFixed(2)}% a.a.</p>
                      <div className="mt-2 flex items-center gap-4 text-[12px] text-muted-foreground">
                        <span>Mín: {fmt(Number(prod.min_investment))}</span>
                        <span>Liquidez: D+{prod.liquidity_days}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {events.length > 0 && (
              <div>
                <p className="section-label mb-3">EVENTOS RECENTES</p>
                <div className="metric-card divide-y divide-border">
                  {events.map((ev: any) => {
                    const Icon = eventIcons[ev.event_type] || TrendingUp;
                    return (
                      <div key={ev.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-[13px] font-medium text-foreground">{ev.description || ev.event_type}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {ev.treasury_positions?.name} · {format(new Date(ev.event_date), "dd/MM HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <p className="text-[14px] font-semibold text-foreground">{fmt(Number(ev.amount))}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
