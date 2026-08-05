import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Lock, RefreshCw, AlertTriangle, CheckCircle, ArrowLeft, Eye, EyeOff, Shield } from "lucide-react";
import { AdminAuthShell } from "@/components/portal/AdminAuthShell";
import { resetPassword } from "@/lib/api";
import { GOLD, NAVY } from "@/lib/constants";

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const mismatch = confirm.length > 0 && password !== confirm;
  const invalidLink = !token;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  }

  if (invalidLink) {
    return (
      <AdminAuthShell title="Invalid link" subtitle="This password reset link is missing or malformed">
        <div className="space-y-5">
          <p className="text-[#64748B] text-sm leading-relaxed">Request a new reset link from the sign-in page.</p>
          <Link to="/admin/forgot-password" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#F7931E] hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Request new link
          </Link>
        </div>
      </AdminAuthShell>
    );
  }

  return (
    <AdminAuthShell title="Set new password" subtitle="Choose a strong password for your administrator account">
      {done ? (
        <div className="space-y-5">
          <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-emerald-800 text-sm font-semibold">Password updated</p>
              <p className="text-emerald-700 text-sm mt-1">You can now sign in with your new password.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/admin/login", { replace: true })}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl font-semibold text-white text-sm"
            style={{ background: `linear-gradient(135deg, ${GOLD}, #e07d10)` }}
          >
            <Shield className="w-4 h-4" />
            Continue to sign in
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-[11px] font-semibold text-[#0B1F3A]/60 uppercase tracking-[0.1em] mb-1.5">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-9 py-2 rounded-xl border border-[#0B1F3A]/12 bg-[#F8F9FC] text-sm focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30"
                minLength={6}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#0B1F3A]/60 uppercase tracking-[0.1em] mb-1.5">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#0B1F3A]/12 bg-[#F8F9FC] text-sm focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30"
                minLength={6}
                required
                autoComplete="new-password"
              />
            </div>
            {mismatch && <p className="text-red-500 text-xs mt-1">Passwords do not match.</p>}
          </div>
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading || mismatch}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl font-semibold text-white text-sm disabled:opacity-70 transition-all"
            style={{ background: `linear-gradient(135deg, ${NAVY}, #162d52)` }}
          >
            {loading ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Updating…</>
            ) : (
              <><Shield className="w-4 h-4" /> Update password</>
            )}
          </button>
          <Link to="/admin/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#F7931E] hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </form>
      )}
    </AdminAuthShell>
  );
}
