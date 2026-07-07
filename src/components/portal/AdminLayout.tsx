import { useEffect, useRef } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { LayoutDashboard, ClipboardList, Link2, LogOut } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Logo } from "./Logo";
import { GOLD, GOLD_DARK, GOLD_DARKER } from "@/lib/constants";
import { getStoredUser, clearSession } from "@/lib/auth";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard", end: true, order: 0 },
  { to: "/admin/submissions", icon: ClipboardList, label: "Submissions", end: false, order: 1 },
  { to: "/admin/links", icon: Link2, label: "Document Links", end: true, order: 2 },
];

const slideEase = [0.4, 0, 0.2, 1] as const;
const tabSlide = { type: "tween" as const, duration: 0.48, ease: slideEase };

const gpu = {
  transform: "translateZ(0)",
  backfaceVisibility: "hidden" as const,
  WebkitBackfaceVisibility: "hidden" as const,
};

function tabOrder(pathname: string) {
  if (pathname.includes("/links")) return 2;
  if (pathname.includes("/submissions")) return 1;
  return 0;
}

export function AdminSidebar() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const initials = user?.name?.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase() || "AD";

  return (
    <aside className="w-[220px] flex flex-col h-screen sticky top-0 flex-shrink-0 overflow-hidden" style={{ background: "linear-gradient(180deg, #06142A 0%, #0B1F3A 100%)" }}>
      <div className="h-[3px] flex-shrink-0" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />
      <div className="px-5 py-5 border-b border-white/6"><Logo light /></div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-white/20 text-[9px] font-bold uppercase tracking-[0.15em] px-3 mb-2">Main Menu</p>
        {nav.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => cn(
              "relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150",
              isActive ? "text-[#0B1F3A]" : "text-white/50 hover:text-white",
            )}>
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="admin-nav-active"
                    className="absolute inset-0 rounded-xl shadow-md"
                    style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})`, boxShadow: `0 4px 12px ${GOLD}40` }}
                    transition={{ type: "spring", stiffness: 360, damping: 36 }}
                  />
                )}
                {!isActive && (
                  <motion.span
                    className="absolute inset-0 rounded-xl bg-white/0"
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.07)" }}
                    transition={{ duration: 0.15 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-3">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4 pt-3 border-t border-white/8 mt-auto">
        <div
          className="rounded-2xl p-3 border border-white/20 bg-white/10 backdrop-blur-2xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_10px_28px_rgba(0,0,0,0.28)]"
          style={{ WebkitBackdropFilter: "blur(24px) saturate(180%)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ring-1 ring-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
              style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARKER})` }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-semibold truncate leading-tight drop-shadow-sm">{user?.name ?? "Admin"}</p>
              <p className="text-white/55 text-[10px] truncate mt-0.5">Document Controller</p>
            </div>
          </div>
          <button
            onClick={() => { clearSession(); navigate("/admin/login"); }}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-white/65 hover:text-white bg-white/5 hover:bg-white/12 border border-white/10 hover:border-white/20 backdrop-blur-md text-xs font-semibold transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}

export function AdminLayout() {
  const location = useLocation();
  const reducedMotion = useReducedMotion();
  const prevOrder = useRef(tabOrder(location.pathname));
  const direction = useRef(1);
  const skipEnter = useRef((location.state as { fromLogin?: boolean } | null)?.fromLogin === true);

  const currOrder = tabOrder(location.pathname);
  if (currOrder !== prevOrder.current) {
    direction.current = currOrder >= prevOrder.current ? 1 : -1;
    prevOrder.current = currOrder;
  }

  useEffect(() => {
    skipEnter.current = false;
  }, []);

  const dir = direction.current;
  const tabTransition = reducedMotion ? { duration: 0.01 } : tabSlide;

  return (
    <div className="flex h-screen overflow-hidden font-['Inter']">
      <AdminSidebar />
      <main className="flex-1 min-w-0 relative overflow-hidden bg-[#F4F6FA]">
        <AnimatePresence initial={false}>
          <motion.div
            key={location.pathname}
            initial={skipEnter.current ? false : { x: reducedMotion ? 0 : `${dir * 100}%` }}
            animate={{ x: 0 }}
            exit={{ x: reducedMotion ? 0 : `${-dir * 100}%` }}
            transition={tabTransition}
            className="absolute inset-0 overflow-y-auto overflow-x-hidden"
            style={gpu}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
