import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { company_id } = await req.json();
    if (!company_id) throw new Error("company_id required");

    // Gather financial data
    const [accountsRes, expensesRes, transactionsRes, invoicesRes] = await Promise.all([
      supabase.from("accounts").select("*").eq("company_id", company_id),
      supabase.from("expenses").select("*").eq("company_id", company_id).order("expense_date", { ascending: false }).limit(200),
      supabase.from("card_transactions").select("*").eq("company_id", company_id).order("transaction_date", { ascending: false }).limit(200),
      supabase.from("invoices").select("*").eq("company_id", company_id).order("created_at", { ascending: false }).limit(100),
    ]);

    const accounts = accountsRes.data || [];
    const expenses = expensesRes.data || [];
    const cardTxs = transactionsRes.data || [];
    const invoices = invoicesRes.data || [];

    const totalBalance = accounts.reduce((s: number, a: any) => s + Number(a.balance), 0);
    const totalExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
    const overdueInvoices = invoices.filter((i: any) => i.status === "sent" && new Date(i.due_date) < new Date()).length;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are a Financial Risk Assessment AI for a fintech platform.

Analyze this company's financial health and return a risk assessment.

FINANCIAL DATA:
- Total cash: $${totalBalance.toFixed(2)}
- Number of accounts: ${accounts.length}
- Total expenses (recent): $${totalExpenses.toFixed(2)}
- Number of expenses: ${expenses.length}
- Card transactions: ${cardTxs.length}
- Total invoices: ${invoices.length}
- Overdue invoices: ${overdueInvoices}

Return a JSON object with:
{
  "score": <0-100, higher = less risk>,
  "risk_level": "low" | "medium" | "high" | "critical",
  "factors": {
    "cash_position": { "score": <0-100>, "note": "..." },
    "expense_control": { "score": <0-100>, "note": "..." },
    "revenue_stability": { "score": <0-100>, "note": "..." },
    "payment_discipline": { "score": <0-100>, "note": "..." }
  },
  "events": [
    { "event_type": "anomaly"|"warning"|"critical", "severity": "low"|"medium"|"high", "title": "...", "description": "..." }
  ]
}

Return ONLY valid JSON, no markdown.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "{}";

    let riskData: any = {};
    try {
      const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      riskData = JSON.parse(cleaned);
    } catch {
      riskData = { score: 50, risk_level: "medium", factors: {}, events: [] };
    }

    // Store risk score
    await supabase.from("risk_scores").insert({
      company_id,
      score: riskData.score || 50,
      risk_level: riskData.risk_level || "medium",
      factors: riskData.factors || {},
    });

    // Store risk events
    if (riskData.events?.length > 0) {
      await supabase.from("risk_events").insert(
        riskData.events.map((e: any) => ({
          company_id,
          event_type: e.event_type || "warning",
          severity: e.severity || "medium",
          title: e.title || "Risk Event",
          description: e.description || "",
        }))
      );
    }

    return new Response(JSON.stringify(riskData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("risk-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
