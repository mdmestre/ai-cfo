import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { User, Building, Bell, Shield, CreditCard, ChevronLeft, Save, Eye, EyeOff, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useProfile } from "@/hooks/use-profile";
import { useCompany } from "@/hooks/use-company";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

type Section = "profile" | "company" | "notifications" | "security" | "billing";

const MENU_ITEMS = [
  { id: "profile" as Section, icon: User, title: "Perfil", desc: "Gerencie suas informações pessoais" },
  { id: "company" as Section, icon: Building, title: "Empresa", desc: "Atualize os detalhes da empresa" },
  { id: "notifications" as Section, icon: Bell, title: "Notificações", desc: "Configure alertas e notificações" },
  { id: "security" as Section, icon: Shield, title: "Segurança", desc: "Autenticação e senha" },
  { id: "billing" as Section, icon: CreditCard, title: "Plano", desc: "Gerencie assinatura e pagamentos" },
];

// ─── Profile Section ────────────────────────────────────────────────
function ProfileSection() {
  const { profile } = useProfile();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState(profile?.name ?? "");
  const [email] = useState(profile?.email ?? user?.email ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name })
      .eq("user_id", user!.id);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar perfil"); return; }
    toast.success("Perfil atualizado com sucesso");
    queryClient.invalidateQueries({ queryKey: ["profile"] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">Perfil</h2>
        <p className="text-[13px] text-muted-foreground mt-0.5">Suas informações pessoais e de conta</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold select-none">
          {(name || email)?.[0]?.toUpperCase() ?? "U"}
        </div>
        <div>
          <p className="text-[13px] font-medium text-foreground">{name || "Seu nome"}</p>
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-[13px]">Nome completo</Label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Seu nome"
            className="h-9 text-[13px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[13px]">E-mail</Label>
          <Input value={email} disabled className="h-9 text-[13px] bg-muted cursor-not-allowed" />
          <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 text-[13px]">
          <Save className="h-3.5 w-3.5" />
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </div>
  );
}

// ─── Company Section ────────────────────────────────────────────────
function CompanySection() {
  const { company } = useCompany();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState(company?.name ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!company) return;
    setSaving(true);
    const { error } = await supabase
      .from("companies")
      .update({ name })
      .eq("id", company.id);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar empresa"); return; }
    toast.success("Empresa atualizada com sucesso");
    queryClient.invalidateQueries({ queryKey: ["company"] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">Empresa</h2>
        <p className="text-[13px] text-muted-foreground mt-0.5">Configurações e dados da sua empresa</p>
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">ID da Empresa</p>
        <p className="text-[13px] font-mono text-foreground break-all">{company?.id ?? "—"}</p>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-[13px]">Nome da empresa</Label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nome da empresa"
            className="h-9 text-[13px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[13px]">Proprietário</Label>
          <Input value={user?.email ?? ""} disabled className="h-9 text-[13px] bg-muted cursor-not-allowed" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[13px]">Criada em</Label>
          <Input
            value={company?.created_at ? new Date(company.created_at).toLocaleDateString("pt-BR") : "—"}
            disabled
            className="h-9 text-[13px] bg-muted cursor-not-allowed"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 text-[13px]">
          <Save className="h-3.5 w-3.5" />
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </div>
  );
}

// ─── Notifications Section ───────────────────────────────────────────
function NotificationsSection() {
  const [prefs, setPrefs] = useState({
    email_transactions: true,
    email_invoices: true,
    email_expenses: false,
    email_weekly_report: true,
    push_alerts: true,
    push_cashflow: false,
  });

  const toggle = (key: keyof typeof prefs) =>
    setPrefs(p => ({ ...p, [key]: !p[key] }));

  const handleSave = () => {
    toast.success("Preferências de notificação salvas");
  };

  const items = [
    { key: "email_transactions" as const, label: "Novas transações", desc: "Receba e-mail para cada transação registrada" },
    { key: "email_invoices" as const, label: "Faturas e cobranças", desc: "Alertas de vencimento e pagamento de faturas" },
    { key: "email_expenses" as const, label: "Despesas pendentes", desc: "Notificações sobre despesas aguardando aprovação" },
    { key: "email_weekly_report" as const, label: "Relatório semanal", desc: "Resumo financeiro toda segunda-feira" },
  ];

  const pushItems = [
    { key: "push_alerts" as const, label: "Alertas financeiros", desc: "Avisos de saldo baixo e eventos críticos" },
    { key: "push_cashflow" as const, label: "Previsão de caixa", desc: "Notificações sobre projeções de fluxo de caixa" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">Notificações</h2>
        <p className="text-[13px] text-muted-foreground mt-0.5">Controle quais alertas você deseja receber</p>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Por E-mail</p>
        {items.map(item => (
          <div key={item.key} className="flex items-center justify-between rounded-lg px-4 py-3 bg-card border">
            <div>
              <p className="text-[13px] font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <Switch checked={prefs[item.key]} onCheckedChange={() => toggle(item.key)} />
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Notificações Push</p>
        {pushItems.map(item => (
          <div key={item.key} className="flex items-center justify-between rounded-lg px-4 py-3 bg-card border">
            <div>
              <p className="text-[13px] font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <Switch checked={prefs[item.key]} onCheckedChange={() => toggle(item.key)} />
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={handleSave} className="gap-1.5 text-[13px]">
          <Save className="h-3.5 w-3.5" />
          Salvar preferências
        </Button>
      </div>
    </div>
  );
}

// ─── Security Section ────────────────────────────────────────────────
function SecuritySection() {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const passwordMatch = newPw && confirmPw && newPw === confirmPw;
  const passwordMismatch = newPw && confirmPw && newPw !== confirmPw;

  const handleChangePassword = async () => {
    if (!newPw || newPw !== confirmPw) return;
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setSaving(false);
    if (error) { toast.error("Erro ao alterar senha: " + error.message); return; }
    toast.success("Senha alterada com sucesso");
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">Segurança</h2>
        <p className="text-[13px] text-muted-foreground mt-0.5">Gerencie sua senha e autenticação</p>
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-1">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <p className="text-[13px] font-medium text-foreground">Sessão ativa</p>
        </div>
        <p className="text-xs text-muted-foreground">Autenticado via e-mail e senha</p>
      </div>

      <Separator />

      <div className="space-y-4">
        <p className="text-[13px] font-semibold text-foreground">Alterar senha</p>

        <div className="space-y-1.5">
          <Label className="text-[13px]">Senha atual</Label>
          <div className="relative">
            <Input
              type={showCurrent ? "text" : "password"}
              value={currentPw}
              onChange={e => setCurrentPw(e.target.value)}
              placeholder="••••••••"
              className="h-9 text-[13px] pr-10"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[13px]">Nova senha</Label>
          <div className="relative">
            <Input
              type={showNew ? "text" : "password"}
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="h-9 text-[13px] pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNew(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[13px]">Confirmar nova senha</Label>
          <div className="relative">
            <Input
              type="password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              placeholder="Repita a nova senha"
              className={`h-9 text-[13px] pr-10 ${passwordMismatch ? "border-destructive" : ""}`}
            />
            {passwordMatch && (
              <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
            )}
            {passwordMismatch && (
              <X className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
            )}
          </div>
          {passwordMismatch && (
            <p className="text-xs text-destructive">As senhas não coincidem</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={handleChangePassword}
          disabled={saving || !newPw || !passwordMatch}
          className="gap-1.5 text-[13px]"
        >
          <Shield className="h-3.5 w-3.5" />
          {saving ? "Alterando..." : "Alterar senha"}
        </Button>
      </div>
    </div>
  );
}

// ─── Billing Section ─────────────────────────────────────────────────
function BillingSection() {
  const plans = [
    {
      name: "Starter",
      price: "Grátis",
      features: ["1 usuário", "Até 100 transações/mês", "Relatórios básicos"],
      current: false,
    },
    {
      name: "Pro",
      price: "R$ 199/mês",
      features: ["Até 10 usuários", "Transações ilimitadas", "IA Financeira", "Automações", "Suporte prioritário"],
      current: true,
    },
    {
      name: "Enterprise",
      price: "Sob consulta",
      features: ["Usuários ilimitados", "API dedicada", "Integração bancária completa", "SLA garantido"],
      current: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">Plano e Assinatura</h2>
        <p className="text-[13px] text-muted-foreground mt-0.5">Gerencie seu plano e métodos de pagamento</p>
      </div>

      <div className="space-y-3">
        {plans.map(plan => (
          <div
            key={plan.name}
            className={`rounded-lg border p-4 ${plan.current ? "border-primary bg-primary/5 ring-1 ring-primary" : "bg-card"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-semibold text-foreground">{plan.name}</p>
                {plan.current && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    Atual
                  </span>
                )}
              </div>
              <p className="text-[13px] font-semibold text-foreground">{plan.price}</p>
            </div>
            <ul className="space-y-1">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Check className="h-3 w-3 text-green-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            {!plan.current && (
              <Button
                size="sm"
                variant="outline"
                className="mt-3 w-full text-[13px] h-8"
                onClick={() => toast.info(`Entre em contato para migrar para o plano ${plan.name}`)}
              >
                {plan.name === "Enterprise" ? "Falar com vendas" : "Fazer upgrade"}
              </Button>
            )}
          </div>
        ))}
      </div>

      <Separator />

      <div className="rounded-lg border bg-card p-4 space-y-2">
        <p className="text-[13px] font-medium text-foreground">Próxima cobrança</p>
        <p className="text-xs text-muted-foreground">R$ 199,00 em <span className="text-foreground font-medium">09/04/2026</span></p>
        <Button
          variant="outline"
          size="sm"
          className="text-[13px] h-8 mt-1"
          onClick={() => toast.info("Redirecionando para portal de pagamento...")}
        >
          <CreditCard className="h-3.5 w-3.5 mr-1.5" />
          Gerenciar método de pagamento
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────
const SettingsPage = () => {
  const [active, setActive] = useState<Section | null>(null);

  const renderSection = () => {
    switch (active) {
      case "profile": return <ProfileSection />;
      case "company": return <CompanySection />;
      case "notifications": return <NotificationsSection />;
      case "security": return <SecuritySection />;
      case "billing": return <BillingSection />;
      default: return null;
    }
  };

  return (
    <AppLayout>
      <div className="max-w-[640px] space-y-6">
        {active ? (
          <>
            <button
              onClick={() => setActive(null)}
              className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Configurações
            </button>
            {renderSection()}
          </>
        ) : (
          <>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Configurações</h1>
              <p className="mt-0.5 text-[13px] text-muted-foreground">Gerencie sua conta e preferências</p>
            </div>

            <div className="space-y-1">
              {MENU_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  className="w-full flex items-center gap-3.5 rounded-lg px-4 py-3.5 cursor-pointer hover:bg-secondary transition-colors group text-left"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary group-hover:bg-background transition-colors shrink-0">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <ChevronLeft className="h-4 w-4 text-muted-foreground rotate-180 shrink-0" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
