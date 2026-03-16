import { Unplug, RefreshCw, Loader2, ExternalLink, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BankConnectionCardProps {
  institution: string;
  provider: string;
  status: "connected" | "not_connected" | "connecting" | "needs_attention";
  lastSynced?: string | null;
  isConnecting?: boolean;
  isSyncing?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onSync?: () => void;
}

const providerLabels: Record<string, string> = {
  belvo: "Belvo (Open Finance)",
  open_finance_br: "Open Finance Brasil",
  plaid: "Plaid",
  manual: "Manual",
};

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "?";
  const second = parts.length > 1 ? parts[1]?.[0] : (parts[0]?.[1] || "");
  return `${first}${second}`.toUpperCase();
}

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
  const connected = status === "connected" || status === "connecting" || status === "needs_attention";
  const initials = initialsFromName(institution);

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border bg-card p-5 transition-all",
        status === "needs_attention"
          ? "border-destructive/30 shadow-sm"
          : connected
            ? "border-success/30 shadow-sm"
            : "border-border hover:border-primary/30 hover:shadow-md"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl text-[13px] font-bold transition-colors",
              connected ? "bg-success/10 text-success" : "bg-secondary text-foreground"
            )}
            aria-label={institution}
          >
            {initials}
          </div>
          <div>
            <p className="text-[14px] font-bold text-foreground">{institution}</p>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <span className="uppercase tracking-wider">{providerLabels[provider] || provider}</span>
            </div>
          </div>
        </div>

        {connected && (
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5",
              status === "needs_attention"
                ? "bg-destructive/10"
                : status === "connecting"
                  ? "bg-primary/10"
                  : "bg-success/10"
            )}
          >
            {status === "needs_attention" ? (
              <span className="text-[10px] font-bold uppercase tracking-wider text-destructive">Ação necessária</span>
            ) : status === "connecting" ? (
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Sincronizando</span>
            ) : (
              <>
                <CheckCircle2 className="h-3 w-3 text-success" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-success">Ativo</span>
              </>
            )}
          </div>
        )}
      </div>

      {connected && lastSynced && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Ultima sincronizacao:{" "}
          <span className="font-medium text-foreground">
            {formatDistanceToNow(parseISO(lastSynced), { addSuffix: true, locale: ptBR })}
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
              {isSyncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Sincronizar
            </button>

            <button
              onClick={onDisconnect}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-destructive/20 px-3 py-2 text-[12px] font-semibold text-destructive hover:bg-destructive/5 transition-all"
              title="Desconectar"
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
                Conectar banco
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
