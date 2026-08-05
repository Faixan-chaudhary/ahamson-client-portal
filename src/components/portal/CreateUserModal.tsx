import { useEffect, useState } from "react";
import { User, Mail, Lock, RefreshCw } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { FormField, Input } from "./FormField";
import { PortalSelect } from "./Select";
import { createPortalUser } from "@/lib/storage";

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export function CreateUserModal({ open, onClose, onCreated }: CreateUserModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("manager");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setName("");
    setEmail("");
    setPassword("");
    setRole("manager");
    setError("");
  }

  useEffect(() => {
    if (open) reset();
  }, [open]);

  function handleClose() {
    reset();
    onClose();
  }

  async function submit() {
    if (!name || !email || !password) return;
    setLoading(true);
    setError("");
    try {
      await createPortalUser({
        name,
        email,
        password,
        role: role as "admin" | "manager",
      });
      onCreated?.();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Team User"
      subtitle="Create a manager or administrator account"
    >
      <form
        className="space-y-4"
        autoComplete="off"
        onSubmit={e => {
          e.preventDefault();
          void submit();
        }}
      >
        <FormField label="Full Name">
          <Input
            value={name}
            onChange={setName}
            icon={<User className="w-4 h-4" />}
            placeholder="John Smith"
            name="ahamson-new-user-name"
            autoComplete="off"
          />
        </FormField>
        <FormField label="Email Address">
          <Input
            value={email}
            onChange={setEmail}
            icon={<Mail className="w-4 h-4" />}
            placeholder="manager@ahamson.com"
            name="ahamson-new-user-email"
            autoComplete="off"
          />
        </FormField>
        <FormField label="Password">
          <Input
            value={password}
            onChange={setPassword}
            type="password"
            icon={<Lock className="w-4 h-4" />}
            placeholder="Min. 6 characters"
            name="ahamson-new-user-password"
            autoComplete="new-password"
          />
        </FormField>
        <FormField label="Role">
          <PortalSelect
            value={role}
            onChange={setRole}
            options={[
              { value: "manager", label: "Manager" },
              { value: "admin", label: "Administrator" },
              { value: "staff", label: "Salicru Staff" },
            ]}
          />
        </FormField>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <Button
          type="submit"
          variant="gold"
          className="w-full"
          disabled={loading || !name || !email || password.length < 6}
          icon={loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
        >
          {loading ? "Creating…" : "Create User"}
        </Button>
      </form>
    </Modal>
  );
}
