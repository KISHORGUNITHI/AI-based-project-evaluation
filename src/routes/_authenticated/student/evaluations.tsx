import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { queryKeys } from '@/lib/queryKeys'
import { studentService } from '@/services/studentService'
import { ScoreBadge } from '@/components/shared/ScoreBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorCard } from '@/components/shared/ErrorCard'
import { SkeletonCard } from '@/components/shared/LoadingSkeleton'
import type { Evaluation, EvaluationStatus } from '@/types/evaluation'

export const Route = createFileRoute('/_authenticated/student/evaluations')({ component: EvaluationsPage })

const TABS: { label: string; value: EvaluationStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'AI Done', value: 'AI_COMPLETED' },
  { label: 'Judge Review', value: 'JUDGE_EVALUATING' },
  { label: 'Completed', value: 'COMPLETED' },
]

const SUB_SCORES = [
  { key: 'problemStatementScore', label: 'Problem Statement' },
  { key: 'solutionDesignScore',   label: 'Solution Design' },
  { key: 'implementationScore',   label: 'Implementation' },
  { key: 'innovationScore',       label: 'Innovation' },
  { key: 'documentationScore',    label: 'Documentation' },
] as const

function EvalCard({ e }: { e: Evaluation }) {
  const [expanded, setExpanded] = useState(false)

  const hasSubScores = SUB_SCORES.some(s => e[s.key] != null)
  const hasHighlights = (e.strengths?.length ?? 0) + (e.weaknesses?.length ?? 0) + (e.suggestions?.length ?? 0) > 0

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-base">{e.project?.title ?? 'Project'}</p>
            {e.submission && (
              <p className="text-xs text-muted-foreground mt-0.5">Submission v{e.submission.version}</p>
            )}
          </div>
          <StatusBadge status={e.status} />
        </div>

        {/* Score summary row */}
        <div className="flex items-center gap-6 flex-wrap">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">AI Score</p>
            <ScoreBadge score={e.aiScore} size="lg" />
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Judge Score</p>
            <ScoreBadge score={e.judgeScore} size="md" />
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Final Score</p>
            <ScoreBadge score={e.finalScore} size="lg" />
          </div>
        </div>

        {/* Expand toggle — only if there's more to show */}
        {(hasSubScores || hasHighlights || e.feedback) && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setExpanded(x => !x)}
              className="flex items-center gap-1.5 text-xs font-medium text-orange-500 hover:text-orange-600 transition"
            >
              {expanded ? <><ChevronUp size={14} /> Hide details</> : <><ChevronDown size={14} /> View details</>}
            </button>
            <Link
              to="/student/evaluations/$evaluationId"
              params={{ evaluationId: e.id }}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-500 hover:text-blue-600 transition"
            >
              <ExternalLink size={13} /> Full Report
            </Link>
          </div>
        )}
        {/* If no details yet, still allow full report navigation */}
        {!(hasSubScores || hasHighlights || e.feedback) && (
          <Link
            to="/student/evaluations/$evaluationId"
            params={{ evaluationId: e.id }}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-500 hover:text-blue-600 transition"
          >
            <ExternalLink size={13} /> View Report
          </Link>
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t divide-y">

          {/* Sub-scores */}
          {hasSubScores && (
            <div className="p-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Score Breakdown (out of 10)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {SUB_SCORES.map(({ key, label }) =>
                  e[key] != null ? (
                    <div key={key} className="bg-muted/50 rounded-xl p-3 text-center">
                      <p className="text-[11px] text-muted-foreground mb-1.5">{label}</p>
                      <ScoreBadge score={e[key]} size="sm" />
                    </div>
                  ) : null
                )}
              </div>
            </div>
          )}

          {/* Strengths / Weaknesses / Suggestions */}
          {hasHighlights && (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {e.strengths && e.strengths.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2">✅ Strengths</p>
                  <ul className="space-y-1">
                    {e.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                        <span className="text-green-500 shrink-0">•</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {e.weaknesses && e.weaknesses.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-500 mb-2">⚠️ Weaknesses</p>
                  <ul className="space-y-1">
                    {e.weaknesses.map((w, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                        <span className="text-red-400 shrink-0">•</span>{w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {e.suggestions && e.suggestions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-blue-500 mb-2">💡 Suggestions</p>
                  <ul className="space-y-1">
                    {e.suggestions.map((s, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                        <span className="text-blue-400 shrink-0">•</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Detailed markdown feedback */}
          {e.feedback && (
            <div className="p-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Detailed AI Feedback</p>
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm
                [&>h1]:text-base [&>h1]:font-bold [&>h1]:mb-2
                [&>h2]:text-sm [&>h2]:font-semibold [&>h2]:mb-1.5 [&>h2]:mt-3
                [&>h3]:text-sm [&>h3]:font-medium [&>h3]:mb-1 [&>h3]:mt-2
                [&>p]:mb-2 [&>ul]:pl-4 [&>ul]:mb-2 [&>li]:mb-0.5
                [&>strong]:font-semibold">
                <ReactMarkdown>{e.feedback}</ReactMarkdown>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

function EvaluationsPage() {
  const [tab, setTab] = useState<EvaluationStatus | 'ALL'>('ALL')
  const { data = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.student.evaluations,
    queryFn: studentService.getMyEvaluations,
  })

  const filtered = tab === 'ALL' ? data : (data as Evaluation[]).filter(e => e.status === tab)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Evaluations</h2>
        <p className="text-sm text-muted-foreground">AI and judge scores for your submitted projects</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button key={t.value} onClick={() => setTab(t.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
              tab === t.value
                ? 'bg-gradient-to-r from-orange-500 to-pink-600 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
      ) : isError ? (
        <ErrorCard message={(error as Error)?.message} onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No evaluations" description="Submit a project to receive evaluation scores." />
      ) : (
        <div className="grid gap-4">
          {(filtered as Evaluation[]).map(e => <EvalCard key={e.id} e={e} />)}
        </div>
      )}
    </div>
  )
}
