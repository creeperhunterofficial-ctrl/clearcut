import { Link } from "react-router-dom";
import { UploadCloud, Wallet, History } from "lucide-react";
import { useAuth } from "../lib/auth";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold">
        Hi{user?.email ? `, ${user.email.split("@")[0]}` : ""} 👋
      </h1>
      <p className="text-slate-400 mt-1">
        Process a video, top up your wallet, or check past orders.
      </p>

      <div className="mt-6 grid sm:grid-cols-3 gap-4">
        <Link
          to="/upload"
          className="rounded-2xl border border-slate-800 bg-slate-900 p-6 hover:border-emerald-500/50"
        >
          <UploadCloud className="h-6 w-6 text-emerald-400 mb-3" />
          <div className="font-bold">New video job</div>
          <div className="text-sm text-slate-400 mt-1">
            Upload a video up to 60 seconds.
          </div>
        </Link>
        <Link
          to="/wallet"
          className="rounded-2xl border border-slate-800 bg-slate-900 p-6 hover:border-emerald-500/50"
        >
          <Wallet className="h-6 w-6 text-emerald-400 mb-3" />
          <div className="font-bold">Wallet</div>
          <div className="text-sm text-slate-400 mt-1">
            Top up and see recharge history.
          </div>
        </Link>
        <Link
          to="/orders"
          className="rounded-2xl border border-slate-800 bg-slate-900 p-6 hover:border-emerald-500/50"
        >
          <History className="h-6 w-6 text-emerald-400 mb-3" />
          <div className="font-bold">Order history</div>
          <div className="text-sm text-slate-400 mt-1">
            Track jobs and download results.
          </div>
        </Link>
      </div>

      <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200/90">
        Video processing connects to a real backend service in the next stage.
        Until then, uploads are validated only — no job will be processed.
      </div>
    </div>
  );
}
