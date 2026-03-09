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
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import atlasLogo from "@/assets/atlas-logo.png";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Cash Flow", url: "/cash-flow", icon: TrendingUp },
  { title: "Accounts", url: "/accounts", icon: Building2 },
  { title: "Transactions", url: "/transactions", icon: ArrowLeftRight },
  { title: "Ledger", url: "/ledger", icon: BookOpen },
  { title: "Payments Hub", url: "/payments", icon: Wallet },
  { title: "Expenses", url: "/expenses", icon: Receipt },
  { title: "Cards", url: "/cards", icon: CreditCard },
  { title: "Insights", url: "/insights", icon: Lightbulb },
  { title: "Financial Score", url: "/financial-score", icon: ShieldCheck },
  { title: "AI Copilot", url: "/ai-assistant", icon: Bot },
  { title: "Automation", url: "/automation", icon: Zap },
  { title: "Team", url: "/team", icon: Users },
];

const bottomItems = [
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar transition-all duration-200",
        collapsed ? "w-[64px]" : "w-[240px]"
      )}
    >
      {/* Logo area — Stripe style */}
      <div className="flex h-14 items-center gap-2.5 px-4">
        {collapsed ? (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sidebar-accent">
            <span className="text-sm font-bold text-sidebar-primary">A</span>
          </div>
        ) : (
          <img src={atlasLogo} alt="Atlas" className="h-6 brightness-0 invert" />
        )}
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-sidebar-border" />

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
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
              <item.icon className={cn("h-[18px] w-[18px] shrink-0", isActive && "text-accent")} />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-sidebar-border px-2.5 py-3 space-y-0.5">
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
              <item.icon className="h-[18px] w-[18px] shrink-0" />
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
              "h-[18px] w-[18px] shrink-0 transition-transform duration-200",
              collapsed && "rotate-180"
            )}
          />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
