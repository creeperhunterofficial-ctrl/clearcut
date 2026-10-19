# ClearCut — AI Video Logo Remover

Production-oriented video logo-removal website. Mobile-first UI, wallet
billing in integer paise, auditable ledger, server-verified payments.

## Stage plan

- **Stage 1 (this build):** responsive frontend (all 8 page groups) + full
  PostgreSQL schema with Row Level Security. Integrations are clearly labeled
  as unavailable until configured — nothing is faked.
- **Stage 2:** Supabase Auth wiring + profiles/wallets auto-provisioning.
- **Stage 3:** Wallet ledger transactions (reserve → capture / release).
- **Stage 4:** Paytm/PhonePe adapter, server-side orders, webhook verification.
- **Stage 5:** Video job queue → processing backend → expiring downloads.

## Quick start (frontend)

```bash
npm install
cp .env.example .env   # fill VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run dev
```

## Database

```bash
# with Supabase CLI
supabase db push
# or paste supabase/migrations/001_initial_schema.sql into the SQL editor
```

Create storage buckets `uploads` and `outputs` (private), then apply the
storage policies commented at the bottom of the migration.

## Deploy (frontend)

Cloudflare Pages: build command `npm run build`, output dir `dist`,
set the `VITE_*` env vars in the Pages dashboard.

## Money rules (enforced in backend stages)

- All amounts are integer paise.
- Clients can never change balances directly (RLS: no wallet writes).
- Job start reserves the price atomically; success captures, failure releases.
- Idempotency keys prevent duplicate credits and duplicate charges.
- Payments are credited only after server-verified provider callbacks.
- Never trust screenshots or frontend success messages.

## What is NOT production-ready yet

- Payment provider adapter (needs approved Paytm/PhonePe merchant account)
- Video processing backend connection
- Server API (Supabase Edge Functions) for wallet + webhook handlers
- Rate limiting, backups, monitoring

Do not claim production readiness until payment verification, wallet
accounting, authorization, and real video processing pass end-to-end tests.
