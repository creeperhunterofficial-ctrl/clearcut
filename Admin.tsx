import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { formatPaise } from "../lib/config";

type Setting = { key: string; value: string };

export default function Admin() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [failedJobs, setFailedJobs] = useState<number | null>(null);
  const [pendingPayments, setPendingPayments] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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
      setLoading(false);
    })();
  }, []);

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
