import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  TrendingUp,
  Building2,
  ArrowLeftRight,
  Lightbulb,
  ShieldCheck,
  Bot,
  Settings,
  ChevronLeft,
  BookOpen,
  Zap,
  CreditCard,
  Users,
  Receipt,
  FileText,
  Sparkles,
  Shield,
  Landmark,
  Activity,
  Scale,
  Lock,
  Calculator,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navSections = [
  {
    label: "Visão Geral",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Fluxo de Caixa", url: "/cash-flow", icon: TrendingUp },
    ],
  },
  {
    label: "Financeiro & Core",
    items: [
      { title: "Ledger Financeiro", url: "/ledger", icon: BookOpen },
      { title: "Contas (Bancos)", url: "/accounts", icon: Building2 },
      { title: "Transações", url: "/transactions", icon: ArrowLeftRight },
      { title: "Pagamentos", url: "/payments", icon: Wallet },
      { title: "Cartões", url: "/cards", icon: CreditCard },
      { title: "Tesouraria", url: "/treasury", icon: Landmark },
    ],
  },
  {
    label: "Contabilidade",
    items: [
      { title: "Plano de Contas", url: "/chart-of-accounts", icon: FileText },
      { title: "Lançamentos", url: "/journal-entries", icon: Receipt },
      { title: "DRE", url: "/dre-report", icon: Activity },
      { title: "Balanço", url: "/balance-sheet", icon: Scale },
      { title: "Fechamento", url: "/accounting-closing", icon: Lock },
    ],
  },
  {
    label: "Fiscal",
    items: [
      { title: "Faturas e Notas", url: "/invoices", icon: FileText },
      { title: "Despesas", url: "/expenses", icon: Receipt },
      { title: "Apuração de Impostos", url: "/taxes", icon: Calculator },
    ],
  },
  {
    label: "Inteligência & IA",
    items: [
      { title: "AI Copilot", url: "/ai-assistant", icon: Bot },
      { title: "Economias", url: "/savings", icon: Sparkles },
      { title: "Riscos", url: "/risk", icon: Shield },
      { title: "Insights", url: "/insights", icon: Lightbulb },
      { title: "Score", url: "/financial-score", icon: ShieldCheck },
      { title: "Automação", url: "/automation", icon: Zap },
    ],
  },
];

const bottomItems = [
  { title: "Equipe", url: "/team", icon: Users },
  { title: "Configurações", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar transition-all duration-200",
        collapsed ? "w-[60px]" : "w-[220px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center px-4">
        {collapsed ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
            <span className="text-[11px] font-bold text-accent-foreground">A</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
              <span className="text-[11px] font-bold text-accent-foreground">A</span>
            </div>
            <span className="text-[15px] font-semibold text-sidebar-primary tracking-tight">Atlas</span>
          </div>
        )}
      </div>

      {/* Nav sections */}
      <nav className="flex-1 px-2.5 py-1 overflow-y-auto space-y-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {navSections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="px-3 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-sidebar-muted">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    title={collapsed ? item.title : undefined}
                    className={cn(
                      "sidebar-item",
                      isActive ? "sidebar-item-active" : "sidebar-item-inactive"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-accent")} />
                    {!collapsed && <span>{item.title}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-sidebar-border px-2.5 py-2.5 space-y-0.5">
        {bottomItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <Link
              key={item.title}
              to={item.url}
              className={cn(
                "sidebar-item",
                isActive ? "sidebar-item-active" : "sidebar-item-inactive"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-item sidebar-item-inactive w-full"
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 shrink-0 transition-transform duration-200",
              collapsed && "rotate-180"
            )}
          />
          {!collapsed && <span className="text-[12px]">Recolher</span>}
        </button>
      </div>
    </aside>
  );
}
