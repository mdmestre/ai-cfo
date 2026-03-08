import { AppLayout } from "@/components/layout/AppLayout";
import { Lightbulb, TrendingUp, TrendingDown, DollarSign, Users, ArrowRight } from "lucide-react";

const insights = [
  {
    type: "opportunity",
    icon: TrendingUp,
    title: "Revenue growth opportunity",
    description: "Based on current pipeline, you could increase MRR by 15% by converting 3 pending enterprise deals.",
    impact: "Potential +$72K/month",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    type: "risk",
    icon: TrendingDown,
    title: "Seasonal cash flow dip ahead",
    description: "Historically, Q3 shows a 12% revenue dip. Consider building a cash buffer of $150K before July.",
    impact: "Risk: -$57K revenue",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    type: "savings",
    icon: DollarSign,
    title: "Cost optimization available",
    description: "Annual billing on Hubspot, AWS Reserved Instances, and Figma could save $18,400/year.",
    impact: "Save $18,400/year",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    type: "risk",
    icon: Users,
    title: "Customer concentration risk",
    description: "Acme Corp represents 38% of revenue. A loss would impact monthly revenue by $182K.",
    impact: "High risk",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
];

const Insights = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-accent" />
            <h1 className="text-2xl font-semibold text-foreground">Insights</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">AI-powered financial insights and recommendations</p>
        </div>

        <div className="space-y-4">
          {insights.map((insight, i) => (
            <div key={i} className="metric-card group cursor-pointer hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${insight.bgColor}`}>
                  <insight.icon className={`h-5 w-5 ${insight.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-base font-medium text-foreground">{insight.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{insight.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1 ml-4" />
                  </div>
                  <span className={`mt-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${insight.bgColor} ${insight.color}`}>
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
