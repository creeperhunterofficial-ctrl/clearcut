export default function Help() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Help</h1>
        <div className="mt-4 space-y-3 text-slate-300">
          <details className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <summary className="font-semibold cursor-pointer">
              How do I remove a logo from my video?
            </summary>
            <p className="mt-2 text-sm text-slate-400">
              Top up your wallet, upload a video (up to 60 seconds), and start
              a job. The price is reserved while we process, then captured on
              success. Download your clean video from a secure link.
            </p>
          </details>
          <details className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <summary className="font-semibold cursor-pointer">
              What videos can I process?
            </summary>
            <p className="mt-2 text-sm text-slate-400">
              Only videos you own or are authorized to modify. Do not upload
              content that infringes someone else's rights.
            </p>
          </details>
          <details className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <summary className="font-semibold cursor-pointer">
              What if processing fails?
            </summary>
            <p className="mt-2 text-sm text-slate-400">
              The reserved amount is automatically released back to your wallet.
              You are never charged for failed jobs.
            </p>
          </details>
        </div>
      </div>

      <section id="privacy">
        <h2 className="text-xl font-bold">Privacy policy</h2>
        <div className="mt-2 text-sm text-slate-400 space-y-2">
          <p>
            We store your account email, wallet ledger, job records, and
            uploaded videos. Videos are kept only for the configured retention
            period, then deleted.
          </p>
          <p>
            We never sell your data. Payment processing is handled by our
            official payment partner; we never see or store your card or UPI
            credentials.
          </p>
        </div>
      </section>

      <section id="terms">
        <h2 className="text-xl font-bold">Terms of service</h2>
        <div className="mt-2 text-sm text-slate-400 space-y-2">
          <p>
            You may only process videos you own or are authorized to modify.
            Abuse, infringement, or attempts to manipulate billing will result
            in account suspension.
          </p>
          <p>
            Prices and limits are shown in the app and may be updated by the
            admin; the price at job start is what you pay.
          </p>
        </div>
      </section>

      <section id="refunds">
        <h2 className="text-xl font-bold">Refund policy</h2>
        <div className="mt-2 text-sm text-slate-400 space-y-2">
          <p>
            Failed jobs are refunded automatically — the reserved amount returns
            to your wallet immediately.
          </p>
          <p>
            Wallet top-ups are non-refundable once credited, except where
            required by law or in case of a verified duplicate charge. Contact
            support from the Help section for billing issues.
          </p>
        </div>
      </section>
    </div>
  );
}
