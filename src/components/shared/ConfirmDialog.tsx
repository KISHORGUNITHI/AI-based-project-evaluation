import { Loader2 } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: () => void
  isPending?: boolean
  confirmLabel?: string
  variant?: 'destructive' | 'default'
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  isPending,
  confirmLabel = 'Confirm',
  variant = 'destructive',
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => !isPending && onOpenChange(false)}
      />
      <div className="relative z-10 bg-card border rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl">
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="flex gap-3 mt-6 justify-end">
          <button
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="bg-white border border-slate-200 text-slate-700 font-medium rounded-xl px-4 py-2 hover:border-orange-300 hover:text-orange-600 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className={`flex items-center gap-2 transition disabled:opacity-60 ${
              variant === 'destructive'
                ? 'bg-white border border-red-200 text-red-500 font-medium rounded-xl px-4 py-2 hover:bg-red-50'
                : 'bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl px-4 py-2 hover:opacity-90 shadow-sm'
            }`}
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
