import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import { ArrowLeft, Bot, UserCheck, Star, FolderKanban, FileText, CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react'
import { evaluationService } from '@/services/evaluationService'
import { ScoreBadge } from '@/components/shared/ScoreBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ErrorCard } from '@/components/shared/ErrorCard'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/student/evaluations/$evaluationId')({
  component: EvaluationDetailPage,
})

const SUB_SCORES = [
  { key: 'problemStatementScore', label: 'Problem Statement', color: 'from-orange-500 to-pink-500' },
  { key: 'solutionDesignScore',   label: 'Solution Design',   color: 'from-pink-500 to-purple-500' },
  { key: 'implementationScore',   label: 'Implementation',    color: 'from-purple-500 to-indigo-500' },
  { key: 'innovationScore',       label: 'Innovation',        color: 'from-blue-500 to-cyan-500' },
  { key: 'documentationScore',    label: 'Documentation',     color: 'from-emerald-500 to-teal-500' },
] as const

function ScoreBar({ score, color }: { score?: number | null; color: string }) {
  const pct = score != null ? Math.min(100, Math.max(0, score * 10)) : 0
  return (
    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
      <div
        className={cn('h-full rounded-full bg-gradient-to-r transition-all', color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function EvaluationDetailPage() {
  const { evaluationId } = Route.useParams()

  const { data: evaluation, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['evaluation', evaluationId],
    queryFn: () => evaluationService.getById(evaluationId),
    enabled: !!evaluationId,
  })

  if (isLoading) return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-2xl border bg-card p-6 animate-pulse">
          <div className="h-4 bg-muted rounded w-1/3 mb-4" />
          <div className="h-3 bg-muted rounded w-2/3" />
        </div>
      ))}
    </div>
  )

  if (isError) return <ErrorCard message={(error as Error)?.message} onRetry={refetch} />
  if (!evaluation) return null

  const hasSubScores   = SUB_SCORES.some(s => evaluation[s.key] != null)
  const hasHighlights  = (evaluation.strengths?.length ?? 0) + (evaluation.weaknesses?.length ?? 0) + (evaluation.suggestions?.length ?? 0) > 0
  const judgeFeedback  = evaluation.feedback?.includes('Judge:')
    ? evaluation.feedback.replace(/^Judge:\s*/i, '')
    : null
  const aiFeedback     = evaluation.feedback && !judgeFeedback ? evaluation.feedback : null

  return (
    <div className="max-w-3xl space-y-6">

      {/* ── Back + header ── */}
      <div className="space-y-3">
        <Link
          to="/student/evaluations"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition w-fit"
        >
          <ArrowLeft size={15} /> Back to Evaluations
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{evaluation.project?.title ?? 'Evaluation Report'}</h2>
            {evaluation.submission && (
              <p className="text-sm text-muted-foreground mt-0.5">Submission v{evaluation.submission.version}</p>
            )}
          </div>
          <StatusBadge status={evaluation.status} />
        </div>
      </div>

      {/* ── Final score hero ── */}
      <div className="rounded-2xl bg-gradient-to-r from-orange-500 via-pink-500 to-pink-600 p-6 text-white">
        <div className="flex flex-col sm:flex-row items-center gap-6 justify-between">
          <div className="text-center sm:text-left space-y-1">
            <p className="text-sm text-white/80 font-medium uppercase tracking-wider">Final Score</p>
            <p className="text-6xl font-extrabold">
              {evaluation.finalScore != null ? Number(evaluation.finalScore).toFixed(1) : 'N/A'}
            </p>
            <p className="text-white/70 text-sm">out of 100</p>
          </div>
          <div className="flex gap-8 text-center">
            <div>
              <div className="flex items-center gap-1.5 justify-center mb-1">
                <Bot size={14} className="text-white/70" />
                <p className="text-xs text-white/70">AI Score</p>
              </div>
              <p className="text-3xl font-extrabold">{evaluation.aiScore ?? 'N/A'}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 justify-center mb-1">
                <UserCheck size={14} className="text-white/70" />
                <p className="text-xs text-white/70">Judge Score</p>
              </div>
              <p className="text-3xl font-extrabold">{evaluation.judgeScore ?? 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Link to project ── */}
      {evaluation.project && (
        <Link
          to="/student/projects/$projectId"
          params={{ projectId: evaluation.projectId }}
          className="flex items-center gap-2 w-fit px-4 py-2 rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-950/20 text-orange-600 text-sm font-medium hover:bg-orange-100 transition"
        >
          <FolderKanban size={15} /> View Project: {evaluation.project.title}
        </Link>
      )}

      {/* ── Rubric breakdown ── */}
      {hasSubScores && (
        <div className="rounded-2xl border bg-card p-6 space-y-5">
          <h3 className="font-bold flex items-center gap-2">
            <Star size={16} className="text-orange-500" /> Score Breakdown
            <span className="text-xs text-muted-foreground font-normal ml-1">(each out of 10)</span>
          </h3>
          <div className="space-y-4">
            {SUB_SCORES.map(({ key, label, color }) => {
              const score = evaluation[key]
              if (score == null) return null
              const numScore = Number(score)
              const pct = Math.round(numScore * 10)
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{numScore}/10</span>
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-semibold text-white bg-gradient-to-r',
                        color
                      )}>{pct}%</span>
                    </div>
                  </div>
                  <ScoreBar score={numScore} color={color} />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Strengths / Weaknesses / Suggestions ── */}
      {hasHighlights && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {evaluation.strengths && evaluation.strengths.length > 0 && (
            <div className="rounded-2xl border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 p-5 space-y-3">
              <h4 className="text-sm font-bold text-green-700 dark:text-green-400 flex items-center gap-2">
                <CheckCircle size={15} /> Strengths
              </h4>
              <ul className="space-y-2">
                {evaluation.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-green-800 dark:text-green-300 flex gap-2">
                    <span className="text-green-500 shrink-0 mt-0.5">•</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {evaluation.weaknesses && evaluation.weaknesses.length > 0 && (
            <div className="rounded-2xl border bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 p-5 space-y-3">
              <h4 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle size={15} /> Weaknesses
              </h4>
              <ul className="space-y-2">
                {evaluation.weaknesses.map((w, i) => (
                  <li key={i} className="text-xs text-red-800 dark:text-red-300 flex gap-2">
                    <span className="text-red-400 shrink-0 mt-0.5">•</span>{w}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {evaluation.suggestions && evaluation.suggestions.length > 0 && (
            <div className="rounded-2xl border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 p-5 space-y-3">
              <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <Lightbulb size={15} /> Suggestions
              </h4>
              <ul className="space-y-2">
                {evaluation.suggestions.map((s, i) => (
                  <li key={i} className="text-xs text-blue-800 dark:text-blue-300 flex gap-2">
                    <span className="text-blue-400 shrink-0 mt-0.5">•</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── AI Detailed Feedback ── */}
      {aiFeedback && (
        <div className="rounded-2xl border bg-card p-6 space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            <Bot size={16} className="text-orange-500" /> AI Detailed Feedback
          </h3>
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm
            [&>h1]:text-base [&>h1]:font-bold [&>h1]:mb-2
            [&>h2]:text-sm [&>h2]:font-semibold [&>h2]:mb-1.5 [&>h2]:mt-3
            [&>h3]:text-sm [&>h3]:font-medium [&>h3]:mb-1 [&>h3]:mt-2
            [&>p]:mb-2 [&>ul]:pl-4 [&>ul]:mb-2 [&>li]:mb-0.5
            [&>strong]:font-semibold bg-muted/30 rounded-xl p-4">
            <ReactMarkdown>{aiFeedback}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* ── Judge Feedback ── */}
      {judgeFeedback && (
        <div className="rounded-2xl border bg-card p-6 space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            <UserCheck size={16} className="text-blue-500" /> Judge Feedback
          </h3>
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {judgeFeedback}
            </p>
          </div>
          {evaluation.judgeScore != null && (
            <div className="flex items-center gap-3">
              <p className="text-xs text-muted-foreground">Judge Score:</p>
              <ScoreBadge score={evaluation.judgeScore} size="md" />
            </div>
          )}
        </div>
      )}

      {/* ── Empty state ── */}
      {!hasSubScores && !hasHighlights && !aiFeedback && !judgeFeedback && (
        <div className="rounded-2xl border bg-card p-10 text-center space-y-2">
          <FileText size={32} className="mx-auto text-muted-foreground/40" />
          <p className="text-sm font-semibold text-muted-foreground">Report not yet available</p>
          <p className="text-xs text-muted-foreground">The evaluation is still in progress. Check back once it's completed.</p>
        </div>
      )}

    </div>
  )
}
