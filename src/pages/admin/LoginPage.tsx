import { useState } from "react";
import { useNavigate } from "react-router";
import { Shield, Link2, UserCheck, Lock, Mail, RefreshCw, AlertTriangle, Info } from "lucide-react";
import { Logo, PortalWord } from "@/components/portal/Logo";
import { ParticleNetwork } from "@/components/portal/ParticleNetwork";
import { GOLD, NAVY } from "@/lib/constants";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@ahamson.com");
  const [password, setPassword] = useState("Admin@2025");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      if (email) navigate("/admin/dashboard");
      else { setError("Invalid credentials."); setLoading(false); }
    }, 600);
  }

  return (
    <div className="min-h-screen flex font-['Inter'] overflow-hidden">
      <div className="hidden lg:flex w-[52%] flex-col relative overflow-hidden" style={{ background: "linear-gradient(145deg, #06142A 0%, #0B1F3A 50%, #0F2B50 100%)" }}>
        <ParticleNetwork />
        <div className="absolute top-0 left-0 right-0 h-[3px] pointer-events-none" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />
        <div className="relative flex flex-col h-full px-12 xl:px-20 py-14">
          <Logo light />
          <div className="flex-1 flex flex-col justify-center w-full">
            <div className="inline-flex items-center gap-2 border border-[#F7931E]/30 bg-[#F7931E]/10 rounded-full px-4 py-1.5 mb-7 w-fit">
              <Lock className="w-3 h-3 text-[#F7931E]" />
              <span className="text-[#F7931E] text-xs font-semibold tracking-wider uppercase">Secure Admin Access</span>
            </div>
            <h1 className="font-display text-[34px] xl:text-[40px] font-bold text-white leading-[1.15] mb-6 tracking-tight">
              Client Document{" "}
              <PortalWord className="text-[1.08em] xl:text-[1.1em] mx-0.5" />
              {" "}Management
            </h1>
            <p className="text-white/50 text-[15px] xl:text-base leading-[1.75] mb-11 w-full max-w-none pr-4">
              Create secure document links, review client submissions, capture digital signatures, and manage the complete onboarding workflow.
            </p>
            <div className="space-y-5 w-full">
              {[
                { icon: Link2, t: "Secure time-limited document links", s: "Auto-expires after 2 hours" },
                { icon: UserCheck, t: "Digital signature capture", s: "Legally binding electronic signatures" },
                { icon: Shield, t: "Client Registration Form workflow", s: "No client login required" },
              ].map(({ icon: Icon, t, s }) => (
                <div key={t} className="flex items-start gap-4 w-full">
                  <div className="w-10 h-10 rounded-xl bg-[#F7931E]/15 border border-[#F7931E]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-[18px] h-[18px] text-[#F7931E]" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-white/85 text-[15px] font-medium leading-snug">{t}</p>
                    <p className="text-white/40 text-[13px] mt-1 leading-relaxed">{s}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-white/25 text-xs mt-8">&copy; 2025 Ahamson. All rights reserved.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center bg-[#F4F6FA] px-8">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden mb-8"><Logo /></div>
          <div className="bg-white rounded-3xl shadow-2xl border border-[#0B1F3A]/8 overflow-hidden">
            <div className="px-8 pt-8 pb-6 border-b border-[#0B1F3A]/6">
              <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#0B1F3A] mb-1">Welcome back</h2>
              <p className="text-[#64748B] text-sm">Sign in to your administrator account</p>
            </div>
            <form onSubmit={submit} className="px-8 py-6 space-y-5">
              <div>
                <label className="block text-[11px] font-semibold text-[#0B1F3A]/60 uppercase tracking-[0.1em] mb-1.5">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#0B1F3A]/12 bg-[#F8F9FC] text-sm focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30" required />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-[#0B1F3A]/60 uppercase tracking-[0.1em]">Password</label>
                  <button type="button" className="text-[11px] text-[#F7931E] hover:underline">Forgot password?</button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#0B1F3A]/12 bg-[#F8F9FC] text-sm focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30" required />
                </div>
              </div>
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-70"
                style={{ background: `linear-gradient(135deg, ${NAVY}, #162d52)` }}>
                {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Authenticating...</> : <><Shield className="w-4 h-4" /> Sign In</>}
              </button>
              <div className="bg-[#F8F9FC] border border-[#0B1F3A]/8 rounded-xl px-4 py-3 flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-[#94A3B8]" />
                <p className="text-[#94A3B8] text-xs">Demo: any email & password works</p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
