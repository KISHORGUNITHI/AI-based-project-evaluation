import { cn } from '@/lib/utils'
import { brandColors } from '@/lib/brandColors'

interface ScoreBadgeProps {
  score?: number | string | null
  size?: 'sm' | 'md' | 'lg'
  variant?: 'ai' | 'judge' | 'final'
  className?: string
}

function getColor(score: number) {
  if (score < 50) return 'bg-red-50 text-red-700 border border-red-200'
  if (score < 75) return 'bg-amber-50 text-amber-700 border border-amber-200'
  if (score < 90) return 'bg-blue-50 text-blue-700 border border-blue-200'
  return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
}

const sizes = {
  sm: 'text-xs px-2 py-0.5 rounded-md',
  md: 'text-sm px-2.5 py-1 rounded-lg',
  lg: 'text-base px-3 py-1.5 rounded-lg font-bold',
}

export function ScoreBadge({ score, size = 'md', variant, className }: ScoreBadgeProps) {
  if (score == null) {
    return (
      <span className={cn('font-semibold bg-slate-100 text-slate-500 border border-slate-200', sizes[size], className)}>
        N/A
      </span>
    )
  }
  const num = Number(score)
  const colorClass = variant ? brandColors.score[variant] : getColor(num)

  return (
    <span className={cn('font-semibold', colorClass, sizes[size], className)}>
      {num.toFixed(1)}
    </span>
  )
}

