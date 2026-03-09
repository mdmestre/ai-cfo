import React, { useState } from 'react';
import { Plus, Trash2, ArrowRight, Zap, Bell, ShieldCheck, Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAutomations } from '@/hooks/use-automations';
import { toast } from 'sonner';

interface AutomationRule {
    id: string;
    name: string;
    trigger_type: string;
    condition_data: {
        condition: string;
        value: string;
    };
    action_type: string;
    action_data: any;
    is_new?: boolean;
}

const triggers = [
    { id: 'balance', label: 'Total Balance' },
    { id: 'expense', label: 'Specific Expense' },
    { id: 'revenue', label: 'Monthly Revenue' },
    { id: 'forecast', label: 'Cash Flow Forecast' },
];

const conditions = [
    { id: 'less', label: 'is less than' },
    { id: 'greater', label: 'is greater than' },
    { id: 'increases', label: 'increases by more than (%)' },
    { id: 'decreases', label: 'decreases by more than (%)' },
];

const actions = [
    { id: 'alert', label: 'Send AI Alert', icon: <Zap className="h-4 w-4" /> },
    { id: 'notify', label: 'Notify Manager', icon: <Bell className="h-4 w-4" /> },
    { id: 'protect', label: 'Lock Account', icon: <ShieldCheck className="h-4 w-4" /> },
];

export function AutomationBuilder() {
    const { automations, createAutomation, deleteAutomation, isLoading } = useAutomations();
    const [localRules, setLocalRules] = useState<AutomationRule[]>([]);

    const addRule = () => {
        const newRule: AutomationRule = {
            id: Math.random().toString(36).substr(2, 9),
            name: "New Rule",
            trigger_type: 'balance',
            condition_data: {
                condition: 'less',
                value: '0'
            },
            action_type: 'alert',
            action_data: {},
            is_new: true
        };
        setLocalRules([...localRules, newRule]);
    };

    const handleSave = async (rule: AutomationRule) => {
        try {
            await createAutomation.mutateAsync({
                name: rule.name,
                trigger_type: rule.trigger_type,
                condition_data: rule.condition_data,
                action_type: rule.action_type,
                action_data: rule.action_data
            });
            setLocalRules(localRules.filter(r => r.id !== rule.id));
            toast.success("Automation rule activated");
        } catch (error) {
            toast.error("Failed to save automation");
        }
    };

    const handleDelete = async (id: string, is_new?: boolean) => {
        if (is_new) {
            setLocalRules(localRules.filter(r => r.id !== id));
        } else {
            try {
                await deleteAutomation.mutateAsync(id);
                toast.success("Rule removed");
            } catch (err) {
                toast.error("Failed to remove rule");
            }
        }
    };

    const allRules = [...automations, ...localRules];

    if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-foreground">Advanced Rule Engine</h2>
                    <p className="text-[13px] text-muted-foreground mt-0.5">Program your company's financial operating system</p>
                </div>
                <button
                    onClick={addRule}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-bold text-white hover:opacity-90 transition-all shadow-md active:scale-95"
                >
                    <Plus className="h-4 w-4" />
                    New Custom Rule
                </button>
            </div>

            <div className="space-y-4">
                {allRules.map((rule, index) => (
                    <div
                        key={rule.id}
                        className={cn(
                            "group flex flex-col gap-4 rounded-xl border p-5 transition-all animate-slide-up",
                            rule.is_new ? "border-primary/20 bg-primary/[0.02]" : "border-border/60 bg-white"
                        )}
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground/40">If</span>

                            <select
                                value={rule.trigger_type}
                                disabled={!rule.is_new}
                                onChange={(e) => {
                                    const updated = localRules.map(r => r.id === rule.id ? { ...r, trigger_type: e.target.value } : r);
                                    setLocalRules(updated);
                                }}
                                className="rounded-md border border-border/50 bg-secondary/30 px-3 py-1.5 text-[13px] font-bold text-foreground outline-none focus:ring-1 focus:ring-primary disabled:opacity-80"
                            >
                                {triggers.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                            </select>

                            <select
                                value={rule.condition_data.condition}
                                disabled={!rule.is_new}
                                onChange={(e) => {
                                    const updated = localRules.map(r => r.id === rule.id ? { ...r, condition_data: { ...r.condition_data, condition: e.target.value } } : r);
                                    setLocalRules(updated);
                                }}
                                className="rounded-md border border-border/50 bg-secondary/30 px-3 py-1.5 text-[13px] font-bold text-foreground outline-none focus:ring-1 focus:ring-primary disabled:opacity-80"
                            >
                                {conditions.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>

                            <input
                                type="number"
                                value={rule.condition_data.value}
                                disabled={!rule.is_new}
                                onChange={(e) => {
                                    const updated = localRules.map(r => r.id === rule.id ? { ...r, condition_data: { ...r.condition_data, value: e.target.value } } : r);
                                    setLocalRules(updated);
                                }}
                                className="w-24 rounded-md border border-border/50 bg-secondary/30 px-3 py-1.5 text-[13px] font-bold text-foreground outline-none focus:ring-1 focus:ring-primary tabular-nums disabled:opacity-80"
                            />

                            <div className="flex items-center gap-3">
                                <ArrowRight className="h-4 w-4 text-muted-foreground/30" />
                                <span className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground/40">Then</span>

                                <div className="flex gap-2">
                                    {actions.map(a => (
                                        <button
                                            key={a.id}
                                            disabled={!rule.is_new}
                                            onClick={() => {
                                                const updated = localRules.map(r => r.id === rule.id ? { ...r, action_type: a.id } : r);
                                                setLocalRules(updated);
                                            }}
                                            className={cn(
                                                "flex items-center gap-2 rounded-md px-3 py-1.5 text-[12px] font-bold transition-all",
                                                rule.action_type === a.id
                                                    ? "bg-primary text-white shadow-sm"
                                                    : "bg-secondary/40 text-muted-foreground hover:bg-secondary"
                                            )}
                                        >
                                            {a.icon}
                                            {a.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-1 justify-end gap-2">
                                {rule.is_new ? (
                                    <button
                                        onClick={() => handleSave(rule)}
                                        className="flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-[12px] font-bold text-white hover:opacity-90 transition-all shadow-sm shadow-success/20"
                                    >
                                        <Save className="h-3.5 w-3.5" />
                                        Deploy
                                    </button>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-success pr-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-success ring-4 ring-success/10" />
                                        Active
                                    </span>
                                )}
                                <button
                                    onClick={() => handleDelete(rule.id, rule.is_new)}
                                    className="rounded-lg p-2 text-muted-foreground/30 hover:bg-destructive/10 hover:text-destructive transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {allRules.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-16 text-center bg-secondary/5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary border border-border">
                            <Zap className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="mt-4 text-[14px] font-bold text-foreground">No financial sentinels active</p>
                        <p className="text-[12px] text-muted-foreground mt-1 max-w-[280px]">Automate your financial guardrails to prevent risks and optimize cash flow.</p>
                        <button
                            onClick={addRule}
                            className="mt-6 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white hover:opacity-90 shadow-md"
                        >
                            <Plus className="h-4 w-4" />
                            Create First Rule
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
