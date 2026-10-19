import { Link } from "react-router-dom";
import { Eraser, Wallet, ShieldCheck, Zap } from "lucide-react";
import { DEFAULTS, formatPaise } from "../lib/config";

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="py-12 sm:py-20 text-center">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
          Remove video logos.
          <br />
          <span className="text-emerald-400">Clean results.</span>
        </h1>
        <p className="mt-4 text-slate-400 max-w-xl mx-auto">
          Upload your video, we erase watermarks and AI logos, and you download
          a clean copy. Simple wallet pricing — no subscriptions.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/auth"
            className="px-6 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400"
          >
            Get started
          </Link>
          <Link
            to="/help"
            className="px-6 py-3 rounded-xl border border-slate-700 hover:bg-slate-800"
          >
            How it works
          </Link>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-10">
        <h2 className="text-2xl font-bold text-center mb-6">Simple pricing</h2>
        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="text-sm text-slate-400">Up to 30 seconds</div>
            <div className="text-4xl font-extrabold mt-1">
              {formatPaise(DEFAULTS.price30sPaise)}
            </div>
            <div className="text-sm text-slate-400 mt-1">per video</div>
          </div>
          <div className="rounded-2xl border border-emerald-500/40 bg-slate-900 p-6">
            <div className="text-sm text-slate-400">Up to 60 seconds</div>
            <div className="text-4xl font-extrabold mt-1 text-emerald-400">
              {formatPaise(DEFAULTS.price60sPaise)}
            </div>
            <div className="text-sm text-slate-400 mt-1">per video</div>
          </div>
        </div>
        <p className="text-center text-sm text-slate-500 mt-4">
          Minimum wallet top-up {formatPaise(DEFAULTS.minTopupPaise)}. Prices
          are set by the admin and may change.
        </p>
      </section>

      {/* Features */}
      <section className="py-10 grid sm:grid-cols-3 gap-4">
        {[
          {
            icon: Eraser,
            title: "Logo removal",
            text: "AI watermarks and corner logos erased from your own videos.",
          },
          {
            icon: Wallet,
            title: "Wallet billing",
            text: "Top up once, pay per job. Every paise is ledger-audited.",
          },
          {
            icon: ShieldCheck,
            title: "Secure downloads",
            text: "Processed files served via secure, expiring links.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
          >
            <f.icon className="h-6 w-6 text-emerald-400 mb-3" />
            <div className="font-bold">{f.title}</div>
            <div className="text-sm text-slate-400 mt-1">{f.text}</div>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section className="py-10 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6">How it works</h2>
        <ol className="space-y-3">
          {[
            "Create an account and top up your wallet (min ₹10).",
            "Upload a video up to 60 seconds.",
            "The price is reserved from your wallet while we process.",
            "Download your clean video from a secure, expiring link.",
          ].map((step, i) => (
            <li
              key={i}
              className="flex gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 font-bold text-sm">
                {i + 1}
              </span>
              <span className="text-slate-300">{step}</span>
            </li>
          ))}
        </ol>
        <p className="mt-6 flex items-center justify-center gap-2 text-sm text-amber-300/90">
          <Zap className="h-4 w-4" />
          Only process videos you own or are authorized to modify.
        </p>
      </section>
    </div>
  );
}
