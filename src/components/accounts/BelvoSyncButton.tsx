import { Loader2, RefreshCw } from "lucide-react";
import { useBelvo } from "@/hooks/use-belvo";

export function BelvoSyncButton() {
  const { isSyncing, syncAllConnections } = useBelvo();

  return (
    <button
      onClick={() => syncAllConnections()}
      disabled={isSyncing}
      className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-[12px] font-bold text-foreground hover:bg-secondary/50 transition-all disabled:opacity-50"
      title="Sincronizar conexões do Belvo"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
      <span className="hidden sm:inline">Sincronizar</span>
    </button>
  );
}
