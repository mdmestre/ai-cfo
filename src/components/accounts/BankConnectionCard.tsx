import { Building2, Plus, Info, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BankConnectionCardProps {
    institution: string;
    status: 'connected' | 'not_connected';
    onConnect?: () => void;
}

export function BankConnectionCard({ institution, status, onConnect }: BankConnectionCardProps) {
    return (
        <div className={cn(
            "group relative flex items-center justify-between rounded-xl border border-border bg-white p-5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md",
            status === 'connected' ? "bg-primary/[0.01]" : ""
        )}>
            <div className="flex items-center gap-4">
                <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full border border-border bg-secondary/30 transition-colors group-hover:bg-white",
                    status === 'connected' ? "border-primary/20" : ""
                )}>
                    <Building2 className={cn(
                        "h-6 w-6 text-muted-foreground transition-colors group-hover:text-primary",
                        status === 'connected' ? "text-primary" : ""
                    )} />
                </div>
                <div>
                    <p className="text-[15px] font-semibold text-foreground">{institution}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-xxs font-medium uppercase tracking-wider text-muted-foreground/60">
                        {status === 'connected' ? (
                            <>
                                <CheckCircle2 className="h-3 w-3 text-success font-bold" />
                                <span className="text-success">Connected via Open Finance</span>
                            </>
                        ) : (
                            <>
                                <Info className="h-3 w-3" />
                                <span>Available for sync</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <button
                onClick={onConnect}
                disabled={status === 'connected'}
                className={cn(
                    "flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition-all",
                    status === 'connected'
                        ? "cursor-default text-muted-foreground/40 bg-secondary/50"
                        : "bg-primary text-white hover:opacity-90 active:scale-95 shadow-sm"
                )}
            >
                {status === 'connected' ? "Synced" : (
                    <>
                        <Plus className="h-4 w-4" />
                        Connect
                    </>
                )}
            </button>
        </div>
    );
}
