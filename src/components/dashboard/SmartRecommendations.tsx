import { Sparkles, ArrowRight } from "lucide-react";

const recommendations = [
  {
    title: "Consolidate software subscriptions",
    description: "You have 3 overlapping project management tools. Consolidating could save ~$2,400/mo.",
    impact: "Save $28,800/yr",
  },
  {
    title: "Optimize payment terms",
    description: "Negotiate 60-day terms with top 5 vendors to improve cash flow by ~$45K.",
    impact: "Improve cash flow",
  },
  {
    title: "Revenue diversification",
    description: "Top client is 38% of revenue. Expand client base to reduce concentration risk.",
    impact: "Reduce risk",
  },
];

export function SmartRecommendations() {
  return (
    <div className="metric-card animate-slide-up">
      <div className="flex items-center gap-1.5 mb-4">
        <Sparkles className="h-3.5 w-3.5 text-accent" />
        <p className="text-[13px] font-medium text-muted-foreground">Smart Recommendations</p>
      </div>
      <div className="space-y-2.5">
        {recommendations.map((rec, i) => (
          <div key={i} className="group cursor-pointer rounded-lg border border-border p-3.5 transition-all duration-150 hover:border-accent/30 hover:bg-accent/[0.02]">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-[13px] font-medium text-foreground">{rec.title}</p>
                <p className="mt-1 text-[13px] text-muted-foreground leading-snug">{rec.description}</p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-3 mt-0.5" />
            </div>
            <span className="mt-2 inline-block rounded-full bg-accent/8 px-2 py-0.5 text-xxs font-medium text-accent">
              {rec.impact}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
