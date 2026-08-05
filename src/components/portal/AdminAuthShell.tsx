import { Link2, Shield, UserCheck, Lock } from "lucide-react";
import { Logo, PortalWord } from "./Logo";
import { ParticleNetwork } from "./ParticleNetwork";
import { GOLD } from "@/lib/constants";
import { formatLinkExpiry, useAppConfig } from "@/hooks/useAppConfig";

const navyBg = "linear-gradient(145deg, #06142A 0%, #0B1F3A 50%, #0F2B50 100%)";

export function AdminAuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const { linkExpireHours } = useAppConfig();

  const formCard = (
    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-[#0B1F3A]/8 overflow-hidden">
      <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-5 sm:pb-6 border-b border-[#0B1F3A]/6">
        <h2 className="font-['Playfair_Display'] text-xl sm:text-2xl font-bold text-[#0B1F3A] mb-1">{title}</h2>
        <p className="text-[#64748B] text-sm">{subtitle}</p>
      </div>
      <div className="px-5 sm:px-8 py-5 sm:py-6">{children}</div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] flex font-['Inter'] overflow-hidden">
      {/* Desktop brand panel */}
      <div className="hidden lg:flex w-[52%] flex-col relative overflow-hidden" style={{ background: navyBg }}>
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
              Create Document Links, review client submissions, capture digital signatures, and manage the complete onboarding workflow.
            </p>
            <div className="space-y-5 w-full">
              {[
                { icon: Link2, t: "Secure time-limited document links", s: `Auto-expires after ${formatLinkExpiry(linkExpireHours)}` },
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
          <p className="text-white/25 text-xs mt-8">&copy; 2026 AHamson. All rights reserved.</p>
        </div>
      </div>

      {/* Form column — on mobile/tablet: animated navy bg + logo top-left */}
      <div className="relative flex-1 flex flex-col min-h-[100dvh] lg:min-h-0 overflow-hidden bg-[#F4F6FA]">
        <div className="lg:hidden absolute inset-0 pointer-events-none" style={{ background: navyBg }} aria-hidden>
          <ParticleNetwork />
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />
        </div>

        <div className="relative z-10 lg:hidden px-5 pt-5 sm:px-8 sm:pt-6">
          <Logo light />
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-8 py-6 lg:py-0">
          <div className="w-full max-w-[400px]">
            {formCard}
          </div>
        </div>
      </div>
    </div>
  );
}
