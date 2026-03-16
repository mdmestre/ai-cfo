import { Search, Bell, ChevronDown, Building, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/use-profile";
import { useCompany } from "@/hooks/use-company";
import { useCfoAlerts } from "@/hooks/use-cfo-alerts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";

export function TopNavbar() {
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const { company } = useCompany();
  const { alerts } = useCfoAlerts();

  const displayName = profile?.name || profile?.email || "";
  const initials = displayName
    ? displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  const actionable = alerts.filter((a) => a.severity !== "positive");
  const criticalCount = actionable.filter((a) => a.severity === "critical").length;
  const warningCount = actionable.filter((a) => a.severity === "warning").length;
  const badgeCount = criticalCount + warningCount;

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-border/60 bg-card/80 backdrop-blur-sm px-8">
      {/* Busca */}
      <div className="flex items-center gap-2 rounded-lg bg-background border border-border/50 px-3 py-1.5 w-full max-w-xs">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar..."
          className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
        />
        <kbd className="hidden rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
          Ctrl+K
        </kbd>
      </div>

      {/* Direita */}
      <div className="flex items-center gap-1.5 ml-4">
        <button className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-foreground hover:bg-secondary transition-colors">
          <Building className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="hidden sm:inline">{company?.name || "Empresa"}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>

        <div className="h-4 w-px bg-border mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors" aria-label="Alertas">
              <Bell className="h-4 w-4" />
              {badgeCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {badgeCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[360px] p-0">
            <div className="p-3">
              <DropdownMenuLabel className="px-0 py-0 text-[12px] font-bold text-foreground">
                Alertas
              </DropdownMenuLabel>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Acompanhe riscos de caixa, impostos e inadimplencia.
              </p>
            </div>
            <DropdownMenuSeparator />

            {actionable.length === 0 ? (
              <div className="p-3 text-[12px] text-muted-foreground">Nenhum alerta agora.</div>
            ) : (
              <div className="max-h-[320px] overflow-auto p-1">
                {actionable.slice(0, 6).map((a) => {
                  const tone =
                    a.severity === "critical"
                      ? "bg-destructive"
                      : a.severity === "warning"
                        ? "bg-warning"
                        : "bg-info";

                  const href = a.actionUrl || "/insights";
                  return (
                    <DropdownMenuItem key={a.id} asChild className="items-start gap-3 py-2.5">
                      <Link to={href}>
                        <span className={`mt-1 h-2 w-2 rounded-full ${tone}`} />
                        <span className="flex-1 min-w-0">
                          <span className="block text-[12px] font-semibold text-foreground">{a.title}</span>
                          <span className="mt-0.5 block text-[11px] text-muted-foreground line-clamp-2">{a.description}</span>
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </div>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/insights" className="justify-center text-[12px] font-semibold">
                Ver todos os alertas
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background text-[11px] font-semibold hover:opacity-80 transition-opacity">
          {initials}
        </button>

        <button
          onClick={signOut}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          title="Sair"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
