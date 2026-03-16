import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse, textResponse } from "../_shared/cors.ts";
import { getBelvoConfig, belvoRequest } from "../_shared/belvo.ts";

function parseCsvEnv(name: string, fallback: string[]) {
  const raw = Deno.env.get(name);
  if (!raw) return fallback;

  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return textResponse("ok", { headers: corsHeaders });
  }

  try {
    const cfg = getBelvoConfig();

    const scopes =
      Deno.env.get("BELVO_WIDGET_SCOPES") ||
      "read_institutions,write_links,read_links";

    const fetchResources = parseCsvEnv("BELVO_FETCH_RESOURCES", [
      "ACCOUNTS",
      "TRANSACTIONS",
    ]);

    const body = {
      id: cfg.secretId,
      password: cfg.secretPassword,
      scopes,
      fetch_resources: fetchResources,
    };

    const res = await belvoRequest(cfg, `${cfg.baseUrl}/api/token/`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");

      return jsonResponse(
        {
          error: "belvo_token_failed",
          details: text || res.statusText,
        },
        { status: 502 }
      );
    }

    const json = await res.json();
    console.log("BELVO API TOKEN SUCCESS:", !!json.access);

    return jsonResponse({
      access: json.access,
      expires_in: json.expires_in ?? null,
    });

  } catch (e) {
    console.error("belvo-token error:", e);

    return jsonResponse(
      {
        error: "internal_error",
        message: String(e?.message || e),
      },
      { status: 500 }
    );
  }
});
