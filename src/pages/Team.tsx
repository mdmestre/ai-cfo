import { AppLayout } from "@/components/layout/AppLayout";
import { useMemberships, AppRole } from "@/hooks/use-memberships";
import { useAuth } from "@/contexts/AuthContext";
import {
  UserPlus, Shield, Mail, Loader2, Star, Crown, Eye, Users, Trash2, ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ROLE_CONFIG: Record<AppRole, { label: string; icon: any; color: string; desc: string }> = {
  owner: { label: "Proprietário", icon: Crown, color: "bg-primary text-primary-foreground", desc: "Controle total da empresa" },
  admin: { label: "Admin", icon: Shield, color: "bg-accent text-accent-foreground", desc: "Gerencia equipe e configurações" },
  member: { label: "Membro", icon: Users, color: "bg-secondary text-secondary-foreground", desc: "Visualiza e cria registros" },
  viewer: { label: "Leitor", icon: Eye, color: "bg-muted text-muted-foreground", desc: "Acesso somente leitura" },
};

const ASSIGNABLE_ROLES: AppRole[] = ["admin", "member", "viewer"];

const Team = () => {
  const { user } = useAuth();
  const { members, isLoading, currentRole, isAdmin, inviteMember, updateRole, removeMember } = useMemberships();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("member");
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    await inviteMember.mutateAsync({ email, role });
    setEmail("");
    setRole("member");
  };

  return (
    <AppLayout>
      <div className="max-w-[1000px] space-y-6">
        <div>
          <h1 className="text-[20px] font-bold text-foreground tracking-tight">Equipe & Acesso</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Gerencie membros, funções e permissões da sua empresa.
            {currentRole && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase text-foreground">
                Sua função: {ROLE_CONFIG[currentRole]?.label || currentRole}
              </span>
            )}
          </p>
        </div>

        {/* Legenda de Funções */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.entries(ROLE_CONFIG) as [AppRole, typeof ROLE_CONFIG["owner"]][]).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <div key={key} className="metric-card flex items-center gap-3 py-3">
                <div className={`rounded-lg p-2 ${cfg.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-foreground">{cfg.label}</p>
                  <p className="text-[10px] text-muted-foreground">{cfg.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Card de Convite */}
          {isAdmin && (
            <div className="lg:col-span-1">
              <div className="metric-card space-y-4">
                <h2 className="text-[13px] font-bold text-foreground flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Adicionar Membro
                </h2>
                <form onSubmit={handleInvite} className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">E-mail</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="colega@empresa.com"
                      className="h-9 text-[13px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Função</Label>
                    <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                      <SelectTrigger className="h-9 text-[13px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSIGNABLE_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>{ROLE_CONFIG[r].label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <button
                    type="submit"
                    disabled={inviteMember.isPending || !email}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-foreground py-2.5 text-[13px] font-semibold text-background hover:bg-foreground/90 transition-all disabled:opacity-50"
                  >
                    {inviteMember.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar Membro"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Lista de Membros */}
          <div className={isAdmin ? "lg:col-span-2" : "lg:col-span-3"}>
            <div className="overflow-hidden rounded-xl border border-border bg-background">
              <div className="border-b border-border px-5 py-3 flex items-center justify-between bg-secondary/30">
                <h2 className="text-[13px] font-bold text-foreground">Membros</h2>
                <span className="text-[11px] font-semibold text-muted-foreground">{members.length} no total</span>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : members.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Users className="h-8 w-8 text-muted-foreground/30 mb-3" />
                  <p className="text-[13px] text-muted-foreground">Nenhum membro ainda</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {members.map((m) => {
                    const cfg = ROLE_CONFIG[m.role];
                    const Icon = cfg.icon;
                    const isOwnerRow = m.role === "owner";
                    const isSelf = m.user_id === user?.id;
                    const profileName = (m as any).profiles?.name || m.invited_email || "Desconhecido";
                    const profileEmail = (m as any).profiles?.email || m.invited_email || "";

                    return (
                      <div key={m.id} className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/20 transition-colors group">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
                          {profileName[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-semibold text-foreground truncate">
                              {profileName}
                              {isSelf && <span className="ml-1 text-[10px] text-muted-foreground">(você)</span>}
                            </p>
                            {isOwnerRow && <Star className="h-3 w-3 fill-primary text-primary" />}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Mail className="h-3 w-3 text-muted-foreground/40" />
                            <p className="text-[11px] text-muted-foreground truncate">{profileEmail}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {editingId === m.id && isAdmin && !isOwnerRow ? (
                            <select
                              value={m.role}
                              onChange={(e) => {
                                updateRole.mutate({ membershipId: m.id, newRole: e.target.value as AppRole });
                                setEditingId(null);
                              }}
                              onBlur={() => setEditingId(null)}
                              autoFocus
                              className="rounded-lg border border-border bg-background px-2 py-1 text-[11px] text-foreground"
                            >
                              {ASSIGNABLE_ROLES.map((r) => (
                                <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
                              ))}
                            </select>
                          ) : (
                            <button
                              onClick={() => isAdmin && !isOwnerRow ? setEditingId(m.id) : null}
                              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${cfg.color} ${isAdmin && !isOwnerRow ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
                            >
                              <Icon className="h-3 w-3" />
                              {cfg.label}
                              {isAdmin && !isOwnerRow && <ChevronDown className="h-2.5 w-2.5 opacity-50" />}
                            </button>
                          )}

                          {isAdmin && !isOwnerRow && !isSelf && (
                            <button
                              onClick={() => removeMember.mutate(m.id)}
                              className="rounded-lg p-1.5 text-muted-foreground/30 hover:bg-destructive/10 hover:text-destructive transition-all opacity-0 group-hover:opacity-100"
                              title="Remover membro"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Info de Permissões */}
            <div className="mt-4 flex items-start gap-4 p-4 rounded-xl border border-border bg-secondary/10">
              <Shield className="h-5 w-5 text-accent mt-0.5 shrink-0" />
              <div>
                <p className="text-[12px] font-semibold text-foreground">Controle de Acesso</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  <strong>Proprietários</strong> têm controle total. <strong>Admins</strong> gerenciam equipe e configurações.
                  <strong> Membros</strong> podem criar e editar registros. <strong>Leitores</strong> têm acesso somente leitura.
                  Todo acesso é aplicado no banco de dados via row-level security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Team;
