type Props = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function AdminConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '삭제',
  cancelLabel = '취소',
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null

  return (
    <div
      className="admin-dialog-backdrop"
      role="presentation"
      onClick={loading ? undefined : onCancel}
    >
      <div
        className="admin-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-dialog-title"
        aria-describedby="admin-dialog-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="admin-dialog-title" className="admin-dialog-title">
          {title}
        </h3>
        <p id="admin-dialog-desc" className="admin-dialog-message">
          {message}
        </p>
        <div className="admin-dialog-actions">
          <button
            type="button"
            className="admin-btn admin-btn-ghost"
            disabled={loading}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-danger"
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? '삭제 중…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
