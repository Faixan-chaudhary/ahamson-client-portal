import { AlertTriangle, RefreshCw } from "lucide-react";
import { Logo } from "@/components/portal/Logo";
import { NAVY } from "@/lib/constants";
import { formatLinkExpiry, useAppConfig } from "@/hooks/useAppConfig";

export function ExpiredPage() {
  const { linkExpireHours, supportEmail } = useAppConfig();

  return (
    <div className="min-h-screen bg-[#F4F6FA] font-['Inter'] flex flex-col">
      <header className="border-b border-white/10 px-4 sm:px-6 py-3.5" style={{ background: `linear-gradient(135deg, ${NAVY}, #162d52)` }}>
        <Logo light />
      </header>
      <div className="flex-1 flex items-center justify-center px-4 py-10 sm:py-12">
        <div className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-[#0B1F3A]/8 overflow-hidden text-center">
          <div className="h-2 bg-red-400" />
          <div className="p-6 sm:p-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-50 border-4 border-red-100 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 text-red-500" />
            </div>
            <h2 className="font-['Playfair_Display'] text-xl sm:text-2xl font-bold text-[#0B1F3A] mb-2">Link Expired</h2>
            <p className="text-[#64748B] text-sm leading-relaxed mb-6">
              This secure document link has expired and is no longer valid. Please contact your AHamson representative to request a new link.
            </p>
            <div className="bg-[#F8F9FC] rounded-xl p-4 text-xs text-[#94A3B8] flex items-center gap-2 justify-center">
              <RefreshCw className="w-3.5 h-3.5" />
              Links expire after {formatLinkExpiry(linkExpireHours)} for security
            </div>
            <p className="text-xs text-[#94A3B8] mt-6">
              Need help? Contact <span className="text-[#F7931E]">{supportEmail}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
