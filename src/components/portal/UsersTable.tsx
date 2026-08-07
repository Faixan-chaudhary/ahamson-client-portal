import { UserPlus, ShieldOff, ShieldCheck, Trash2, ShieldPlus, ShieldMinus, UserCog, CheckCircle2, LockKeyhole, Users } from "lucide-react";
import { TableFiltersPopover } from "./TableFiltersPopover";
import { Button } from "./Button";
import {
  DataTable,
  DataTableActions,
  DataTableBody,
  DataTableCard,
  DataTableFilters,
  DataTableHead,
  DataTableHeadRow,
  DataTableRow,
  DataTableSearch,
  DataTableState,
  DataTableTd,
  DataTableTh,
  DataTableTitle,
  DataTableToolbar,
  DataTableWrap,
} from "./DataTable";
import { formatDateTime } from "@/lib/utils";
import type { PortalUser } from "@/lib/types";
import { getStoredUser, roleLabel } from "@/lib/auth";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admins" },
  { value: "manager", label: "Sales Persons" },
  { value: "finance_manager", label: "Finance Managers" },
  { value: "sales_head", label: "Sales Heads" },
  { value: "staff", label: "Salicru Staff" },
];

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === "admin";
  const isStaff = role === "staff";
  const Icon = isAdmin ? ShieldCheck : UserCog;
  const tone = isAdmin
    ? "bg-[#F7931E]/12 text-[#C56F0A] border-[#F7931E]/20"
    : isStaff
      ? "bg-violet-50 text-violet-700 border-violet-200"
      : "bg-[#0EA5E9]/10 text-[#0369A1] border-sky-200/80";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.06em] border whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] ${tone}`}>
      <Icon className="w-3 h-3 flex-shrink-0" strokeWidth={2.25} />
      {roleLabel(role)}
    </span>
  );
}

function AccessBadge({ active }: { active: boolean }) {
  const Icon = active ? CheckCircle2 : LockKeyhole;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.06em] border whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] ${
      active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"
    }`}>
      <Icon className="w-3 h-3 flex-shrink-0" strokeWidth={2.25} />
      {active ? "Active" : "Blocked"}
    </span>
  );
}

function ActionButton({
  title,
  onClick,
  disabled,
  tone = "neutral",
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "neutral" | "gold" | "danger";
  children: React.ReactNode;
}) {
  const toneClass = {
    neutral: "text-[#64748B] hover:text-[#0B1F3A] hover:bg-[#F4F6FA] hover:border-[#0B1F3A]/8",
    gold: "text-[#F7931E] hover:bg-[#F7931E]/10 hover:border-[#F7931E]/20",
    danger: "text-[#64748B] hover:text-red-600 hover:bg-red-50 hover:border-red-200/80",
  }[tone];

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all border border-transparent disabled:opacity-50 ${toneClass}`}
    >
      {children}
    </button>
  );
}

interface UsersTableProps {
  users: PortalUser[];
  loading?: boolean;
  search: string;
  roleFilter: string[];
  total?: number;
  onSearchChange: (value: string) => void;
  onRoleChange: (value: string[]) => void;
  onAddUser: () => void;
  onBlockToggle: (user: PortalUser) => void;
  onPromote: (user: PortalUser) => void;
  onDemote: (user: PortalUser) => void;
  onDelete: (user: PortalUser) => void;
  actionId?: number | null;
  hideTitle?: boolean;
}

export function UsersTable({
  users,
  loading = false,
  search,
  roleFilter = [],
  total,
  onSearchChange,
  onRoleChange,
  onAddUser,
  onBlockToggle,
  onPromote,
  onDemote,
  onDelete,
  actionId,
  hideTitle = false,
}: UsersTableProps) {
  const currentUser = getStoredUser();

  function userActions(user: PortalUser) {
    const isSelf = user.id === currentUser?.id;
    const busy = actionId === user.id;
    if (isSelf) return null;
    return (
      <>
        <ActionButton
          title={user.isActive ? "Block access" : "Unblock access"}
          onClick={() => onBlockToggle(user)}
          disabled={busy}
          tone={user.isActive ? "neutral" : "gold"}
        >
          {user.isActive ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
        </ActionButton>
        {user.role === "manager" ? (
          <ActionButton title="Promote to administrator" onClick={() => onPromote(user)} disabled={busy} tone="gold">
            <ShieldPlus className="w-4 h-4" />
          </ActionButton>
        ) : (
          <ActionButton title="Downgrade to manager" onClick={() => onDemote(user)} disabled={busy} tone="neutral">
            <ShieldMinus className="w-4 h-4" />
          </ActionButton>
        )}
        <ActionButton title="Delete user" onClick={() => onDelete(user)} disabled={busy} tone="danger">
          <Trash2 className="w-4 h-4" />
        </ActionButton>
      </>
    );
  }

  return (
    <DataTableCard>
      <DataTableToolbar className={hideTitle ? "lg:justify-end" : undefined}>
        {!hideTitle && (
          <DataTableTitle
            title="Team Users"
            subtitle={`${total ?? users.length} user${(total ?? users.length) !== 1 ? "s" : ""}`}
            icon={<Users className="w-4 h-4 text-[#0B1F3A]" />}
          />
        )}
        <DataTableFilters className="sm:justify-end">
          <DataTableSearch value={search} onChange={onSearchChange} placeholder="Search users..." />
          <TableFiltersPopover
            title="Filter users"
            fields={[
              {
                key: "role",
                label: "Role",
                values: roleFilter,
                options: ROLE_OPTIONS,
                onChange: onRoleChange,
              },
            ]}
          />
          <Button variant="gold" icon={<UserPlus className="w-4 h-4" />} onClick={onAddUser} className="h-9 flex-1 sm:flex-none px-3 whitespace-nowrap">
            Add User
          </Button>
        </DataTableFilters>
      </DataTableToolbar>

      <DataTableWrap>
        <DataTable className="min-w-[860px]">
          <DataTableHead>
            <DataTableHeadRow>
              <DataTableTh>Name</DataTableTh>
              <DataTableTh>Email</DataTableTh>
              <DataTableTh>Role</DataTableTh>
              <DataTableTh>Access</DataTableTh>
              <DataTableTh>Joined</DataTableTh>
              <DataTableTh>Last Active</DataTableTh>
              <DataTableTh align="right">Actions</DataTableTh>
            </DataTableHeadRow>
          </DataTableHead>
          <DataTableBody>
            {loading ? (
              <DataTableState colSpan={7}>Loading users…</DataTableState>
            ) : users.length === 0 ? (
              <DataTableState colSpan={7}>No users found</DataTableState>
            ) : users.map(user => {
              const isSelf = user.id === currentUser?.id;
              return (
                <DataTableRow key={user.id}>
                  <DataTableTd variant="primary">
                    <span className="inline-flex items-center gap-2.5 whitespace-nowrap">
                      <span className="w-8 h-8 rounded-full bg-[#0B1F3A]/6 border border-[#0B1F3A]/8 flex items-center justify-center text-[10px] font-bold text-[#0B1F3A] flex-shrink-0">
                        {user.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase()}
                      </span>
                      <span>
                        {user.name}
                        {isSelf && <span className="ml-1.5 text-[10px] font-medium text-[#94A3B8] uppercase">You</span>}
                      </span>
                    </span>
                  </DataTableTd>
                  <DataTableTd className="whitespace-nowrap">{user.email}</DataTableTd>
                  <DataTableTd><RoleBadge role={user.role} /></DataTableTd>
                  <DataTableTd><AccessBadge active={user.isActive} /></DataTableTd>
                  <DataTableTd variant="muted">{formatDateTime(user.createdAt)}</DataTableTd>
                  <DataTableTd variant="muted">
                    {user.lastActiveAt ? formatDateTime(user.lastActiveAt) : "—"}
                  </DataTableTd>
                  <DataTableTd>
                    <DataTableActions>{userActions(user)}</DataTableActions>
                  </DataTableTd>
                </DataTableRow>
              );
            })}
          </DataTableBody>
        </DataTable>
      </DataTableWrap>
    </DataTableCard>
  );
}
