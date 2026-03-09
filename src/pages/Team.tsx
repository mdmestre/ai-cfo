import { AppLayout } from "@/components/layout/AppLayout";
import { useTeam } from "@/hooks/use-team";
import { UserPlus, Shield, Mail, MoreHorizontal, Loader2, Star } from "lucide-react";
import { useState } from "react";

const Team = () => {
    const { members, isLoading, inviteMember } = useTeam();
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("Viewer");

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        await inviteMember.mutateAsync({ email, role });
        setEmail("");
    };

    return (
        <AppLayout>
            <div className="max-w-[1000px] space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-foreground tracking-tight text-premium">Team Management</h1>
                        <p className="mt-0.5 text-[13px] text-muted-foreground">Manage your company's stakeholders and departmental access</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Invite Card */}
                    <div className="lg:col-span-1">
                        <div className="metric-card bg-secondary/10 border-foreground/5 shadow-premium">
                            <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                                <UserPlus className="h-4 w-4" />
                                Invite Stakeholder
                            </h2>
                            <form onSubmit={handleInvite} className="space-y-4">
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="e.g. cfo@company.com"
                                        className="mt-1.5 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-[13px] outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Governance Role</label>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="mt-1.5 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-[13px] outline-none focus:ring-1 focus:ring-primary"
                                    >
                                        <option>Viewer</option>
                                        <option>Analyst</option>
                                        <option>Admin</option>
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    disabled={inviteMember.isPending}
                                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-[13px] font-bold text-white shadow-md hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {inviteMember.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Invitation"}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Members List */}
                    <div className="lg:col-span-2">
                        <div className="overflow-hidden rounded-xl border border-border/60 bg-white shadow-sm">
                            <div className="border-b border-border/60 px-5 py-4 bg-secondary/5 flex items-center justify-between">
                                <h2 className="text-[13px] font-bold text-foreground">Active Members</h2>
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{members.length} Total</span>
                            </div>

                            {isLoading ? (
                                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                            ) : (
                                <div className="divide-y divide-border/60">
                                    {members.map((member: any) => (
                                        <div key={member.id} className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/5 transition-colors group">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold shadow-inner">
                                                {member.name?.[0] || member.email[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[13px] font-bold text-foreground truncate">{member.name || "Pending Invite"}</p>
                                                    {member.role === 'Owner' && <Star className="h-3 w-3 fill-yellow-400 text-yellow-500" />}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Mail className="h-3 w-3 text-muted-foreground/40" />
                                                    <p className="text-[11px] text-muted-foreground truncate">{member.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${member.role === 'Owner' ? 'bg-primary text-white' : 'bg-secondary text-foreground'
                                                    }`}>
                                                    {member.role}
                                                </span>
                                                <button className="rounded-lg p-2 text-muted-foreground/20 hover:bg-secondary hover:text-foreground transition-all opacity-0 group-hover:opacity-100">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-4 flex items-start gap-4 p-4 rounded-xl border border-accent/20 bg-accent/5">
                            <Shield className="h-5 w-5 text-accent mt-0.5" />
                            <div>
                                <p className="text-[12px] font-bold text-foreground tracking-tight">Security Protocol</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                                    Access is restricted based on corporate roles. Analysts cannot access banking credentials or initiate PIX transfers without Admin approval.
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
