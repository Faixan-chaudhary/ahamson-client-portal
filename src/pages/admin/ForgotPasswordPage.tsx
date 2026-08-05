import { useState } from "react";
import { Link } from "react-router";
import { Mail, RefreshCw, AlertTriangle, CheckCircle, ArrowLeft, Send } from "lucide-react";
import { AdminAuthShell } from "@/components/portal/AdminAuthShell";
import { forgotPassword } from "@/lib/api";
import { NAVY } from "@/lib/constants";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminAuthShell
      title="Reset password"
      subtitle="Enter your administrator email and we will send a secure reset link"
    >
      {sent ? (
        <div className="space-y-5">
          <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-emerald-800 text-sm font-semibold">Check your inbox</p>
              <p className="text-emerald-700 text-sm mt-1 leading-relaxed">
                If an account exists for <span className="font-medium">{email}</span>, a password reset link has been sent.
              </p>
            </div>
          </div>
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#F7931E] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-[11px] font-semibold text-[#0B1F3A]/60 uppercase tracking-[0.1em] mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#0B1F3A]/12 bg-[#F8F9FC] text-sm focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30"
                required
                autoComplete="email"
              />
            </div>
          </div>
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl font-semibold text-white text-sm disabled:opacity-70 transition-all"
            style={{ background: `linear-gradient(135deg, ${NAVY}, #162d52)` }}
          >
            {loading ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Sending link…</>
            ) : (
              <><Send className="w-4 h-4" /> Send reset link</>
            )}
          </button>
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#F7931E] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </form>
      )}
    </AdminAuthShell>
  );
}
