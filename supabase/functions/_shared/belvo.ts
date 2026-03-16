export type BelvoConfig = {
  baseUrl: string;
  secretId: string;
  secretPassword: string;
};

export function getBelvoConfig(): BelvoConfig {
  const baseUrl = (Deno.env.get("BELVO_BASE_URL") || "https://sandbox.belvo.com").replace(/\/+$/, "");
  const secretId = Deno.env.get("BELVO_SECRET_ID") || "";
  const secretPassword = Deno.env.get("BELVO_SECRET_PASSWORD") || "";
  if (!secretId || !secretPassword) {
    throw new Error("Missing BELVO_SECRET_ID/BELVO_SECRET_PASSWORD env vars");
  }
  return { baseUrl, secretId, secretPassword };
}

export function belvoAuthHeader(cfg: BelvoConfig) {
  const token = btoa(`${cfg.secretId}:${cfg.secretPassword}`);
  return `Basic ${token}`;
}

export type BelvoPaginated<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
};

export async function belvoRequest(
  cfg: BelvoConfig,
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  headers.set("Authorization", belvoAuthHeader(cfg));
  if (!headers.has("Content-Type") && init?.body) headers.set("Content-Type", "application/json");
  return fetch(input, { ...init, headers });
}

export async function belvoGetAll<T>(
  cfg: BelvoConfig,
  path: string,
  query?: Record<string, string | number | boolean | undefined | null>,
): Promise<T[]> {
  let url = new URL(`${cfg.baseUrl}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, String(v));
    }
  }

  const out: T[] = [];
  // Belvo typically paginates with { results, next }, but we support array responses too.
  for (let i = 0; i < 200; i++) {
    const res = await belvoRequest(cfg, url.toString());
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Belvo request failed (${res.status}): ${text || res.statusText}`);
    }

    const json = (await res.json()) as BelvoPaginated<T> | T[];
    if (Array.isArray(json)) {
      out.push(...json);
      break;
    }

    out.push(...(json.results || []));
    if (!json.next) break;
    url = new URL(json.next);
  }

  return out;
}

