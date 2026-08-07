import { useState } from "react";
import { Navigate } from "react-router";
import { ShieldOff, ShieldCheck, ShieldPlus, ShieldMinus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/portal/Logo";
import { UsersTable } from "@/components/portal/UsersTable";
import { CreateUserModal } from "@/components/portal/CreateUserModal";
import { ConfirmDialog } from "@/components/portal/ConfirmDialog";
import { ApiErrorAlert } from "@/components/portal/ApiErrorAlert";
import { toFilterParam } from "@/components/portal/TableFiltersPopover";
import { getUsers, removePortalUser, updatePortalUser } from "@/lib/storage";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { isAdmin } from "@/lib/auth";
import { homePathForRole } from "@/lib/permissions";
import type { PortalUser } from "@/lib/types";

type UserAction = "block" | "unblock" | "promote" | "demote" | "delete";

export function UsersPage() {
  const [showUserModal, setShowUserModal] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [actionId, setActionId] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<{ type: UserAction; user: PortalUser } | null>(null);
  const debouncedSearch = useDebouncedValue(search);

  const { data, setData, loading, error, refresh } = useApiQuery(
    () => getUsers({ search: debouncedSearch, role: toFilterParam(roleFilter) }),
    [debouncedSearch, roleFilter],
    isAdmin(),
  );

  if (!isAdmin()) {
    return <Navigate to={homePathForRole()} replace />;
  }

  function removeUserLocally(id: number) {
    setData(prev => {
      if (!prev) return prev;
      return {
        items: prev.items.filter(u => u.id !== id),
        total: Math.max(0, prev.total - 1),
      };
    });
  }

  function updateUserLocally(updated: PortalUser) {
    setData(prev => {
      if (!prev) return prev;
      const matchesFilter = roleFilter.length === 0 || roleFilter.includes(updated.role);
      if (!matchesFilter) {
        return {
          items: prev.items.filter(u => u.id !== updated.id),
          total: Math.max(0, prev.total - 1),
        };
      }
      return {
        items: prev.items.map(u => (u.id === updated.id ? updated : u)),
        total: prev.total,
      };
    });
  }

  async function runAction(user: PortalUser, action: () => Promise<void>) {
    setActionId(user.id);
    try {
      await action();
      setPendingAction(null);
    } finally {
      setActionId(null);
    }
  }

  function confirmUserAction() {
    if (!pendingAction) return;
    const { type, user } = pendingAction;
    if (type === "block" || type === "unblock") {
      runAction(user, async () => {
        const updated = await updatePortalUser(user.id, { isActive: type === "unblock" });
        updateUserLocally(updated);
      });
      return;
    }
    if (type === "promote") {
      runAction(user, async () => {
        const updated = await updatePortalUser(user.id, { role: "admin" });
        updateUserLocally(updated);
      });
      return;
    }
    if (type === "demote") {
      runAction(user, async () => {
        const updated = await updatePortalUser(user.id, { role: "manager" });
        updateUserLocally(updated);
      });
      return;
    }
    runAction(user, async () => {
      await removePortalUser(user.id);
      removeUserLocally(user.id);
    });
  }

  const dialogCopy = pendingAction ? {
    block: {
      title: "Block User Access",
      message: `Temporarily block ${pendingAction.user.name} from signing in and using the portal.`,
      confirmLabel: "Block Access",
      icon: <ShieldOff className="w-4 h-4" />,
      danger: true,
    },
    unblock: {
      title: "Restore User Access",
      message: `Restore portal access for ${pendingAction.user.name}.`,
      confirmLabel: "Unblock Access",
      icon: <ShieldCheck className="w-4 h-4" />,
      danger: false,
    },
    promote: {
      title: "Promote to Administrator",
      message: `Grant administrator privileges to ${pendingAction.user.name}. They will be able to manage users and all portal settings.`,
      confirmLabel: "Promote User",
      icon: <ShieldPlus className="w-4 h-4" />,
      danger: false,
    },
    demote: {
      title: "Downgrade to Manager",
      message: `Remove administrator privileges from ${pendingAction.user.name}. They will keep access as a manager.`,
      confirmLabel: "Downgrade User",
      icon: <ShieldMinus className="w-4 h-4" />,
      danger: false,
    },
    delete: {
      title: "Delete User",
      message: `Permanently delete ${pendingAction.user.name}. This action cannot be undone.`,
      confirmLabel: "Delete User",
      icon: <Trash2 className="w-4 h-4" />,
      danger: true,
    },
  }[pendingAction.type] : null;

  return (
    <>
      <PageHeader title="Team Users" subtitle="Manage administrator and manager accounts" />
      <div className="p-3 sm:p-6 lg:p-8 w-full">
        <ApiErrorAlert message={error} onRetry={refresh} />
        <UsersTable
          users={data?.items ?? []}
          loading={loading}
          search={search}
          roleFilter={roleFilter}
          total={data?.total}
          onSearchChange={setSearch}
          onRoleChange={setRoleFilter}
          onAddUser={() => setShowUserModal(true)}
          onBlockToggle={user => setPendingAction({ type: user.isActive ? "block" : "unblock", user })}
          onPromote={user => setPendingAction({ type: "promote", user })}
          onDemote={user => setPendingAction({ type: "demote", user })}
          onDelete={user => setPendingAction({ type: "delete", user })}
          actionId={actionId}
          hideTitle
        />
      </div>

      <CreateUserModal open={showUserModal} onClose={() => setShowUserModal(false)} onCreated={refresh} />
      {dialogCopy && pendingAction && (
        <ConfirmDialog
          open
          title={dialogCopy.title}
          message={dialogCopy.message}
          confirmLabel={dialogCopy.confirmLabel}
          icon={dialogCopy.icon}
          danger={dialogCopy.danger}
          loading={actionId === pendingAction.user.id}
          onClose={() => setPendingAction(null)}
          onConfirm={confirmUserAction}
        />
      )}
    </>
  );
}
