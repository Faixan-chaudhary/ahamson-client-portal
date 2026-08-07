import { Navigate, useLocation } from "react-router";
import { getStoredUser } from "@/lib/auth";
import { canAccessPath, homePathForRole } from "@/lib/permissions";

/** Blocks admin routes the current role cannot access. */
export function RoleRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const user = getStoredUser();
  if (!canAccessPath(location.pathname, user?.role)) {
    return <Navigate to={homePathForRole(user?.role)} replace />;
  }
  return <>{children}</>;
}
