import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { user, role, loading, configured } = useAuth();

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">Loading…</div>
    );
  }
  if (!configured) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h1 className="text-xl font-bold mb-2">Service not configured</h1>
        <p className="text-slate-400">
          Authentication is unavailable until the Supabase connection is
          configured. See <code>.env.example</code>.
        </p>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (adminOnly && role !== "admin") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
