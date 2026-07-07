import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { LoginPage } from "@/pages/admin/LoginPage";
import { DashboardPage } from "@/pages/admin/DashboardPage";
import { SubmissionsPage } from "@/pages/admin/SubmissionsPage";
import { LinksPage } from "@/pages/admin/LinksPage";
import { SubmissionDetailPage } from "@/pages/admin/SubmissionDetailPage";
import { DocumentFormPage } from "@/pages/client/DocumentFormPage";
import { PreviewPage } from "@/pages/client/PreviewPage";
import { ExpiredPage } from "@/pages/client/ExpiredPage";
import { ProtectedRoute } from "@/components/portal/ProtectedRoute";
import { AdminLayout } from "@/components/portal/AdminLayout";
import { GOLD } from "@/lib/constants";

const slideEase = [0.4, 0, 0.2, 1] as const;
const slideTransition = { type: "tween" as const, duration: 0.58, ease: slideEase };

const gpu = {
  transform: "translateZ(0)",
  backfaceVisibility: "hidden" as const,
  WebkitBackfaceVisibility: "hidden" as const,
};

function routeKey(pathname: string) {
  if (pathname === "/admin/login") return "login";
  if (pathname.startsWith("/admin")) return "admin";
  return pathname;
}

export function AnimatedRoutes() {
  const location = useLocation();
  const reducedMotion = useReducedMotion();
  const key = routeKey(location.pathname);
  const fromLogin = (location.state as { fromLogin?: boolean } | null)?.fromLogin === true;
  const [sweep, setSweep] = useState(0);

  const isAuthEnter = fromLogin && key === "admin";
  const isAuthSlide = isAuthEnter || key === "login";
  const transition = reducedMotion ? { duration: 0.01 } : isAuthSlide ? slideTransition : { duration: 0.25, ease: slideEase };

  useEffect(() => {
    if (isAuthEnter) setSweep(k => k + 1);
  }, [isAuthEnter]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#06142A]">
      <AnimatePresence initial={false}>
        <motion.div
          key={key}
          initial={
            reducedMotion
              ? false
              : isAuthEnter
                ? { x: "100%" }
                : { opacity: 0 }
          }
          animate={{ x: 0, opacity: 1 }}
          exit={
            reducedMotion
              ? { opacity: 0 }
              : key === "login"
                ? { x: "-100%" }
                : { opacity: 0 }
          }
          transition={transition}
          className="absolute inset-0 h-full w-full overflow-hidden"
          style={gpu}
        >
          <Routes location={location}>
            <Route path="/" element={<Navigate to="/admin/login" replace />} />
            <Route path="/admin/login" element={<LoginPage />} />
            <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="submissions" element={<SubmissionsPage />} />
              <Route path="submissions/:id" element={<SubmissionDetailPage />} />
              <Route path="links" element={<LinksPage />} />
            </Route>
            <Route path="/client/document/:token" element={<DocumentFormPage />} />
            <Route path="/client/preview/:token" element={<PreviewPage />} />
            <Route path="/client/expired" element={<ExpiredPage />} />
            <Route path="*" element={<Navigate to="/admin/login" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {sweep > 0 && !reducedMotion && (
          <motion.div
            key={sweep}
            className="pointer-events-none absolute top-0 left-0 right-0 h-[2px] z-[200] origin-left"
            style={{ ...gpu, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={slideTransition}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
