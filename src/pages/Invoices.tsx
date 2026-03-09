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

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-info/10 text-info",
  paid: "bg-success/10 text-success",
  overdue: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
  open: "bg-info/10 text-info",
  partial: "bg-warning/10 text-warning",
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

  // Invoice form
  const [direction, setDirection] = useState<"receivable" | "payable">("receivable");
  const [selectedContact, setSelectedContact] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState([{ description: "", quantity: 1, unit_price: 0 }]);
  const [notes, setNotes] = useState("");

  const totalReceivable = (receivables.data || [])
    .filter((r) => r.status === "open" || r.status === "partial")
    .reduce((s, r) => s + Number(r.amount_due) - Number(r.amount_paid), 0);

  const totalPayable = (payables.data || [])
    .filter((p) => p.status === "open" || p.status === "partial")
    .reduce((s, p) => s + Number(p.amount_due) - Number(p.amount_paid), 0);

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
      },
      {
        onSuccess: () => {
          setShowInvoiceDialog(false);
          setItems([{ description: "", quantity: 1, unit_price: 0 }]);
          setInvoiceNumber("");
          setDueDate("");
          setNotes("");
          setSelectedContact("");
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
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Billing</h1>
            <p className="text-[13px] text-muted-foreground">Invoices, receivables & payables</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Contact
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Contact</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <Select value={contactType} onValueChange={(v) => setContactType(v as "customer" | "vendor")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Name" value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} />
                  <Input placeholder="Email" value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} />
                  <Input placeholder="Document (CNPJ/CPF)" value={newContact.document} onChange={(e) => setNewContact({ ...newContact, document: e.target.value })} />
                  <Button onClick={handleCreateContact} disabled={!newContact.name || createCustomer.isPending || createVendor.isPending} className="w-full">
                    {(createCustomer.isPending || createVendor.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create {contactType}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Invoice
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>New Invoice</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2 max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={direction} onValueChange={(v) => { setDirection(v as "receivable" | "payable"); setSelectedContact(""); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receivable">Receivable (Income)</SelectItem>
                        <SelectItem value="payable">Payable (Expense)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={selectedContact} onValueChange={setSelectedContact}>
                      <SelectTrigger><SelectValue placeholder={direction === "receivable" ? "Customer" : "Vendor"} /></SelectTrigger>
                      <SelectContent>
                        {(direction === "receivable" ? customers.data : vendors.data)?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Invoice #" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
                    <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <p className="text-[13px] font-medium text-foreground">Line Items</p>
                    {items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_60px_80px] gap-2">
                        <Input placeholder="Description" value={item.description} onChange={(e) => {
                          const next = [...items];
                          next[idx].description = e.target.value;
                          setItems(next);
                        }} />
                        <Input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => {
                          const next = [...items];
                          next[idx].quantity = Number(e.target.value);
                          setItems(next);
                        }} />
                        <Input type="number" placeholder="Price" value={item.unit_price || ""} onChange={(e) => {
                          const next = [...items];
                          next[idx].unit_price = Number(e.target.value);
                          setItems(next);
                        }} />
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" onClick={() => setItems([...items, { description: "", quantity: 1, unit_price: 0 }])}>
                      <Plus className="h-3 w-3 mr-1" /> Add item
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
                    Create Invoice
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
                  <ArrowDownLeft className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Receivables</p>
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
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Payables</p>
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
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Overdue</p>
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
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Contacts</p>
                  <p className="text-lg font-semibold text-foreground">
                    {(customers.data?.length || 0) + (vendors.data?.length || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="invoices">
          <TabsList>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="receivables">Receivables</TabsTrigger>
            <TabsTrigger value="payables">Payables</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
          </TabsList>

          <TabsContent value="invoices">
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="p-3 font-medium">Invoice #</th>
                      <th className="p-3 font-medium">Type</th>
                      <th className="p-3 font-medium">Contact</th>
                      <th className="p-3 font-medium">Due Date</th>
                      <th className="p-3 font-medium text-right">Amount</th>
                      <th className="p-3 font-medium">Status</th>
                      <th className="p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.isLoading ? (
                      <tr><td colSpan={7} className="p-8 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></td></tr>
                    ) : (invoices.data || []).length === 0 ? (
                      <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No invoices yet</td></tr>
                    ) : (
                      (invoices.data || []).map((inv) => (
                        <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-3 font-medium">{inv.invoice_number}</td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-[11px]">
                              {inv.direction === "receivable" ? "Income" : "Expense"}
                            </Badge>
                          </td>
                          <td className="p-3">{(inv as any).customer?.name || (inv as any).vendor?.name || "—"}</td>
                          <td className="p-3">{format(new Date(inv.due_date), "MMM dd, yyyy")}</td>
                          <td className="p-3 text-right font-medium">{formatCurrency(Number(inv.total_amount))}</td>
                          <td className="p-3">
                            <Badge className={`${statusColors[inv.status] || ""} text-[11px] border-0`}>
                              {inv.status}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {inv.status === "draft" && (
                              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => updateInvoiceStatus.mutate({ id: inv.id, status: "sent" })}>
                                Send
                              </Button>
                            )}
                            {inv.status === "sent" && (
                              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => updateInvoiceStatus.mutate({ id: inv.id, status: "paid" })}>
                                Mark Paid
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
                      <th className="p-3 font-medium">Customer</th>
                      <th className="p-3 font-medium">Due Date</th>
                      <th className="p-3 font-medium text-right">Amount Due</th>
                      <th className="p-3 font-medium text-right">Paid</th>
                      <th className="p-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(receivables.data || []).length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No receivables</td></tr>
                    ) : (
                      (receivables.data || []).map((r) => (
                        <tr key={r.id} className="border-b last:border-0">
                          <td className="p-3">{(r as any).customer?.name || "—"}</td>
                          <td className="p-3">{format(new Date(r.due_date), "MMM dd, yyyy")}</td>
                          <td className="p-3 text-right font-medium">{formatCurrency(Number(r.amount_due))}</td>
                          <td className="p-3 text-right">{formatCurrency(Number(r.amount_paid))}</td>
                          <td className="p-3">
                            <Badge className={`${statusColors[r.status] || ""} text-[11px] border-0`}>{r.status}</Badge>
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
                      <th className="p-3 font-medium">Vendor</th>
                      <th className="p-3 font-medium">Due Date</th>
                      <th className="p-3 font-medium text-right">Amount Due</th>
                      <th className="p-3 font-medium text-right">Paid</th>
                      <th className="p-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(payables.data || []).length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No payables</td></tr>
                    ) : (
                      (payables.data || []).map((p) => (
                        <tr key={p.id} className="border-b last:border-0">
                          <td className="p-3">{(p as any).vendor?.name || "—"}</td>
                          <td className="p-3">{format(new Date(p.due_date), "MMM dd, yyyy")}</td>
                          <td className="p-3 text-right font-medium">{formatCurrency(Number(p.amount_due))}</td>
                          <td className="p-3 text-right">{formatCurrency(Number(p.amount_paid))}</td>
                          <td className="p-3">
                            <Badge className={`${statusColors[p.status] || ""} text-[11px] border-0`}>{p.status}</Badge>
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
                    <Users className="h-4 w-4" /> Customers
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-[13px]">
                    <tbody>
                      {(customers.data || []).length === 0 ? (
                        <tr><td className="p-6 text-center text-muted-foreground">No customers</td></tr>
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
                    <Building2 className="h-4 w-4" /> Vendors
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-[13px]">
                    <tbody>
                      {(vendors.data || []).length === 0 ? (
                        <tr><td className="p-6 text-center text-muted-foreground">No vendors</td></tr>
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
