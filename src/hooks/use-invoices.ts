import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/use-company";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useInvoices() {
  const { company } = useCompany();
  const { user } = useAuth();
  const qc = useQueryClient();
  const companyId = company?.id;

  const invoices = useQuery({
    queryKey: ["invoices", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, customer:customers(*), vendor:vendors(*), items:invoice_items(*)")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const customers = useQuery({
    queryKey: ["customers", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("company_id", companyId!)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const vendors = useQuery({
    queryKey: ["vendors", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("company_id", companyId!)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const receivables = useQuery({
    queryKey: ["receivables", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receivables")
        .select("*, invoice:invoices(*), customer:customers(*)")
        .eq("company_id", companyId!)
        .order("due_date");
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const payables = useQuery({
    queryKey: ["payables", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payables")
        .select("*, invoice:invoices(*), vendor:vendors(*)")
        .eq("company_id", companyId!)
        .order("due_date");
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const createCustomer = useMutation({
    mutationFn: async (input: { name: string; email?: string; document?: string }) => {
      const { data, error } = await supabase
        .from("customers")
        .insert({ ...input, company_id: companyId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer created");
    },
  });

  const createVendor = useMutation({
    mutationFn: async (input: { name: string; email?: string; document?: string }) => {
      const { data, error } = await supabase
        .from("vendors")
        .insert({ ...input, company_id: companyId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Vendor created");
    },
  });

  const createInvoice = useMutation({
    mutationFn: async (input: {
      direction: "receivable" | "payable";
      customer_id?: string;
      vendor_id?: string;
      invoice_number: string;
      due_date: string;
      items: { description: string; quantity: number; unit_price: number }[];
      notes?: string;
    }) => {
      const subtotal = input.items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
      const { data: invoice, error } = await supabase
        .from("invoices")
        .insert({
          company_id: companyId!,
          created_by: user!.id,
          direction: input.direction,
          customer_id: input.customer_id || null,
          vendor_id: input.vendor_id || null,
          invoice_number: input.invoice_number,
          due_date: input.due_date,
          subtotal,
          total_amount: subtotal,
          notes: input.notes,
        })
        .select()
        .single();
      if (error) throw error;

      // Insert line items
      if (input.items.length > 0) {
        const { error: itemsError } = await supabase.from("invoice_items").insert(
          input.items.map((item) => ({
            invoice_id: invoice.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.quantity * item.unit_price,
          }))
        );
        if (itemsError) throw itemsError;
      }

      // Create receivable or payable
      if (input.direction === "receivable" && input.customer_id) {
        await supabase.from("receivables").insert({
          company_id: companyId!,
          invoice_id: invoice.id,
          customer_id: input.customer_id,
          amount_due: subtotal,
          due_date: input.due_date,
        });
      } else if (input.direction === "payable" && input.vendor_id) {
        await supabase.from("payables").insert({
          company_id: companyId!,
          invoice_id: invoice.id,
          vendor_id: input.vendor_id,
          amount_due: subtotal,
          due_date: input.due_date,
        });
      }

      return invoice;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["receivables"] });
      qc.invalidateQueries({ queryKey: ["payables"] });
      toast.success("Invoice created");
    },
  });

  const updateInvoiceStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("invoices").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice updated");
    },
  });

  return {
    invoices,
    customers,
    vendors,
    receivables,
    payables,
    createCustomer,
    createVendor,
    createInvoice,
    updateInvoiceStatus,
  };
}
