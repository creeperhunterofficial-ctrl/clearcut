// ClearCut Stage 4b (FUTURE): payment provider adapter + Edge Functions.
// Deploy these when the Paytm/PhonePe merchant account is approved.
// NEVER put provider secrets in the frontend bundle — they live in
// Edge Function secrets (supabase secrets set PAYTM_MERCHANT_KEY ...).

// ---------------------------------------------------------------------------
// supabase/functions/create-topup-order/index.ts
// Creates a server-side payment order. The client NEVER sets the amount.
// ---------------------------------------------------------------------------
/*
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { provider, amount_paise } = await req.json();
  // Validate against admin-configured min top-up; clamp to allowed values
  const { data: setting } = await supabase
    .from("app_settings").select("value").eq("key", "min_topup_paise").single();
  const minTopup = Number(setting?.value ?? 1000);
  if (!["paytm", "phonepe"].includes(provider) || amount_paise < minTopup) {
    return new Response("Invalid request", { status: 400 });
  }

  // TODO: call provider API with server-side credentials to create order.
  // Store the provider_order_id in public.payments with status='pending'.
  // Return the provider's payment payload (e.g. txnToken / redirect URL).

  return new Response(JSON.stringify({ error: "Provider not configured yet" }), {
    status: 501, headers: { "Content-Type": "application/json" },
  });
});
*/

// ---------------------------------------------------------------------------
// supabase/functions/payment-webhook/index.ts
// Provider callbacks are the SOURCE OF TRUTH. Verify signature server-side,
// then credit the wallet. Never trust screenshots or client claims.
// ---------------------------------------------------------------------------
/*
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function verifyPaytmChecksum(body: string, checksum: string): Promise<boolean> {
  // TODO: implement Paytm checksum verification with PAYTM_MERCHANT_KEY
  return false;
}

async function verifyPhonePeSignature(payload: string, xVerify: string): Promise<boolean> {
  // TODO: implement PhonePe X-VERIFY = SHA256(base64(payload) + "/pg/v1/status" + saltKey) + "###" + saltIndex
  return false;
}

serve(async (req) => {
  const url = new URL(req.url);
  const provider = url.searchParams.get("provider"); // 'paytm' | 'phonepe'
  const rawBody = await req.text();

  let ok = false;
  if (provider === "paytm") {
    const { CHECKSUMHASH } = JSON.parse(rawBody);
    ok = await verifyPaytmChecksum(rawBody, CHECKSUMHASH);
  } else if (provider === "phonepe") {
    ok = await verifyPhonePeSignature(rawBody, req.headers.get("X-VERIFY") ?? "");
  }
  if (!ok) return new Response("Bad signature", { status: 401 });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  // TODO: parse provider_order_id + amount from verified payload,
  // match against public.payments, then credit wallet with an
  // idempotency-keyed ledger entry (same pattern as admin_credit_wallet).

  return new Response("OK");
});
*/
