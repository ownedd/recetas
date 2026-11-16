import { useEffect, useRef } from 'react'

export function ConfirmDialog(props: {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  onConfirm(): void
  onCancel(): void
}) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const { open, onCancel } = props

  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-ink/40 p-4 backdrop-blur-sm sm:place-items-center" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="animate-rise w-full max-w-sm rounded-card border border-line bg-card p-6 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-2xl">
          {props.title}
        </h2>
        <p className="mt-2 text-ink-soft">{props.message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button ref={cancelRef} type="button" className="btn-ghost" onClick={props.onCancel}>
            Cancelar
          </button>
          <button type="button" className="btn-primary" onClick={props.onConfirm}>
            {props.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
