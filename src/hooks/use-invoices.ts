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
        .select(`
          *,
          customers(name, email),
          vendors(name, email)
        `)
        .eq("company_id", companyId!)
        .order("invoice_date", { ascending: false });
      if (error) {
        console.error("invoices:", error.message);
        return [];
      }
      return data;
    },
    enabled: !!companyId,
    retry: false,
  });

  const customers = useQuery({
    queryKey: ["customers", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("company_id", companyId!)
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
        .select("*, customers(name)")
        .eq("company_id", companyId!)
        .order("due_date");
      if (error) {
        console.error("receivables:", error.message);
        return [];
      }
      return data;
    },
    enabled: !!companyId,
    retry: false,
  });

  const payables = useQuery({
    queryKey: ["payables", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payables")
        .select("*, vendors(name)")
        .eq("company_id", companyId!)
        .order("due_date");
      if (error) {
        console.error("payables:", error.message);
        return [];
      }
      return data;
    },
    enabled: !!companyId,
    retry: false,
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
      invoice_type?: string;
      series?: string;
      municipality?: string;
      tax_regime?: string;
      tax_items?: { tax_type: string; tax_rate: number; tax_base: number; tax_value: number }[];
    }) => {
      const total_amount = input.items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
      const { items, tax_items, ...invoiceData } = input;

      const { data, error } = await supabase
        .from("invoices")
        .insert({
          ...invoiceData,
          company_id: companyId!,
          total_amount,
          status: "pending",
          created_by: user!.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
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
