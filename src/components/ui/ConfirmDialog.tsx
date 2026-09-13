import { useEffect } from "react";
import type { ReactNode } from "react";
import Modal from "./Modal";
import Button from "./Button";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "danger";
  loading?: boolean;
  icon?: ReactNode;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  icon,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && !loading) {
        event.preventDefault();
        onConfirm();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, loading, onConfirm]);

  return (
    <Modal
      open={open}
      onClose={loading ? () => undefined : onClose}
      title={title}
      description={description}
      size="sm"
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
    >
      <div className="flex flex-col items-center text-center">
        {icon && (
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            {icon}
          </div>
        )}

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="order-2 sm:order-1"
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            variant={variant}
            loading={loading}
            onClick={onConfirm}
            className="order-1 sm:order-2"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
