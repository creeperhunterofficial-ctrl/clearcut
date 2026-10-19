import { useEffect, useState } from "react";
import { Download, RotateCcw } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { formatPaise } from "../lib/config";

type Job = {
  id: string;
  status: string;
  duration_sec: number | null;
  price_paise: number;
  error_log: string | null;
  created_at: string;
  download_expires_at: string | null;
};

const STATUS_STYLE: Record<string, string> = {
  queued: "bg-slate-500/15 text-slate-300",
  uploading: "bg-blue-500/15 text-blue-300",
  processing: "bg-amber-500/15 text-amber-300",
  completed: "bg-emerald-500/15 text-emerald-300",
  failed: "bg-red-500/15 text-red-300",
};

export default function Orders() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !user) {
      setLoading(false);
      return;
    }
    supabase
      .from("video_jobs")
      .select(
        "id,status,duration_sec,price_paise,error_log,created_at,download_expires_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setJobs(data ?? []);
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Order history</h1>
      <p className="text-slate-400 mt-1">
        Track jobs and download finished videos from secure, expiring links.
      </p>

      {loading ? (
        <p className="text-slate-500 mt-6">Loading…</p>
      ) : jobs.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-500">
          No orders yet. Your video jobs will appear here.
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {jobs.map((j) => (
            <li
              key={j.id}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${
                    STATUS_STYLE[j.status] ?? STATUS_STYLE.queued
                  }`}
                >
                  {j.status}
                </span>
                <span className="text-sm text-slate-500">
                  {new Date(j.created_at).toLocaleString()}
                </span>
              </div>
              <div className="mt-2 text-sm text-slate-400">
                {j.duration_sec ? `${j.duration_sec}s · ` : ""}
                {formatPaise(j.price_paise)}
              </div>
              {j.status === "failed" && j.error_log && (
                <p className="mt-2 text-sm text-red-400">{j.error_log}</p>
              )}
              <div className="mt-3 flex gap-2">
                {j.status === "completed" && (
                  <button
                    disabled
                    title="Available once the processing backend is live"
                    className="flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-bold text-slate-400 cursor-not-allowed"
                  >
                    <Download className="h-4 w-4" /> Download
                  </button>
                )}
                {j.status === "failed" && (
                  <button
                    disabled
                    className="flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-bold text-slate-400 cursor-not-allowed"
                  >
                    <RotateCcw className="h-4 w-4" /> Retry
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
