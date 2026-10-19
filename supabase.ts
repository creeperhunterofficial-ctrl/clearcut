import { createClient } from "@supabase/supabase-js";

// Baked-in config (publishable key is public-safe by Supabase design).
const SUPABASE_URL = "https://xgrstfvetilxbcensjfx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_qPxPVI63knnujd_PmfbcwA_sZfd_WUe";

export const isSupabaseConfigured = true;

// Storage that falls back to memory when localStorage is unavailable/blocked
// (e.g. sandboxed iframes), so auth never crashes on storage access.
function safeStorage() {
  try {
    const probe = "__cc_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    const mem = new Map<string, string>();
    return {
      getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    };
  }
}

// Preflight-free fetch: Supabase Auth calls go out as CORS "simple"
// requests (apikey in URL query, text/plain body) so they work even on
// networks that block CORS preflight (OPTIONS) requests.
function preflightFreeFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const rawUrl = typeof input === "string" ? input : input.toString();
  if (rawUrl.startsWith(SUPABASE_URL + "/auth/v1/")) {
    const sep = rawUrl.includes("?") ? "&" : "?";
    const url =
      rawUrl.includes("apikey=") || rawUrl.includes("apikey%3D")
        ? rawUrl
        : rawUrl + sep + "apikey=" + SUPABASE_ANON_KEY;
    const headers = new Headers(init?.headers);
    headers.delete("apikey");
    if (headers.get("Content-Type") === "application/json") {
      headers.set("Content-Type", "text/plain");
    }
    return fetch(url, { ...init, headers });
  }
  return fetch(input, init);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: safeStorage(),
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: preflightFreeFetch,
  },
});
