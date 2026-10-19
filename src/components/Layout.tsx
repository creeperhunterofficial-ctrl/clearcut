import { Link, useNavigate } from "react-router-dom";
import { Clapperboard, LogOut } from "lucide-react";
import { useAuth } from "../lib/auth";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Clapperboard className="h-6 w-6 text-emerald-400" />
            <span className="font-bold text-lg">ClearCut</span>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="px-3 py-2 rounded-lg hover:bg-slate-800"
                >
                  Dashboard
                </Link>
                <Link
                  to="/upload"
                  className="px-3 py-2 rounded-lg hover:bg-slate-800"
                >
                  New job
                </Link>
                <Link
                  to="/wallet"
                  className="px-3 py-2 rounded-lg hover:bg-slate-800"
                >
                  Wallet
                </Link>
                <Link
                  to="/orders"
                  className="px-3 py-2 rounded-lg hover:bg-slate-800"
                >
                  Orders
                </Link>
                {role === "admin" && (
                  <Link
                    to="/admin"
                    className="px-3 py-2 rounded-lg bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-lg hover:bg-slate-800"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/help"
                  className="px-3 py-2 rounded-lg hover:bg-slate-800"
                >
                  Help
                </Link>
                <Link
                  to="/auth"
                  className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400"
                >
                  Sign in
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
      </main>

      <footer className="border-t border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-400 flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
          <span>ClearCut — AI video logo remover</span>
          <div className="flex gap-4">
            <Link to="/help" className="hover:text-slate-200">
              Help
            </Link>
            <Link to="/help#privacy" className="hover:text-slate-200">
              Privacy
            </Link>
            <Link to="/help#terms" className="hover:text-slate-200">
              Terms
            </Link>
            <Link to="/help#refunds" className="hover:text-slate-200">
              Refunds
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
