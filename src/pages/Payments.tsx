import { AppLayout } from "@/components/layout/AppLayout";
import { usePayments } from "@/hooks/use-payments";
import { Zap, QrCode, ArrowUpRight, Copy, CheckCircle2, Loader2, Clock, DollarSign, Plus, Key } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

const PixHub = () => {
  const { generatePix, payments, pixKeys, createPixKey, isLoading } = usePayments();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [generatedPix, setGeneratedPix] = useState<any>(null);
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [keyType, setKeyType] = useState("email");
  const [keyValue, setKeyValue] = useState("");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return toast.error("Enter a valid amount");
    try {
      const result = await generatePix.mutateAsync({ amount: Number(amount), description });
      setGeneratedPix(result);
      toast.success("Pix QR Code generated");
    } catch {
      toast.error("Failed to generate Pix");
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPixKey.mutateAsync({ key_type: keyType, key_value: keyValue });
      toast.success("PIX key registered");
      setShowKeyForm(false);
      setKeyValue("");
    } catch {
      toast.error("Failed to register PIX key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Pix code copied");
  };

  return (
    <AppLayout>
      <div className="max-w-[1200px] space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Pix Payment Hub</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Generate and track payments via Pix</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowKeyForm(!showKeyForm)} className="flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-[13px] font-medium text-foreground hover:bg-secondary/80 transition-all">
              <Key className="h-3.5 w-3.5" />
              Manage Keys
            </button>
            <div className="flex h-10 items-center gap-2 rounded-lg bg-primary/5 px-4 text-[13px] font-bold text-primary border border-primary/10">
              <Zap className="h-4 w-4" />
              24/7
            </div>
          </div>
        </div>

        {/* PIX Keys */}
        {showKeyForm && (
          <div className="metric-card space-y-4 animate-slide-up">
            <p className="text-[14px] font-bold text-foreground">PIX Keys ({pixKeys.length})</p>
            {pixKeys.length > 0 && (
              <div className="space-y-2">
                {pixKeys.map((k: any) => (
                  <div key={k.id} className="flex items-center justify-between rounded-md bg-secondary/30 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xxs font-bold uppercase text-muted-foreground">{k.key_type}</span>
                      <span className="text-[13px] text-foreground">{k.key_value}</span>
                    </div>
                    <span className="text-xxs text-primary font-bold">Active</span>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={handleCreateKey} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <select value={keyType} onChange={(e) => setKeyType(e.target.value)} className="rounded-md border border-border bg-card px-3 py-2 text-[13px]">
                <option value="email">Email</option>
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
                <option value="phone">Phone</option>
                <option value="random">Random</option>
              </select>
              <input type="text" placeholder="Key value" value={keyValue} onChange={(e) => setKeyValue(e.target.value)} required className="rounded-md border border-border bg-card px-3 py-2 text-[13px] outline-none" />
              <button type="submit" disabled={createPixKey.isPending} className="rounded-md bg-primary px-3 py-2 text-[13px] font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50">
                {createPixKey.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" /> : "Register Key"}
              </button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="metric-card space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 text-primary">
                  <QrCode className="h-5 w-5" />
                </div>
                <h2 className="text-[15px] font-bold text-foreground">Generate Payment</h2>
              </div>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xxs font-bold uppercase tracking-wider text-muted-foreground/70">Amount (BRL)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-[13px] font-bold">R$</span>
                    <input type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-lg border border-border/50 bg-secondary/20 pl-9 pr-3 py-2.5 text-[14px] font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xxs font-bold uppercase tracking-wider text-muted-foreground/70">Description</label>
                  <textarea placeholder="e.g. Invoice #402" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg border border-border/50 bg-secondary/20 px-3 py-2.5 text-[13px] text-foreground outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px] resize-none" />
                </div>
                <button type="submit" disabled={generatePix.isPending} className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md">
                  {generatePix.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  Generate Instant Pix
                </button>
              </form>

              {generatedPix && (
                <div className="pt-6 animate-slide-up border-t border-border/40">
                  <div className="flex flex-col items-center justify-center space-y-4 rounded-xl bg-secondary/30 p-6 border border-border/20">
                    <div className="h-32 w-32 bg-background p-2 rounded-lg shadow-sm border border-border/40">
                      <div className="h-full w-full bg-secondary flex items-center justify-center text-muted-foreground">
                        <QrCode className="h-12 w-12" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">R$ {Number(generatedPix.amount).toFixed(2)}</p>
                      <p className="text-xxs font-bold uppercase text-muted-foreground">Expires in 30:00</p>
                    </div>
                    <button onClick={() => copyToClipboard(generatedPix.qrCodeString)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/20 bg-background px-3 py-2 text-[12px] font-bold text-primary hover:bg-primary/5 transition-all">
                      <Copy className="h-3.5 w-3.5" />
                      Copy Pix Code
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="metric-card h-full min-h-[500px]">
              <h2 className="text-[15px] font-bold text-foreground mb-6">Pix Transactions</h2>
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/30" />
                </div>
              ) : payments.length > 0 ? (
                <div className="divide-y divide-border/40">
                  {payments.map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between py-4 group hover:bg-secondary/5 transition-colors rounded-lg px-2 -mx-2">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${payment.status === 'completed' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          {payment.status === 'completed' ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-foreground">R$ {Number(payment.amount).toFixed(2)}</p>
                          <p className="text-xxs font-bold uppercase tracking-tight text-muted-foreground/60">
                            {format(new Date(payment.created_at), "MMM dd, HH:mm")} · {payment.direction} · {payment.id.substring(0, 8)}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[11px] font-bold uppercase tracking-widest ${payment.status === 'completed' ? 'text-primary' : 'text-muted-foreground'}`}>
                        {payment.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="h-16 w-16 bg-secondary flex items-center justify-center rounded-full mb-4">
                    <DollarSign className="h-8 w-8 text-muted-foreground/20" />
                  </div>
                  <p className="text-[13px] font-bold text-muted-foreground/40 uppercase tracking-widest">No Pix payments yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default PixHub;
