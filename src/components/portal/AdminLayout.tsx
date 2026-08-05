import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { LayoutDashboard, Link2, LogOut, Menu, ClipboardPen, ShieldCheck, Table2, UserCog, Users, X } from "lucide-react";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Logo } from "./Logo";
import { GOLD, GOLD_DARK, GOLD_DARKER } from "@/lib/constants";
import { getStoredUser, clearSession, roleLabel, getToken, setSession, isAdmin } from "@/lib/auth";
import { getMe } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useIsDesktopNav } from "@/hooks/useMediaQuery";

const navItems = [
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard", end: true, order: 0 },
  { to: "/admin/pipeline", icon: Table2, label: "Pipeline", end: true, order: 1 },
  { to: "/admin/deal-links", icon: ClipboardPen, label: "Deal Links", end: true, order: 2 },
  { to: "/admin/links", icon: Link2, label: "Document Links", end: true, order: 3 },
  { to: "/admin/users", icon: Users, label: "Team Users", end: true, order: 4, adminOnly: true },
];

function tabOrder(pathname: string) {
  if (pathname.includes("/users")) return 4;
  if (pathname.includes("/links") && !pathname.includes("deal-links")) return 3;
  if (pathname.includes("/deal-links") || pathname.includes("/deal-registration") || pathname.includes("/deals/")) return 2;
  if (pathname.includes("/pipeline")) return 1;
  return 0;
}

const slideEase = [0.4, 0, 0.2, 1] as const;
const tabSlide = { type: "tween" as const, duration: 0.48, ease: slideEase };
const springDrawer = { type: "spring" as const, stiffness: 420, damping: 32, mass: 0.78 };
const SIDEBAR_WIDTH = 200;
const MOBILE_DRAWER_WIDTH = "min(240px,72vw)";

const gpu = {
  transform: "translateZ(0)",
  backfaceVisibility: "hidden" as const,
  WebkitBackfaceVisibility: "hidden" as const,
};

function AdminSidebar({
  onNavigate,
  className,
  mobile,
}: {
  onNavigate?: () => void;
  className?: string;
  mobile?: boolean;
}) {
  const navigate = useNavigate();
  const user = getStoredUser();
  const admin = isAdmin();
  const nav = navItems.filter(item => !item.adminOnly || admin);
  const initials = user?.name?.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase() || "AD";

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    if (user?.role) return;
    getMe()
      .then(fresh => setSession(token, fresh))
      .catch(() => {
        clearSession();
        navigate("/admin/login");
      });
  }, [user?.role, navigate]);

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden",
        mobile ? "w-full flex-1" : "flex-shrink-0 min-h-[100dvh]",
        className,
      )}
      style={{
        width: mobile ? undefined : SIDEBAR_WIDTH,
        background: "linear-gradient(180deg, #06142A 0%, #0B1F3A 100%)",
      }}
    >
      {!mobile && (
        <div className="h-[3px] flex-shrink-0" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />
      )}

      <div className={cn(
        "flex items-center gap-3 flex-shrink-0",
        mobile ? "px-3.5 pt-4 pb-3" : "border-b border-white/6 px-4 py-4",
      )}>
        <div className="min-w-0 flex-1">
          <Logo light size={mobile ? "sm" : "md"} />
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={onNavigate}
            className="flex-shrink-0 size-9 rounded-full bg-white/10 hover:bg-white/15 active:bg-white/20 flex items-center justify-center text-white/90 transition-colors"
            aria-label="Close menu"
          >
            <X className="size-4 shrink-0" strokeWidth={2.25} />
          </button>
        )}
      </div>

      <nav className="flex-1 min-h-0 px-3 py-4 space-y-1 overflow-y-auto overscroll-contain">
        <p className="text-white/25 text-[9px] font-bold uppercase tracking-[0.15em] px-3 mb-2">Main Menu</p>
        {nav.map(({ to, icon: Icon, label, end }, index) => (
          <motion.div
            key={to}
            initial={mobile ? { opacity: 0, x: -12 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={mobile ? { delay: 0.06 + index * 0.045, duration: 0.28, ease: slideEase } : undefined}
          >
            <NavLink
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) => cn(
                "relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150",
                isActive ? "text-[#0B1F3A]" : "text-white/50 hover:text-white",
              )}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId={mobile ? "admin-nav-active-mobile" : "admin-nav-active"}
                      className="absolute inset-0 rounded-xl shadow-md pointer-events-none"
                      style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})`, boxShadow: `0 4px 12px ${GOLD}40` }}
                      transition={{ type: "spring", stiffness: 360, damping: 36 }}
                    />
                  )}
                  {!isActive && (
                    <motion.span
                      className="absolute inset-0 rounded-xl bg-white/0 pointer-events-none"
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
          </motion.div>
        ))}
      </nav>

      <div className={cn(
        "relative z-20 flex-shrink-0 px-3 pb-4 pt-2",
        mobile ? "" : "border-t border-white/8 bg-inherit",
      )}>
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border border-[#F7931E]/18",
            mobile
              ? "bg-white/[0.06] shadow-none"
              : "shadow-[0_10px_28px_rgba(0,0,0,0.38)]",
          )}
          style={mobile ? undefined : { background: "linear-gradient(155deg, #173a5c 0%, #112f4d 48%, #0a1f38 100%)" }}
        >
          <div
            className="h-[2px]"
            style={{ background: `linear-gradient(90deg, transparent 5%, ${GOLD}70, ${GOLD}, ${GOLD}70, transparent 95%)` }}
          />
          <div className="p-3.5">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ring-1 ring-[#F7931E]/35 shadow-[0_2px_8px_rgba(247,147,30,0.25)]"
                style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARKER})` }}
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-xs font-semibold truncate leading-tight">{user?.name ?? "Admin"}</p>
                <p className="text-[#F7931E]/75 text-[10px] truncate mt-0.5 flex items-center gap-1">
                  {user?.role === "admin" ? <ShieldCheck className="w-3 h-3" /> : <UserCog className="w-3 h-3" />}
                  {roleLabel(user?.role)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                clearSession();
                onNavigate?.();
                navigate("/admin/login");
              }}
              className="relative z-30 mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white/80 hover:text-[#F7931E] active:text-[#F7931E] bg-[#06142A]/55 hover:bg-[#06142A]/80 border border-white/10 hover:border-[#F7931E]/30 text-xs font-semibold transition-all cursor-pointer touch-manipulation"
            >
              <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function MobileNavDrawer({
  open,
  onClose,
  reducedMotion,
}: {
  open: boolean;
  onClose: () => void;
  reducedMotion: boolean | null;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <button
            type="button"
            aria-label="Close menu overlay"
            className="absolute inset-0 bg-[#04101f]/40 backdrop-blur-[6px] cursor-pointer"
            onClick={onClose}
          />

          <motion.div
            className="absolute inset-y-0 left-0 flex pointer-events-auto"
            style={{ width: MOBILE_DRAWER_WIDTH }}
            initial={reducedMotion ? { opacity: 0 } : { x: "-100%" }}
            animate={{ x: 0, opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { x: "-100%" }}
            transition={reducedMotion ? { duration: 0.15 } : springDrawer}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex h-full min-h-0 w-full flex-col overflow-hidden shadow-[0_24px_64px_-12px_rgba(0,0,0,0.55)] ring-1 ring-white/10">
              <div
                className="h-[3px] flex-shrink-0"
                style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }}
              />
              <AdminSidebar mobile onNavigate={onClose} className="flex-1 min-h-0" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MobileTopBar({ onOpen }: { onOpen: () => void }) {
  return (
    <div
      className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-3 sm:px-4 h-14 border-b border-white/10"
      style={{ background: "linear-gradient(135deg, #06142A 0%, #0B1F3A 100%)" }}
    >
      <button
        type="button"
        onClick={onOpen}
        className="size-10 rounded-xl bg-white/10 hover:bg-white/15 flex items-center justify-center text-white transition-colors"
        aria-label="Open menu"
      >
        <Menu className="size-5 shrink-0" />
      </button>
      <Logo light size="sm" />
    </div>
  );
}

export function AdminLayout() {
  const location = useLocation();
  const reducedMotion = useReducedMotion();
  const isDesktop = useIsDesktopNav();
  const [menuOpen, setMenuOpen] = useState(false);
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

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isDesktop) setMenuOpen(false);
  }, [isDesktop]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [menuOpen]);

  const dir = direction.current;
  const tabTransition = reducedMotion ? { duration: 0.01 } : tabSlide;

  return (
    <div className="flex h-[100dvh] overflow-hidden font-['Inter']">
      <div className="hidden lg:flex h-[100dvh] min-h-[100dvh] flex-shrink-0 self-stretch" style={{ width: SIDEBAR_WIDTH }}>
        <AdminSidebar className="h-full" />
      </div>

      {!isDesktop && (
        <MobileNavDrawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          reducedMotion={reducedMotion}
        />
      )}

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-[#F4F6FA]">
        <MobileTopBar onOpen={() => setMenuOpen(true)} />
        <main className="flex-1 min-h-0 relative overflow-hidden">
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
    </div>
  );
}
