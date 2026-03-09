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

    // Fetch company expenses
    const { data: expenses } = await supabase
      .from("expenses")
      .select("*, expense_categories(name, code)")
      .eq("company_id", company_id)
      .order("expense_date", { ascending: false })
      .limit(500);

    // Fetch card transactions
    const { data: cardTxs } = await supabase
      .from("card_transactions")
      .select("*")
      .eq("company_id", company_id)
      .order("transaction_date", { ascending: false })
      .limit(500);

    // Fetch accounts for balance context
    const { data: accounts } = await supabase
      .from("accounts")
      .select("*")
      .eq("company_id", company_id);

    const totalBalance = (accounts || []).reduce((s: number, a: any) => s + Number(a.balance), 0);

    // Build financial context for AI analysis
    const expenseSummary = (expenses || []).map((e: any) => ({
      amount: e.amount,
      description: e.description,
      merchant: e.merchant,
      category: e.expense_categories?.name || "Uncategorized",
      date: e.expense_date,
    }));

    const cardSummary = (cardTxs || []).map((t: any) => ({
      amount: t.amount,
      merchant: t.merchant,
      category: t.category,
      description: t.description,
      date: t.transaction_date,
    }));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are a Savings Intelligence AI for a fintech platform (like Ramp's savings engine).

Analyze the following company financial data and identify REAL savings opportunities.

COMPANY CONTEXT:
- Total cash balance: $${totalBalance.toFixed(2)}
- Total expenses analyzed: ${expenseSummary.length}
- Total card transactions: ${cardSummary.length}

EXPENSES (last 500):
${JSON.stringify(expenseSummary.slice(0, 100), null, 2)}

CARD TRANSACTIONS (last 500):
${JSON.stringify(cardSummary.slice(0, 100), null, 2)}

Analyze and return a JSON array of savings insights. Each insight should have:
- insight_type: one of "duplicate_subscription", "unused_service", "price_optimization", "volume_discount", "unnecessary_expense", "contract_renegotiation"
- title: short descriptive title
- description: detailed explanation
- category: "software", "services", "infrastructure", "office", "travel", "marketing", "other"
- current_spend: estimated current monthly spend on this item
- potential_savings: estimated monthly savings
- confidence: 0-100 confidence score
- recommendation: specific actionable recommendation

If there's insufficient data, still provide strategic insights based on what's available.
Return ONLY valid JSON array, no markdown.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "[]";

    // Parse AI response
    let insights: any[] = [];
    try {
      const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      insights = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      insights = [];
    }

    // Store insights in database
    if (insights.length > 0) {
      // Clear old active insights
      await supabase
        .from("savings_insights")
        .delete()
        .eq("company_id", company_id)
        .eq("status", "active");

      // Insert new insights
      const rows = insights.map((i: any) => ({
        company_id,
        insight_type: i.insight_type || "price_optimization",
        title: i.title || "Savings Opportunity",
        description: i.description || "",
        category: i.category || "other",
        current_spend: Number(i.current_spend) || 0,
        potential_savings: Number(i.potential_savings) || 0,
        confidence: Number(i.confidence) || 50,
        recommendation: i.recommendation || "",
        status: "active",
      }));

      await supabase.from("savings_insights").insert(rows);
    }

    return new Response(JSON.stringify({ insights, count: insights.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("savings-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
