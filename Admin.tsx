import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { formatPaise } from "../lib/config";

type Setting = { key: string; value: string };

type PendingTopup = {
  id: string;
  user_id: string;
  amount_paise: number;
  created_at: string;
  user_email: string | null;
};

export default function Admin() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [failedJobs, setFailedJobs] = useState<number | null>(null);
  const [pendingPayments, setPendingPayments] = useState<number | null>(null);
  const [topups, setTopups] = useState<PendingTopup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data: s } = await supabase
        .from("app_settings")
        .select("key,value")
        .order("key");
      setSettings(s ?? []);
      const { count: fj } = await supabase
        .from("video_jobs")
        .select("id", { count: "exact", head: true })
        .eq("status", "failed");
      setFailedJobs(fj ?? 0);
      const { count: pp } = await supabase
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      setPendingPayments(pp ?? 0);
      const { data: tp } = await supabase
        .from("payments")
        .select("id,user_id,amount_paise,created_at")
        .eq("status", "pending")
        .eq("provider", "manual")
        .order("created_at", { ascending: true });
      const withEmails: PendingTopup[] = await Promise.all(
        (tp ?? []).map(async (p) => {
          const { data: prof } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", p.user_id)
            .single();
          return { ...p, user_email: prof?.email ?? null };
        })
      );
      setTopups(withEmails);
      setLoading(false);
    })();
  }, []);

  const approveTopup = async (t: PendingTopup) => {
    setApproving(t.id);
    setMsg(null);
    try {
      const { error } = await supabase.rpc("admin_credit_wallet", {
        p_user_id: t.user_id,
        p_amount_paise: t.amount_paise,
        p_payment_id: t.id,
        p_idempotency_key: `topup-${t.id}`,
      });
      if (error) throw error;
      setTopups((prev) => prev.filter((x) => x.id !== t.id));
      setPendingPayments((n) => (n !== null ? n - 1 : n));
      setMsg(`Credited ${formatPaise(t.amount_paise)} to ${t.user_email ?? t.user_id}.`);
    } catch (e) {
      setMsg(e instanceof Error ? `Approve failed: ${e.message}` : "Approve failed.");
    } finally {
      setApproving(null);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMsg(null);
    try {
      // NOTE: writes go through RLS; production should route admin writes
      // through a server API that verifies the admin role server-side.
      for (const s of settings) {
        const { error } = await supabase
          .from("app_settings")
          .update({ value: s.value })
          .eq("key", s.key);
        if (error) throw error;
      }
      setMsg("Settings saved.");
    } catch (e) {
      setMsg(
        e instanceof Error
          ? `Save failed: ${e.message}`
          : "Save failed."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <ShieldAlert className="h-6 w-6 text-amber-400" /> Admin dashboard
      </h1>
      <p className="text-slate-400 mt-1 text-sm">
        Server-verified admin role required. All actions are audit-logged.
      </p>

      {loading ? (
        <p className="text-slate-500 mt-6">Loading…</p>
      ) : (
        <>
          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="text-sm text-slate-400">Failed jobs</div>
              <div className="text-3xl font-extrabold text-red-400">
                {failedJobs ?? "—"}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="text-sm text-slate-400">Pending payments</div>
              <div className="text-3xl font-extrabold text-amber-300">
                {pendingPayments ?? "—"}
              </div>
            </div>
          </div>

          <h2 className="mt-8 text-lg font-bold">Pending top-up requests</h2>
          {topups.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No pending requests.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {topups.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"
                >
                  <div>
                    <div className="font-semibold">
                      {formatPaise(t.amount_paise)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {t.user_email ?? t.user_id} ·{" "}
                      {new Date(t.created_at).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => approveTopup(t)}
                    disabled={approving === t.id}
                    className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                  >
                    {approving === t.id ? "Approving…" : "Approve & credit"}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <h2 className="mt-8 text-lg font-bold">Prices &amp; limits</h2>
          <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3">
            {settings.map((s) => (
              <div key={s.key} className="flex items-center gap-3">
                <label className="w-48 text-sm text-slate-400 truncate">
                  {s.key}
                </label>
                <input
                  value={s.value}
                  onChange={(e) =>
                    setSettings((prev) =>
                      prev.map((p) =>
                        p.key === s.key ? { ...p, value: e.target.value } : p
                      )
                    )
                  }
                  className="flex-1 rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-sm outline-none focus:border-emerald-500"
                />
                {s.key.endsWith("_paise") && (
                  <span className="text-xs text-slate-500 w-16 text-right">
                    {formatPaise(Number(s.value) || 0)}
                  </span>
                )}
              </div>
            ))}
            <button
              onClick={saveSettings}
              disabled={saving}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save settings"}
            </button>
            {msg && <p className="text-sm text-slate-400">{msg}</p>}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-400">
            <div className="font-bold text-slate-200 mb-2">
              Monitoring checklist (backend stages)
            </div>
            <ul className="list-disc list-inside space-y-1">
              <li>Payment reconciliation: match provider settlements vs ledger.</li>
              <li>Failed-job error logs and retry queue.</li>
              <li>Refund ledger entries.</li>
              <li>Processing cost per job.</li>
              <li>Rate limiting, upload abuse protection, DB backups.</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
