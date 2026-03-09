import { AppLayout } from "@/components/layout/AppLayout";
import { useAutomationRules } from "@/hooks/use-automation-rules";
import { Loader2, Zap, Plus, Trash2, ToggleLeft, ToggleRight, Clock } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

const TRIGGER_TYPES = [
  { value: "invoice_overdue", label: "Invoice Overdue" },
  { value: "balance_low", label: "Balance Below Threshold" },
  { value: "expense_above_limit", label: "Expense Above Limit" },
  { value: "payment_received", label: "Payment Received" },
  { value: "daily_summary", label: "Daily Summary" },
];

const ACTION_TYPES = [
  { value: "send_notification", label: "Send Notification" },
  { value: "send_email", label: "Send Email" },
  { value: "create_alert", label: "Create Alert" },
  { value: "auto_categorize", label: "Auto-Categorize" },
  { value: "flag_review", label: "Flag for Review" },
];

export default function AutomationPage() {
  const { rules, logs, isLoading, createRule, toggleRule, deleteRule } = useAutomationRules();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    trigger_type: "invoice_overdue",
    action_type: "send_notification",
    threshold: "",
  });

  const handleCreate = () => {
    if (!form.name.trim()) return;
    createRule.mutate({
      name: form.name,
      description: form.description,
      trigger_type: form.trigger_type,
      trigger_config: form.threshold ? { threshold: Number(form.threshold) } : {},
      action_type: form.action_type,
      action_config: {},
    }, {
      onSuccess: () => {
        setShowForm(false);
        setForm({ name: "", description: "", trigger_type: "invoice_overdue", action_type: "send_notification", threshold: "" });
      },
    });
  };

  return (
    <AppLayout>
      <div className="max-w-[1120px] space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold text-foreground tracking-tight">Automation Engine</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Set up rules to automate financial operations — alerts, categorization, reminders.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-[13px] font-semibold text-background hover:bg-foreground/90 transition-all"
          >
            <Plus className="h-4 w-4" />
            New Rule
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="metric-card animate-slide-up space-y-4">
            <p className="text-[14px] font-semibold text-foreground">Create Automation Rule</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                placeholder="Rule name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/30"
              />
              <input
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/30"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">When (Trigger)</label>
                <select
                  value={form.trigger_type}
                  onChange={(e) => setForm({ ...form, trigger_type: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13px] text-foreground outline-none"
                >
                  {TRIGGER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Then (Action)</label>
                <select
                  value={form.action_type}
                  onChange={(e) => setForm({ ...form, action_type: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13px] text-foreground outline-none"
                >
                  {ACTION_TYPES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Threshold (optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={form.threshold}
                  onChange={(e) => setForm({ ...form, threshold: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/30"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!form.name.trim() || createRule.isPending}
                className="rounded-lg bg-foreground px-4 py-2 text-[13px] font-semibold text-background hover:bg-foreground/90 disabled:opacity-50"
              >
                {createRule.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Rule"}
              </button>
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-border px-4 py-2 text-[13px] text-muted-foreground hover:bg-secondary">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Rules list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : rules.length > 0 ? (
          <div className="space-y-2">
            {rules.map((rule: any) => (
              <div key={rule.id} className="metric-card animate-slide-up">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`rounded-lg p-2 ${rule.is_active ? "bg-success/10" : "bg-secondary"}`}>
                      <Zap className={`h-4 w-4 ${rule.is_active ? "text-success" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-medium text-foreground">{rule.name}</p>
                        {!rule.is_active && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Paused</span>}
                      </div>
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        When <span className="font-medium text-foreground">{TRIGGER_TYPES.find(t => t.value === rule.trigger_type)?.label || rule.trigger_type}</span>
                        {" → "}
                        <span className="font-medium text-foreground">{ACTION_TYPES.find(a => a.value === rule.action_type)?.label || rule.action_type}</span>
                      </p>
                      {rule.description && <p className="text-[12px] text-muted-foreground mt-0.5">{rule.description}</p>}
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                        <span>Triggered {rule.trigger_count}×</span>
                        {rule.last_triggered_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last: {format(new Date(rule.last_triggered_at), "MMM dd HH:mm")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => toggleRule.mutate({ id: rule.id, is_active: !rule.is_active })}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary transition-colors"
                      title={rule.is_active ? "Pause" : "Activate"}
                    >
                      {rule.is_active ? <ToggleRight className="h-5 w-5 text-success" /> : <ToggleLeft className="h-5 w-5" />}
                    </button>
                    <button
                      onClick={() => deleteRule.mutate(rule.id)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="metric-card flex flex-col items-center justify-center py-16">
            <Zap className="h-8 w-8 text-muted-foreground/30 mb-3" />
            <p className="text-[14px] font-medium text-foreground">No automation rules yet</p>
            <p className="mt-1 text-[13px] text-muted-foreground">Create your first rule to automate financial operations.</p>
          </div>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <div className="metric-card animate-slide-up">
            <p className="section-label mb-3">Execution Log</p>
            <div className="space-y-1.5">
              {logs.slice(0, 10).map((log: any) => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0 text-[12px]">
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${log.status === "success" ? "bg-success" : "bg-destructive"}`} />
                    <span className="text-foreground font-medium">{log.automation_rules?.name || "Rule"}</span>
                  </div>
                  <span className="text-muted-foreground">{format(new Date(log.executed_at), "MMM dd HH:mm")}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
