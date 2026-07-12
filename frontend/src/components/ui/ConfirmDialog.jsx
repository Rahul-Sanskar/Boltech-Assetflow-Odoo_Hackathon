import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

/**
 * Confirmation dialog built on Modal.
 */
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm',
  message = 'Are you sure?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}) => {
  const confirmClass =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700'
      : variant === 'success'
        ? 'bg-emerald-600 hover:bg-emerald-700'
        : 'bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)]';

  return (
    <Modal isOpen={isOpen} onClose={loading ? undefined : onClose} title={title} size="sm">
      <div className="space-y-5">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-sm text-[var(--text-muted)] pt-2">{message}</p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 ${confirmClass}`}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
