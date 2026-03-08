import { AppLayout } from "@/components/layout/AppLayout";
import { Lightbulb, TrendingUp, TrendingDown, DollarSign, Users, ArrowRight } from "lucide-react";

const insights = [
  {
    icon: TrendingUp,
    title: "Revenue growth opportunity",
    description: "Based on current pipeline, you could increase MRR by 15% by converting 3 pending enterprise deals.",
    impact: "Potential +$72K/mo",
    color: "text-success",
    bgColor: "bg-success/8",
  },
  {
    icon: TrendingDown,
    title: "Seasonal cash flow dip ahead",
    description: "Historically, Q3 shows a 12% revenue dip. Consider building a cash buffer of $150K before July.",
    impact: "Risk: -$57K revenue",
    color: "text-warning",
    bgColor: "bg-warning/8",
  },
  {
    icon: DollarSign,
    title: "Cost optimization available",
    description: "Annual billing on Hubspot, AWS Reserved Instances, and Figma could save $18,400/year.",
    impact: "Save $18,400/yr",
    color: "text-success",
    bgColor: "bg-success/8",
  },
  {
    icon: Users,
    title: "Customer concentration risk",
    description: "Acme Corp represents 38% of revenue. A loss would impact monthly revenue by $182K.",
    impact: "High risk",
    color: "text-destructive",
    bgColor: "bg-destructive/8",
  },
];

const Insights = () => {
  return (
    <AppLayout>
      <div className="max-w-[1200px] space-y-6">
        <div>
          <div className="flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4 text-accent" />
            <h1 className="text-xl font-semibold text-foreground">Insights</h1>
          </div>
          <p className="mt-0.5 text-[13px] text-muted-foreground">AI-powered financial insights and recommendations</p>
        </div>

        <div className="space-y-3">
          {insights.map((insight, i) => (
            <div key={i} className="metric-card group cursor-pointer transition-colors hover:bg-secondary/30">
              <div className="flex items-start gap-3.5">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${insight.bgColor}`}>
                  <insight.icon className={`h-4 w-4 ${insight.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-foreground">{insight.title}</p>
                      <p className="mt-1 text-[13px] text-muted-foreground leading-snug">{insight.description}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 ml-4" />
                  </div>
                  <span className={`mt-2.5 inline-block rounded-full px-2 py-0.5 text-xxs font-medium ${insight.bgColor} ${insight.color}`}>
                    {insight.impact}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Insights;
