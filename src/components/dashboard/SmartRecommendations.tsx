import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { useInsights } from "@/hooks/use-insights";
import { useCompany } from "@/hooks/use-company";

export function SmartRecommendations() {
  const { company } = useCompany();
  const { data: insightsData, isLoading } = useInsights(company?.id);

  if (isLoading) {
    return (
      <div className="metric-card animate-slide-up flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Use real insights from the backend, or mock if the service doesn't return any yet
  // In a real flow, the AI Service would generate these
  const recommendations = insightsData?.insights || [];

  return (
    <div className="metric-card animate-slide-up">
      <div className="flex items-center gap-1.5 mb-4">
        <Sparkles className="h-3.5 w-3.5 text-accent" />
        <p className="text-[13px] font-medium text-muted-foreground">AI-Powered Recommendations</p>
      </div>
      <div className="space-y-2.5">
        {recommendations.length > 0 ? (
          recommendations.map((rec: any, i: number) => (
            <div key={i} className="group cursor-pointer rounded-lg border border-border p-3.5 transition-all duration-150 hover:border-accent/30 hover:bg-accent/[0.02]">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-foreground">{rec.title}</p>
                  <p className="mt-1 text-[13px] text-muted-foreground leading-snug">{rec.description}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-3 mt-0.5" />
              </div>
              <span className="mt-2 inline-block rounded-full bg-accent/8 px-2 py-0.5 text-xxs font-medium text-accent">
                {rec.impact || "Strategic Insight"}
              </span>
            </div>
          ))
        ) : (
          <p className="text-[13px] text-muted-foreground py-8 text-center">No new recommendations today. Your finances look healthy!</p>
        )}
      </div>
    </div>
  );
}
