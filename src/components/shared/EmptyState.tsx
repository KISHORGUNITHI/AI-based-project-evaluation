import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  description?: string
  action?: { label: string; onClick: () => void }
  icon?: React.ReactNode
}

export function EmptyState({
  title = 'Nothing here yet',
  description = 'Get started by creating your first item.',
  action,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-muted border border-slate-200 dark:border-border flex items-center justify-center text-slate-400 dark:text-muted-foreground">
        {icon ?? <Inbox size={24} />}
      </div>
      <div>
        <p className="font-semibold text-slate-800 dark:text-slate-100">{title}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90 transition shadow-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
