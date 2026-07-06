import { NavLink, useNavigate } from "react-router";
import { LayoutDashboard, ClipboardList, Link2, LogOut } from "lucide-react";
import { Logo } from "./Logo";
import { GOLD, GOLD_DARK, GOLD_DARKER } from "@/lib/constants";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/submissions", icon: ClipboardList, label: "Submissions", end: true },
  { to: "/admin/links", icon: Link2, label: "Document Links", end: true },
];

export function AdminSidebar() {
  const navigate = useNavigate();
  return (
    <aside className="w-[220px] flex flex-col h-screen sticky top-0 flex-shrink-0 overflow-hidden" style={{ background: "linear-gradient(180deg, #06142A 0%, #0B1F3A 100%)" }}>
      <div className="h-[3px] flex-shrink-0" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />
      <div className="px-5 py-5 border-b border-white/6"><Logo light /></div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-white/20 text-[9px] font-bold uppercase tracking-[0.15em] px-3 mb-2">Main Menu</p>
        {nav.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all font-medium",
              isActive ? "text-[#0B1F3A] shadow-md" : "text-white/50 hover:text-white hover:bg-white/7",
            )}
            style={({ isActive }) => isActive
              ? { background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})`, boxShadow: `0 4px 12px ${GOLD}40` }
              : {}}>
            <Icon className="w-4 h-4 flex-shrink-0" />{label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4 pt-3 border-t border-white/8 mt-auto">
        <div className="rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 p-3 shadow-lg shadow-black/25">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ring-2 ring-[#F7931E]/35"
              style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARKER})` }}
            >
              SM
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-semibold truncate leading-tight">Sarah Mitchell</p>
              <p className="text-white/40 text-[10px] truncate mt-0.5">Document Controller</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/admin/login")}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-white/50 hover:text-white hover:bg-white/8 border border-transparent hover:border-white/10 text-xs font-semibold transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden font-['Inter']">
      <AdminSidebar />
      <main className="flex-1 min-w-0 w-full overflow-auto bg-[#F4F6FA]">{children}</main>
    </div>
  );
}
