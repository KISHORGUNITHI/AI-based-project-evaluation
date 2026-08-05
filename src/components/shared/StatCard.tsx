import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  variant?: 'default' | 'blue' | 'green' | 'amber' | 'red' | 'purple'
}

const variants = {
  default: {
    card: 'bg-white dark:bg-card border border-slate-200 dark:border-border shadow-sm',
    title: 'text-slate-500 dark:text-slate-400',
    value: 'text-slate-800 dark:text-slate-100',
    desc:  'text-slate-400 dark:text-slate-500',
    icon:  'bg-slate-50 dark:bg-muted text-slate-600 dark:text-slate-400 shadow-sm border border-slate-100 dark:border-border',
  },
  blue: {
    card: 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white border border-blue-400/20 shadow-sm shadow-blue-500/10 dark:shadow-none',
    title: 'text-blue-100',
    value: 'text-white',
    desc:  'text-blue-100/90',
    icon:  'bg-white/10 text-white border border-white/20',
  },
  green: {
    card: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border border-emerald-400/20 shadow-sm shadow-emerald-500/10 dark:shadow-none',
    title: 'text-emerald-100',
    value: 'text-white',
    desc:  'text-emerald-100/90',
    icon:  'bg-white/10 text-white border border-white/20',
  },
  amber: {
    card: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border border-amber-400/20 shadow-sm shadow-amber-500/10 dark:shadow-none',
    title: 'text-orange-100',
    value: 'text-white',
    desc:  'text-orange-100/90',
    icon:  'bg-white/10 text-white border border-white/20',
  },
  red: {
    card: 'bg-gradient-to-br from-red-500 to-rose-600 text-white border border-red-400/20 shadow-sm shadow-red-500/10 dark:shadow-none',
    title: 'text-red-100',
    value: 'text-white',
    desc:  'text-red-100/90',
    icon:  'bg-white/10 text-white border border-white/20',
  },
  purple: {
    card: 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white border border-purple-400/20 shadow-sm shadow-purple-500/10 dark:shadow-none',
    title: 'text-purple-100',
    value: 'text-white',
    desc:  'text-purple-100/90',
    icon:  'bg-white/10 text-white border border-white/20',
  },
}

export function StatCard({ title, value, icon: Icon, description, variant = 'default' }: StatCardProps) {
  const v = variants[variant]
  return (
    <div className={cn('rounded-2xl p-4 flex flex-col gap-3', v.card)}>
      {/* title + icon row */}
      <div className="flex items-center justify-between gap-2">
        <p className={cn('text-xs font-semibold', v.title)}>{title}</p>
        <div className={cn('w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center', v.icon)}>
          <Icon size={16} />
        </div>
      </div>

      {/* value + description */}
      <div>
        <p className={cn('text-2xl font-extrabold tracking-tight', v.value)}>{value}</p>
        {description && (
          <p className={cn('text-xs font-medium mt-0.5', v.desc)}>{description}</p>
        )}
      </div>
    </div>
  )
}
