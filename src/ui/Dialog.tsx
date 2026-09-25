import { type ReactNode, type RefObject, useEffect, useRef } from 'react'

interface DialogProps {
  labelledBy: string
  describedBy?: string
  onClose(): void
  className?: string
  initialFocus?: RefObject<HTMLElement | null>
  children: ReactNode
}

/**
 * Native modal <dialog>: traps focus, makes the page behind inert, closes on Escape
 * and backdrop click, and returns focus to whatever opened it.
 */
export function Dialog({ labelledBy, describedBy, onClose, className = '', initialFocus, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (!dialog.open) dialog.showModal()
    initialFocus?.current?.focus()
    const onCancel = (e: Event) => {
      e.preventDefault()
      onCloseRef.current()
    }
    dialog.addEventListener('cancel', onCancel)
    return () => {
      dialog.removeEventListener('cancel', onCancel)
      if (dialog.open) dialog.close()
      if (opener?.isConnected) opener.focus()
    }
    // Open once on mount; the parent unmounts the dialog to close it.
  }, [])

  return (
    <dialog
      ref={ref}
      className={`dialog ${className}`}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onClick={(e) => {
        if (e.target === ref.current) onCloseRef.current()
      }}
    >
      <div className="dialog__sheet">{children}</div>
    </dialog>
  )
}
