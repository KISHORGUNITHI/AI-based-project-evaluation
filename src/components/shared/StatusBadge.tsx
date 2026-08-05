import { cn } from '@/lib/utils'
import type { ProjectStatus } from '@/types/project'
import type { EvaluationStatus } from '@/types/evaluation'
import type { SubmissionStatus } from '@/types/submission'

type Status =
  | ProjectStatus
  | EvaluationStatus
  | SubmissionStatus
  | 'STUDENT'
  | 'JUDGE'
  | 'ADMIN'
  | 'VERIFIED'
  | 'NOT_VERIFIED'
  | 'ACTIVE'
  | 'PENDING_JUDGE'

const STATUS_CLASSES: Record<Status, string> = {
  DRAFT:            'bg-gray-100 text-gray-800 border-gray-300 dark:bg-muted dark:text-muted-foreground dark:border-border border',
  PENDING:          'bg-gray-100 text-gray-800 border-gray-300 dark:bg-muted dark:text-muted-foreground dark:border-border border',
  SUBMITTED:        'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700/50 border',
  EVALUATING:       'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/50 border',
  AI_EVALUATING:    'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700/50 border',
  JUDGE_EVALUATING: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/50 border',
  AI_COMPLETED:     'bg-violet-100 text-violet-800 border-violet-300 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700/50 border',
  COMPLETED:        'bg-green-100 text-green-800 border-green-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700/50 border',
  EVALUATED:        'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700/50 border',
  REJECTED:         'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/40 border',
  
  STUDENT:          'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700/50 border',
  JUDGE:            'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700/50 border',
  ADMIN:            'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-850/40 border',
  VERIFIED:         'bg-green-100 text-green-800 border-green-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700/50 border',
  NOT_VERIFIED:     'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/40 border',
  ACTIVE:           'bg-green-100 text-green-800 border-green-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700/50 border',
  PENDING_JUDGE:    'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/50 border',
}

const STATUS_MAP: Record<Status, { label: string; className: string }> = {
  DRAFT:            { label: 'Draft',            className: STATUS_CLASSES.DRAFT },
  PENDING:          { label: 'Pending',           className: STATUS_CLASSES.PENDING },
  SUBMITTED:        { label: 'Submitted',         className: STATUS_CLASSES.SUBMITTED },
  EVALUATING:       { label: 'Evaluating',        className: STATUS_CLASSES.EVALUATING },
  AI_EVALUATING:    { label: 'AI Evaluating',     className: STATUS_CLASSES.AI_EVALUATING },
  JUDGE_EVALUATING: { label: 'Judge Reviewing',   className: STATUS_CLASSES.JUDGE_EVALUATING },
  AI_COMPLETED:     { label: 'AI Completed',      className: STATUS_CLASSES.AI_COMPLETED },
  COMPLETED:        { label: 'Completed',         className: STATUS_CLASSES.COMPLETED },
  EVALUATED:        { label: 'Evaluated',         className: STATUS_CLASSES.EVALUATED },
  REJECTED:         { label: 'Rejected',          className: STATUS_CLASSES.REJECTED },
  
  STUDENT:          { label: 'Student',          className: STATUS_CLASSES.STUDENT },
  JUDGE:            { label: 'Judge',            className: STATUS_CLASSES.JUDGE },
  ADMIN:            { label: 'Admin',            className: STATUS_CLASSES.ADMIN },
  VERIFIED:         { label: 'Verified',         className: STATUS_CLASSES.VERIFIED },
  NOT_VERIFIED:     { label: 'Not Verified',     className: STATUS_CLASSES.NOT_VERIFIED },
  ACTIVE:           { label: 'Active',           className: STATUS_CLASSES.ACTIVE },
  PENDING_JUDGE:    { label: 'Pending',          className: STATUS_CLASSES.PENDING_JUDGE },
}

export function StatusBadge({ status }: { status: Status }) {
  const config = STATUS_MAP[status] ?? { label: status, className: 'bg-slate-100 text-slate-500 border border-slate-200' }
  return (
    <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full w-fit inline-flex items-center justify-center', config.className)}>
      {config.label}
    </span>
  )
}

