import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create supabase client to fetch financial context
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { messages, companyId } = await req.json();

    if (!messages || !companyId) {
      return new Response(
        JSON.stringify({ error: "messages and companyId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch financial context for RAG
    const [accountsRes, walletsRes, expensesRes, journalRes] = await Promise.all([
      supabase.from("accounts").select("bank_name, account_type, balance").eq("company_id", companyId),
      supabase.from("wallets").select("name, wallet_type, balance, currency").eq("company_id", companyId),
      supabase.from("expenses").select("amount, description, status, expense_date, merchant").eq("company_id", companyId).order("expense_date", { ascending: false }).limit(20),
      supabase.from("journal_entries").select("description, entry_date, status").eq("company_id", companyId).order("created_at", { ascending: false }).limit(10),
    ]);

    const totalBalance = (accountsRes.data || []).reduce((s, a) => s + Number(a.balance || 0), 0);
    const walletBalance = (walletsRes.data || []).reduce((s, w) => s + Number(w.balance || 0), 0);
    const pendingExpenses = (expensesRes.data || []).filter(e => e.status === "pending");
    const approvedExpenses = (expensesRes.data || []).filter(e => e.status === "approved");
    const totalPendingAmount = pendingExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);

    const financialContext = `
FINANCIAL CONTEXT (Real-time data):
- Total Bank Balance: R$ ${totalBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- Wallet Balance: R$ ${walletBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- Connected Accounts: ${(accountsRes.data || []).length}
- Active Wallets: ${(walletsRes.data || []).length}
- Pending Expenses: ${pendingExpenses.length} (R$ ${totalPendingAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})
- Recently Approved Expenses: ${approvedExpenses.length}
- Recent Journal Entries: ${(journalRes.data || []).length}
${(accountsRes.data || []).length > 0 ? `\nAccounts:\n${(accountsRes.data || []).map(a => `  - ${a.bank_name} (${a.account_type}): R$ ${Number(a.balance).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`).join("\n")}` : ""}
${(expensesRes.data || []).length > 0 ? `\nRecent Expenses:\n${(expensesRes.data || []).slice(0, 5).map(e => `  - ${e.description || e.merchant || "N/A"}: R$ ${Number(e.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${e.status})`).join("\n")}` : ""}
`.trim();

    const systemPrompt = `You are Atlas AI, an elite AI CFO for high-growth companies. You have real-time access to the company's financial infrastructure.

Your capabilities:
- Analyze cash position, runway, and burn rate
- Review expenses and identify anomalies
- Forecast cash flow trends
- Provide strategic financial recommendations
- Answer any question about the company's financial health

Rules:
- Be precise and data-driven. Use the actual numbers from the financial context.
- Format currency as R$ with Brazilian formatting.
- Use **bold** for key metrics and important values.
- Be concise but thorough. Structure answers with clear sections when appropriate.
- If data is insufficient, say so honestly and suggest what data would help.
- Always think like a CFO: risk-aware, strategic, proactive.

${financialContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
