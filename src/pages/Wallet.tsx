import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { DEFAULTS, formatPaise } from "../lib/config";

type Txn = {
  id: string;
  type: string;
  amount_paise: number;
  balance_after_paise: number;
  created_at: string;
  note: string | null;
};

export default function Wallet() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !user) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data: w } = await supabase
        .from("wallets")
        .select("balance_paise")
        .eq("user_id", user.id)
        .single();
      setBalance(w?.balance_paise ?? 0);
      const { data: t } = await supabase
        .from("wallet_transactions")
        .select("id,type,amount_paise,balance_after_paise,created_at,note")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setTxns(t ?? []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Wallet</h1>

      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-400">Balance</div>
          <div className="text-4xl font-extrabold">
            {loading ? "…" : formatPaise(balance ?? 0)}
          </div>
        </div>
        <button
          disabled
          title="Payments not configured yet"
          className="flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2.5 font-bold text-slate-400 cursor-not-allowed"
        >
          <Plus className="h-4 w-4" /> Top up
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Minimum top-up {formatPaise(DEFAULTS.minTopupPaise)}. Online payments
        (Paytm / PhonePe) will be enabled once the merchant account is approved
        — no fake payments, ever.
      </p>

      <h2 className="mt-8 text-lg font-bold">Recharge &amp; transaction history</h2>
      {loading ? (
        <p className="text-slate-500 mt-2">Loading…</p>
      ) : txns.length === 0 ? (
        <p className="text-slate-500 mt-2">
          No transactions yet. Your ledger will appear here.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {txns.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"
            >
              <div>
                <div className="font-semibold capitalize">{t.type}</div>
                <div className="text-xs text-slate-500">
                  {new Date(t.created_at).toLocaleString()}
                  {t.note ? ` · ${t.note}` : ""}
                </div>
              </div>
              <div
                className={`font-bold ${
                  t.amount_paise > 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {t.amount_paise > 0 ? "+" : ""}
                {formatPaise(t.amount_paise)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
