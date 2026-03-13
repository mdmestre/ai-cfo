import { Loader2, Link2, Zap } from "lucide-react";
import { useBelvo } from "@/hooks/use-belvo";
import { toast } from "sonner";

interface BelvoConnectButtonProps {
  variant?: "primary" | "outline";
  className?: string;
}

export function BelvoConnectButton({ variant = "primary", className = "" }: BelvoConnectButtonProps) {
  const { isConnecting, openBelvoConnect } = useBelvo();

  const handleConnect = async () => {
    try {
      await openBelvoConnect((linkId) => {
        toast.success("Banco conectado com sucesso via Open Finance!", {
          description: "Suas contas e transações estarão disponíveis em breve.",
        });
      });
    } catch {
      // toast is handled in the hook
    }
  };

  if (variant === "outline") {
    return (
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className={`flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-[13px] font-bold text-primary hover:bg-primary/10 transition-all disabled:opacity-50 ${className}`}
      >
        {isConnecting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Link2 className="h-4 w-4" />
        )}
        Conectar via Open Finance
      </button>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className={`flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-bold text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm ${className}`}
    >
      {isConnecting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Zap className="h-4 w-4" />
      )}
      Conectar Banco via Belvo
    </button>
  );
}
