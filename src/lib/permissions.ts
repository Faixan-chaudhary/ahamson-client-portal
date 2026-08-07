import type { UserRole } from "./types";
import { getStoredUser } from "./auth";

/** App modules shown in admin nav / route guards. */
export type AppModule =
  | "dashboard"
  | "pipeline"
  | "quotations"
  | "sales-activities"
  | "deal-links"
  | "links"
  | "users";

const ALL: AppModule[] = [
  "dashboard",
  "pipeline",
  "quotations",
  "sales-activities",
  "deal-links",
  "links",
  "users",
];

/**
 * Role → visible modules (sidebar + route access).
 * Admin sees everything; others only their operating surface.
 */
const ROLE_MODULES: Record<UserRole, AppModule[]> = {
  admin: ALL,
  // Sales Person — day-to-day sales CRM
  manager: ["pipeline", "quotations", "sales-activities", "deal-links"],
  // Finance — quote approvals + pipeline visibility for context
  finance_manager: ["quotations", "pipeline"],
  // Sales Head — pipeline review + OEM order approvals
  sales_head: ["pipeline", "quotations", "sales-activities"],
  // Salicru Staff — OEM partner read surface
  staff: ["pipeline", "quotations"],
};

const MODULE_PATHS: { prefix: string; module: AppModule }[] = [
  { prefix: "/admin/users", module: "users" },
  { prefix: "/admin/links", module: "links" },
  { prefix: "/admin/deal-links", module: "deal-links" },
  { prefix: "/admin/deal-registration", module: "deal-links" },
  { prefix: "/admin/deals/", module: "deal-links" },
  { prefix: "/admin/sales-activities", module: "sales-activities" },
  { prefix: "/admin/quotations", module: "quotations" },
  { prefix: "/admin/pipeline", module: "pipeline" },
  { prefix: "/admin/submissions/", module: "links" },
  { prefix: "/admin/dashboard", module: "dashboard" },
];

export function modulesForRole(role?: string | null): AppModule[] {
  if (!role) return [];
  return ROLE_MODULES[role as UserRole] ?? [];
}

export function canAccessModule(module: AppModule, role?: string | null): boolean {
  const r = role ?? currentRole();
  if (r === "admin") return true;
  return modulesForRole(r).includes(module);
}

export function currentRole(): UserRole | undefined {
  return getStoredUser()?.role;
}

export function canAccessPath(pathname: string, role?: string | null): boolean {
  const r = role ?? currentRole();
  if (!r) return false;
  if (r === "admin") return true;
  // Exact /admin → allow (redirects to role home)
  if (pathname === "/admin" || pathname === "/admin/") return true;
  for (const { prefix, module } of MODULE_PATHS) {
    if (pathname === prefix || pathname.startsWith(prefix)) {
      return canAccessModule(module, r);
    }
  }
  // Deny unknown admin paths for non-admin
  return false;
}

/** First module home after login. */
export function homePathForRole(role?: string | null): string {
  const mods = modulesForRole(role);
  if (mods.includes("dashboard")) return "/admin/dashboard";
  if (mods.includes("quotations")) return "/admin/quotations";
  if (mods.includes("pipeline")) return "/admin/pipeline";
  if (mods.includes("sales-activities")) return "/admin/sales-activities";
  if (mods.includes("deal-links")) return "/admin/deal-links";
  return "/admin/login";
}

export function moduleForPath(pathname: string): AppModule | null {
  for (const { prefix, module } of MODULE_PATHS) {
    if (pathname === prefix || pathname.startsWith(prefix)) return module;
  }
  return null;
}

function roleIs(...roles: UserRole[]) {
  const r = currentRole();
  return !!r && (r === "admin" || roles.includes(r));
}

/** Action-level capabilities (UI buttons). Admin always allowed. */
export const can = {
  manageUsers: () => roleIs(),
  manageDocumentLinks: () => roleIs(),
  manageDealLinks: () => roleIs("manager"),
  createQuotation: () => roleIs("manager"),
  /** Sales + Sales Head can edit pipeline; Finance/Staff view only. */
  mutatePipeline: () => roleIs("manager", "sales_head"),
  syncPipelineFromQuotes: () => roleIs("manager", "sales_head"),
  mutateSalesActivity: () => roleIs("manager", "sales_head"),
  /** Staff / finance are mostly viewers outside their approval actions. */
  isViewerOnly: () => {
    const r = currentRole();
    return r === "staff" || r === "finance_manager";
  },
};
