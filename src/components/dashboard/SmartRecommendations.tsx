import { Sparkles, ArrowRight } from "lucide-react";

const recommendations = [
  {
    title: "Consolidate software subscriptions",
    description: "You have 3 overlapping project management tools. Consolidating could save ~$2,400/month.",
    impact: "Save $28,800/year",
  },
  {
    title: "Optimize payment terms",
    description: "Negotiate 60-day payment terms with your top 5 vendors to improve cash flow by ~$45K.",
    impact: "Improve cash flow",
  },
  {
    title: "Revenue diversification",
    description: "Your top client accounts for 38% of revenue. Consider expanding your client base to reduce risk.",
    impact: "Reduce risk",
  },
];

export function SmartRecommendations() {
  return (
    <div className="metric-card animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-accent" />
        <p className="text-sm font-medium text-muted-foreground">Smart Recommendations</p>
      </div>
      <div className="space-y-4">
        {recommendations.map((rec, i) => (
          <div key={i} className="group cursor-pointer rounded-lg border border-border p-4 transition-all duration-200 hover:border-primary/20 hover:shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{rec.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{rec.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-3 mt-0.5" />
            </div>
            <span className="mt-2 inline-block rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
              {rec.impact}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
