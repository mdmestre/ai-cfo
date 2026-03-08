import { AppLayout } from "@/components/layout/AppLayout";
import {
  Lightbulb, TrendingUp, TrendingDown, DollarSign, Users, ArrowRight,
  AlertTriangle, Clock, Zap, ShieldAlert, ChevronRight
} from "lucide-react";
import { useState } from "react";

type AlertSeverity = "critical" | "warning" | "info" | "positive";

interface SmartAlert {
  id: number;
  severity: AlertSeverity;
  title: string;
  description: string;
  metric?: string;
  metricChange?: string;
  time: string;
  actionable: boolean;
  action?: string;
}

const smartAlerts: SmartAlert[] = [
  {
    id: 1,
    severity: "critical",
    title: "Cash runway declining",
    description: "At current burn rate, your company may run out of cash in 52 days. This is down from 67 days last month.",
    metric: "52 days",
    metricChange: "-15 days",
    time: "1h ago",
    actionable: true,
    action: "Review burn rate",
  },
  {
    id: 2,
    severity: "warning",
    title: "Expenses increased 24% this month",
    description: "Total expenses reached $384K, up from $310K last month. Infrastructure (+$32K) and Travel (+$18K) drove most of the increase.",
    metric: "+24%",
    metricChange: "+$74K",
    time: "3h ago",
    actionable: true,
    action: "View expense breakdown",
  },
  {
    id: 3,
    severity: "warning",
    title: "Subscription cost creep detected",
    description: "Software subscriptions increased from $18.2K to $24.6K over the last 3 months. 3 tools have overlapping functionality.",
    metric: "$24.6K/mo",
    metricChange: "+35%",
    time: "5h ago",
    actionable: true,
    action: "Review subscriptions",
  },
  {
    id: 4,
    severity: "info",
    title: "Payment terms opportunity",
    description: "5 vendors offer Net-60 terms that you're currently paying Net-30. Switching could improve cash flow by ~$45K.",
    metric: "$45K",
    time: "1d ago",
    actionable: true,
    action: "See vendors",
  },
  {
    id: 5,
    severity: "positive",
    title: "MRR milestone reached",
    description: "Monthly recurring revenue crossed $400K for the first time. Growth rate is 8.2% month-over-month.",
    metric: "$400K MRR",
    metricChange: "+8.2%",
    time: "1d ago",
    actionable: false,
  },
  {
    id: 6,
    severity: "info",
    title: "Tax payment reminder",
    description: "Estimated quarterly tax payment of $38,200 is due in 12 days. Ensure sufficient funds in the operating account.",
    metric: "$38,200",
    time: "2d ago",
    actionable: true,
    action: "View schedule",
  },
];

const insights = [
  {
    icon: TrendingUp,
    title: "Revenue growth opportunity",
    description: "Converting 3 pending enterprise deals could increase MRR by 15% ($72K/month).",
    impact: "+$72K/mo",
    color: "text-success",
    bgColor: "bg-success/8",
  },
  {
    icon: TrendingDown,
    title: "Seasonal cash flow dip ahead",
    description: "Q3 historically shows 12% revenue dip. Build $150K cash buffer before July.",
    impact: "Risk: -$57K",
    color: "text-warning",
    bgColor: "bg-warning/8",
  },
  {
    icon: DollarSign,
    title: "Cost optimization available",
    description: "Annual billing on Hubspot, AWS RI, and Figma could save $18,400/year.",
    impact: "Save $18.4K/yr",
    color: "text-success",
    bgColor: "bg-success/8",
  },
  {
    icon: Users,
    title: "Customer concentration risk",
    description: "Acme Corp is 38% of revenue. Loss would impact $182K/month.",
    impact: "High risk",
    color: "text-destructive",
    bgColor: "bg-destructive/8",
  },
];

const severityConfig: Record<AlertSeverity, { icon: typeof AlertTriangle; color: string; bg: string; border: string }> = {
  critical: { icon: ShieldAlert, color: "text-destructive", bg: "bg-destructive/5", border: "border-destructive/15" },
  warning: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/5", border: "border-warning/15" },
  info: { icon: Lightbulb, color: "text-info", bg: "bg-info/5", border: "border-info/15" },
  positive: { icon: Zap, color: "text-success", bg: "bg-success/5", border: "border-success/15" },
};

const Insights = () => {
  const [activeTab, setActiveTab] = useState<"alerts" | "insights">("alerts");
  const [severityFilter, setSeverityFilter] = useState<"all" | AlertSeverity>("all");

  const filteredAlerts = severityFilter === "all"
    ? smartAlerts
    : smartAlerts.filter((a) => a.severity === severityFilter);

  return (
    <AppLayout>
      <div className="max-w-[1200px] space-y-6">
        <div>
          <div className="flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4 text-accent" />
            <h1 className="text-xl font-semibold text-foreground">Financial Intelligence</h1>
          </div>
          <p className="mt-0.5 text-[13px] text-muted-foreground">AI-powered alerts, insights, and recommendations</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border">
          {[
            { key: "alerts" as const, label: "Smart Alerts", count: smartAlerts.length },
            { key: "insights" as const, label: "Insights", count: insights.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.key
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              <span className="ml-1.5 rounded-full bg-secondary px-1.5 py-0.5 text-xxs">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {activeTab === "alerts" && (
          <div className="space-y-4">
            {/* Severity filters */}
            <div className="flex items-center gap-2">
              {[
                { key: "all" as const, label: "All" },
                { key: "critical" as const, label: "Critical" },
                { key: "warning" as const, label: "Warning" },
                { key: "info" as const, label: "Info" },
                { key: "positive" as const, label: "Positive" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setSeverityFilter(f.key)}
                  className={`rounded-md px-2.5 py-1 text-xxs font-medium transition-colors ${
                    severityFilter === f.key
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Alert list */}
            <div className="space-y-2">
              {filteredAlerts.map((alert) => {
                const config = severityConfig[alert.severity];
                const Icon = config.icon;
                return (
                  <div key={alert.id} className={`rounded-lg border ${config.border} ${config.bg} p-4 transition-colors`}>
                    <div className="flex items-start gap-3">
                      <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${config.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[13px] font-medium text-foreground">{alert.title}</p>
                            <p className="text-[13px] text-muted-foreground mt-0.5 leading-snug">{alert.description}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {alert.metric && (
                              <div className="text-right">
                                <p className="text-[13px] font-semibold text-foreground">{alert.metric}</p>
                                {alert.metricChange && (
                                  <p className={`text-xxs font-medium ${
                                    alert.metricChange.startsWith("+") && alert.severity !== "positive"
                                      ? "text-destructive"
                                      : alert.metricChange.startsWith("-") && alert.severity !== "positive"
                                      ? "text-destructive"
                                      : "text-success"
                                  }`}>
                                    {alert.metricChange}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-2.5 flex items-center gap-3">
                          <span className="flex items-center gap-1 text-xxs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {alert.time}
                          </span>
                          {alert.actionable && alert.action && (
                            <button className="flex items-center gap-1 text-xxs font-medium text-accent hover:underline">
                              {alert.action}
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "insights" && (
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
        )}
      </div>
    </AppLayout>
  );
};

export default Insights;
