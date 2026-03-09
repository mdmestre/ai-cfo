import { Building2, Plus, CheckCircle2, Unplug, RefreshCw, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface BankConnectionCardProps {
  institution: string;
  provider: string;
  status: "connected" | "not_connected";
  lastSynced?: string | null;
  isConnecting?: boolean;
  isSyncing?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onSync?: () => void;
}

const providerLogos: Record<string, string> = {
  "Itaú Unibanco": "🟠",
  "Nubank": "🟣",
  "Bradesco": "🔴",
  "Banco do Brasil": "🟡",
  "Santander": "🔴",
  "Inter": "🟠",
  "C6 Bank": "⚫",
  "BTG Pactual": "🔵",
  "JP Morgan Chase": "🔵",
  "Bank of America": "🔴",
  "Citibank": "🔵",
  "HSBC": "🔴",
};

const providerLabels: Record<string, string> = {
  open_finance_br: "Open Finance Brasil",
  plaid: "Plaid",
  manual: "Manual",
};

export function BankConnectionCard({
  institution,
  provider,
  status,
  lastSynced,
  isConnecting,
  isSyncing,
  onConnect,
  onDisconnect,
  onSync,
}: BankConnectionCardProps) {
  const logo = providerLogos[institution] || "🏦";
  const connected = status === "connected";

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border bg-card p-5 transition-all",
        connected
          ? "border-success/30 shadow-sm"
          : "border-border hover:border-primary/30 hover:shadow-md"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl text-xl transition-colors",
              connected ? "bg-success/10" : "bg-secondary"
            )}
          >
            {logo}
          </div>
          <div>
            <p className="text-[14px] font-bold text-foreground">{institution}</p>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <span className="uppercase tracking-wider">
                {providerLabels[provider] || provider}
              </span>
            </div>
          </div>
        </div>

        {connected && (
          <div className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5">
            <CheckCircle2 className="h-3 w-3 text-success" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-success">
              Ativo
            </span>
          </div>
        )}
      </div>

      {connected && lastSynced && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Última sincronização:{" "}
          <span className="font-medium text-foreground">
            {formatDistanceToNow(new Date(lastSynced), { addSuffix: true })}
          </span>
        </p>
      )}

      <div className="mt-4 flex items-center gap-2">
        {connected ? (
          <>
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-[12px] font-semibold text-foreground hover:bg-secondary transition-all disabled:opacity-50"
            >
              {isSyncing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Sincronizar
            </button>
            <button
              onClick={onDisconnect}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-destructive/20 px-3 py-2 text-[12px] font-semibold text-destructive hover:bg-destructive/5 transition-all"
            >
              <Unplug className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <button
            onClick={onConnect}
            disabled={isConnecting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-bold text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm"
          >
            {isConnecting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <ExternalLink className="h-3.5 w-3.5" />
                Conectar Banco
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
