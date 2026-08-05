import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  danger?: boolean;
  icon?: React.ReactNode;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onClose,
  onConfirm,
  loading = false,
  danger = false,
  icon,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} subtitle="Please confirm this action">
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-2xl border border-[#0B1F3A]/8 bg-[#F8F9FC] px-4 py-3">
          <span className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${danger ? "bg-red-50 text-red-600" : "bg-[#F7931E]/10 text-[#F7931E]"}`}>
            {icon ?? <AlertTriangle className="w-4 h-4" />}
          </span>
          <p className="text-sm text-[#64748B] leading-relaxed pt-1.5">{message}</p>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            variant={danger ? "outline" : "gold"}
            onClick={onConfirm}
            disabled={loading}
            className={danger ? "border-red-200 text-red-600 hover:bg-red-50" : undefined}
          >
            {loading ? "Please wait…" : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
