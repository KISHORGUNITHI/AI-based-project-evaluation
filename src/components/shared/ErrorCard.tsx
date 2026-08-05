import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorCardProps {
  message?: string
  onRetry?: () => void
}

export function ErrorCard({ message = 'Something went wrong', onRetry }: ErrorCardProps) {
  return (
    <div className="rounded-2xl border border-red-200 dark:border-destructive/20 bg-red-50 dark:bg-destructive/5 p-6 flex flex-col items-center gap-3 text-center">
      <AlertCircle size={24} className="text-red-500 dark:text-destructive" />
      <p className="text-sm text-red-750 dark:text-destructive font-medium">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-250 bg-white dark:bg-destructive/10 text-red-600 dark:text-destructive hover:bg-red-50 dark:hover:bg-destructive/20 transition"
        >
          <RefreshCw size={13} />
          Retry
        </button>
      )}
    </div>
  )
}
