import { RefreshCw, Loader2 } from "lucide-react";
import { usePluggy } from "@/hooks/use-pluggy";
import { toast } from "sonner";

export function PluggySyncButton() {
  const { isSyncing, syncAllConnections } = usePluggy();

  const handleSync = async () => {
    try {
      const result = await syncAllConnections();
      toast.success(`${result.synced} conexão(ões) sincronizada(s)!`);
    } catch {
      toast.error("Erro ao sincronizar conexões.");
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={isSyncing}
      className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-[12px] font-semibold text-foreground hover:bg-secondary transition-all disabled:opacity-50"
    >
      {isSyncing ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <RefreshCw className="h-3.5 w-3.5" />
      )}
      Sincronizar Tudo
    </button>
  );
}
