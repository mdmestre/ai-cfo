import { AppLayout } from "@/components/layout/AppLayout";
import { useInvoices } from "@/hooks/use-invoices";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, ArrowUpRight, ArrowDownLeft, Users, Building2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-info/10 text-info",
  paid: "bg-success/10 text-success",
  overdue: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
  open: "bg-info/10 text-info",
  partial: "bg-warning/10 text-warning",
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  sent: "Enviada",
  paid: "Paga",
  overdue: "Vencida",
  cancelled: "Cancelada",
  open: "Aberta",
  partial: "Parcial",
};

function formatCurrency(val: number) {
  return `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

const Invoices = () => {
  const {
    invoices, customers, vendors, receivables, payables,
    createInvoice, createCustomer, createVendor, updateInvoiceStatus,
  } = useInvoices();

  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [contactType, setContactType] = useState<"customer" | "vendor">("customer");
  const [newContact, setNewContact] = useState({ name: "", email: "", document: "" });

  const [direction, setDirection] = useState<"receivable" | "payable">("receivable");
  const [selectedContact, setSelectedContact] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState([{ description: "", quantity: 1, unit_price: 0 }]);
  const [notes, setNotes] = useState("");

  const [invoiceType, setInvoiceType] = useState("service");
  const [series, setSeries] = useState("1");
  const [municipality, setMunicipality] = useState("");
  const [taxRegime, setTaxRegime] = useState("simples_nacional");

  const totalReceivable = (receivables.data || [])
    .filter((r) => r.status === "open" || r.status === "partial")
    .reduce((s, r) => s + Number(r.amount), 0);

  const totalPayable = (payables.data || [])
    .filter((p) => p.status === "open" || p.status === "partial")
    .reduce((s, p) => s + Number(p.amount), 0);

  const overdueCount = (invoices.data || []).filter((i) => i.status === "overdue").length;

  const handleCreateInvoice = () => {
    createInvoice.mutate(
      {
        direction,
        customer_id: direction === "receivable" ? selectedContact : undefined,
        vendor_id: direction === "payable" ? selectedContact : undefined,
        invoice_number: invoiceNumber,
        due_date: dueDate,
        items: items.filter((i) => i.description),
        notes,
        invoice_type: invoiceType,
        series,
        municipality,
        tax_regime: taxRegime,
      },
      {
        onSuccess: () => {
          setShowInvoiceDialog(false);
          setItems([{ description: "", quantity: 1, unit_price: 0 }]);
          setInvoiceNumber("");
          setDueDate("");
          setNotes("");
          setSelectedContact("");
          setInvoiceType("service");
          setSeries("1");
          setMunicipality("");
          setTaxRegime("simples_nacional");
        },
      }
    );
  };

  const handleCreateContact = () => {
    const mutation = contactType === "customer" ? createCustomer : createVendor;
    mutation.mutate(newContact, {
      onSuccess: () => {
        setShowContactDialog(false);
        setNewContact({ name: "", email: "", document: "" });
      },
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Faturamento</h1>
            <p className="text-[13px] text-muted-foreground">Faturas, contas a receber e a pagar</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Contato
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Contato</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <Select value={contactType} onValueChange={(v) => setContactType(v as "customer" | "vendor")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Cliente</SelectItem>
                      <SelectItem value="vendor">Fornecedor</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Nome" value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} />
                  <Input placeholder="E-mail" value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} />
                  <Input placeholder="Documento (CNPJ/CPF)" value={newContact.document} onChange={(e) => setNewContact({ ...newContact, document: e.target.value })} />
                  <Button onClick={handleCreateContact} disabled={!newContact.name || createCustomer.isPending || createVendor.isPending} className="w-full">
                    {(createCustomer.isPending || createVendor.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Criar {contactType === "customer" ? "Cliente" : "Fornecedor"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Fatura
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Nova Fatura</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2 max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={direction} onValueChange={(v) => { setDirection(v as "receivable" | "payable"); setSelectedContact(""); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receivable">A Receber (Receita)</SelectItem>
                        <SelectItem value="payable">A Pagar (Despesa)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={selectedContact} onValueChange={setSelectedContact}>
                      <SelectTrigger><SelectValue placeholder={direction === "receivable" ? "Cliente" : "Fornecedor"} /></SelectTrigger>
                      <SelectContent>
                        {(direction === "receivable" ? customers.data : vendors.data)?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Nº da Fatura" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
                    <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 p-3 bg-muted/20 border border-border rounded-md">
                    <div className="space-y-1">
                      <p className="text-[11px] text-muted-foreground">Tipo</p>
                      <Select value={invoiceType} onValueChange={setInvoiceType}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="service">Serviço</SelectItem>
                          <SelectItem value="product">Produto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] text-muted-foreground">Série</p>
                      <Input value={series} onChange={(e) => setSeries(e.target.value)} className="h-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] text-muted-foreground">Regime</p>
                      <Select value={taxRegime} onValueChange={setTaxRegime}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simples_nacional">Simples</SelectItem>
                          <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                          <SelectItem value="lucro_real">Lucro Real</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] text-muted-foreground">Município Base</p>
                      <Input placeholder="Ex: São Paulo" value={municipality} onChange={(e) => setMunicipality(e.target.value)} className="h-8" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[13px] font-medium text-foreground">Itens</p>
                    {items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_60px_80px] gap-2">
                        <Input placeholder="Descrição" value={item.description} onChange={(e) => {
                          const next = [...items];
                          next[idx].description = e.target.value;
                          setItems(next);
                        }} />
                        <Input type="number" placeholder="Qtd" value={item.quantity} onChange={(e) => {
                          const next = [...items];
                          next[idx].quantity = Number(e.target.value);
                          setItems(next);
                        }} />
                        <Input type="number" placeholder="Preço" value={item.unit_price || ""} onChange={(e) => {
                          const next = [...items];
                          next[idx].unit_price = Number(e.target.value);
                          setItems(next);
                        }} />
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" onClick={() => setItems([...items, { description: "", quantity: 1, unit_price: 0 }])}>
                      <Plus className="h-3 w-3 mr-1" /> Adicionar item
                    </Button>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium text-muted-foreground">Total</span>
                    <span className="text-lg font-semibold text-foreground">
                      {formatCurrency(items.reduce((s, i) => s + i.quantity * i.unit_price, 0))}
                    </span>
                  </div>

                  <Button onClick={handleCreateInvoice} disabled={!invoiceNumber || !dueDate || createInvoice.isPending} className="w-full">
                    {createInvoice.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Criar Fatura
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
                  <ArrowDownLeft className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">A Receber</p>
                  <p className="text-lg font-semibold text-foreground">{formatCurrency(totalReceivable)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
                  <ArrowUpRight className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">A Pagar</p>
                  <p className="text-lg font-semibold text-foreground">{formatCurrency(totalPayable)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10">
                  <FileText className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Vencidas</p>
                  <p className="text-lg font-semibold text-foreground">{overdueCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info/10">
                  <Users className="h-4 w-4 text-info" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Contatos</p>
                  <p className="text-lg font-semibold text-foreground">
                    {(customers.data?.length || 0) + (vendors.data?.length || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Abas */}
        <Tabs defaultValue="invoices">
          <TabsList>
            <TabsTrigger value="invoices">Faturas</TabsTrigger>
            <TabsTrigger value="receivables">A Receber</TabsTrigger>
            <TabsTrigger value="payables">A Pagar</TabsTrigger>
            <TabsTrigger value="contacts">Contatos</TabsTrigger>
          </TabsList>

          <TabsContent value="invoices">
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="p-3 font-medium">Nº Fatura</th>
                      <th className="p-3 font-medium">Tipo</th>
                      <th className="p-3 font-medium">Contato</th>
                      <th className="p-3 font-medium">Vencimento</th>
                      <th className="p-3 font-medium text-right">Valor</th>
                      <th className="p-3 font-medium">Status</th>
                      <th className="p-3 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.isLoading ? (
                      <tr><td colSpan={7} className="p-8 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></td></tr>
                    ) : (invoices.data || []).length === 0 ? (
                      <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Nenhuma fatura ainda</td></tr>
                    ) : (
                      (invoices.data || []).map((inv) => (
                        <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-3 font-medium">{inv.invoice_number}</td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-[11px]">
                              {inv.direction === "receivable" ? "Receita" : "Despesa"}
                            </Badge>
                          </td>
                          <td className="p-3">{(inv as any).customer?.name || (inv as any).vendor?.name || "—"}</td>
                          <td className="p-3">{format(new Date(inv.due_date), "dd/MM/yyyy", { locale: ptBR })}</td>
                          <td className="p-3 text-right font-medium">{formatCurrency(Number(inv.total_amount))}</td>
                          <td className="p-3">
                            <Badge className={`${statusColors[inv.status] || ""} text-[11px] border-0`}>
                              {statusLabels[inv.status] || inv.status}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {inv.status === "draft" && (
                              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => updateInvoiceStatus.mutate({ id: inv.id, status: "sent" })}>
                                Enviar
                              </Button>
                            )}
                            {inv.status === "sent" && (
                              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => updateInvoiceStatus.mutate({ id: inv.id, status: "paid" })}>
                                Marcar como Paga
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="receivables">
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="p-3 font-medium">Cliente</th>
                      <th className="p-3 font-medium">Vencimento</th>
                      <th className="p-3 font-medium text-right">Valor</th>
                      <th className="p-3 font-medium text-right">Pago</th>
                      <th className="p-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(receivables.data || []).length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum recebível</td></tr>
                    ) : (
                      (receivables.data || []).map((r) => (
                        <tr key={r.id} className="border-b last:border-0">
                          <td className="p-3">{(r as any).customer?.name || "—"}</td>
                          <td className="p-3">{format(new Date(r.due_date), "dd/MM/yyyy", { locale: ptBR })}</td>
                          <td className="p-3 text-right font-medium">{formatCurrency(Number(r.amount))}</td>
                          <td className="p-3 text-right">{r.status === "paid" ? formatCurrency(Number(r.amount)) : formatCurrency(0)}</td>
                          <td className="p-3">
                            <Badge className={`${statusColors[r.status] || ""} text-[11px] border-0`}>{statusLabels[r.status] || r.status}</Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payables">
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="p-3 font-medium">Fornecedor</th>
                      <th className="p-3 font-medium">Vencimento</th>
                      <th className="p-3 font-medium text-right">Valor</th>
                      <th className="p-3 font-medium text-right">Pago</th>
                      <th className="p-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(payables.data || []).length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum pagável</td></tr>
                    ) : (
                      (payables.data || []).map((p) => (
                        <tr key={p.id} className="border-b last:border-0">
                          <td className="p-3">{(p as any).vendor?.name || "—"}</td>
                          <td className="p-3">{format(new Date(p.due_date), "dd/MM/yyyy", { locale: ptBR })}</td>
                          <td className="p-3 text-right font-medium">{formatCurrency(Number(p.amount))}</td>
                          <td className="p-3 text-right">{p.status === "paid" ? formatCurrency(Number(p.amount)) : formatCurrency(0)}</td>
                          <td className="p-3">
                            <Badge className={`${statusColors[p.status] || ""} text-[11px] border-0`}>{statusLabels[p.status] || p.status}</Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" /> Clientes
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-[13px]">
                    <tbody>
                      {(customers.data || []).length === 0 ? (
                        <tr><td className="p-6 text-center text-muted-foreground">Nenhum cliente</td></tr>
                      ) : (
                        (customers.data || []).map((c) => (
                          <tr key={c.id} className="border-b last:border-0">
                            <td className="p-3 font-medium">{c.name}</td>
                            <td className="p-3 text-muted-foreground">{c.email || "—"}</td>
                            <td className="p-3 text-muted-foreground">{c.document || "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 className="h-4 w-4" /> Fornecedores
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-[13px]">
                    <tbody>
                      {(vendors.data || []).length === 0 ? (
                        <tr><td className="p-6 text-center text-muted-foreground">Nenhum fornecedor</td></tr>
                      ) : (
                        (vendors.data || []).map((v) => (
                          <tr key={v.id} className="border-b last:border-0">
                            <td className="p-3 font-medium">{v.name}</td>
                            <td className="p-3 text-muted-foreground">{v.email || "—"}</td>
                            <td className="p-3 text-muted-foreground">{v.document || "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Invoices;
