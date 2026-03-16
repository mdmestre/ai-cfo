import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { useSavingsOpportunities } from "@/hooks/use-savings-opportunities";
import { formatBRLCompact } from "@/lib/format";
import { Link } from "react-router-dom";

export function SmartRecommendations() {
  const { opportunities, isLoading } = useSavingsOpportunities();

  if (isLoading) {
    return (
      <div className="metric-card animate-slide-up flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const recommendations = opportunities.slice(0, 3);

  return (
    <div className="metric-card animate-slide-up">
      <div className="flex items-center gap-1.5 mb-4">
        <Sparkles className="h-3.5 w-3.5 text-accent" />
        <p className="text-[13px] font-medium text-muted-foreground">Recomendacoes de economia</p>
      </div>
      <div className="space-y-2.5">
        {recommendations.length > 0 ? (
          recommendations.map((rec: any) => (
            <Link
              key={rec.id}
              to={rec.actionUrl || "/savings"}
              className="group block rounded-lg border border-border p-3.5 transition-all duration-150 hover:border-accent/30 hover:bg-accent/[0.02]"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-foreground">{rec.title}</p>
                  <p className="mt-1 text-[13px] text-muted-foreground leading-snug">{rec.description}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-3 mt-0.5" />
              </div>
              <span className="mt-2 inline-block rounded-full bg-accent/8 px-2 py-0.5 text-xxs font-medium text-accent">
                {Number(rec.potentialSavingsMonthly) > 0
                  ? `Economia potencial: ${formatBRLCompact(Number(rec.potentialSavingsMonthly))}/mes`
                  : "Higiene financeira"}
              </span>
            </Link>
          ))
        ) : (
          <p className="text-[13px] text-muted-foreground py-8 text-center">
            Sem novas recomendacoes hoje. Classifique transacoes e registre faturas para melhorar os insights.
          </p>
        )}
      </div>
    </div>
  );
}
