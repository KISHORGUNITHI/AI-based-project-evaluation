import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import {
  ClipboardList,
  CheckCircle,
  Clock,
  ArrowRight,
  Search,
  SlidersHorizontal,
  Star,
} from 'lucide-react'
import { queryKeys }        from '@/lib/queryKeys'
import { judgeService }     from '@/services/judgeService'
import { useAuthStore }     from '@/store/authStore'
import { StatCard }         from '@/components/shared/StatCard'
import { StatusBadge }      from '@/components/shared/StatusBadge'
import { ScoreBadge }       from '@/components/shared/ScoreBadge'
import { EmptyState }       from '@/components/shared/EmptyState'
import { ErrorCard }        from '@/components/shared/ErrorCard'
import { DashboardSkeleton, SkeletonCard } from '@/components/shared/LoadingSkeleton'
import { cn }               from '@/lib/utils'
import type { Evaluation, EvaluationStatus } from '@/types/evaluation'

export const Route = createFileRoute('/_authenticated/judge/dashboard')({
  component: JudgeDashboard,
})

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssignedProject {
  projectId?: string
  id?:        string
  title?:     string
  team?:      string
  evaluationId?: string
  status?:    string
  aiScore?:   number | null
}

// ─── Completion Ring ──────────────────────────────────────────────────────────

function CompletionRing({ completed, total }: { completed: number; total: number }) {
  const pct   = total > 0 ? Math.round((completed / total) * 100) : 0
  const r     = 28
  const circ  = 2 * Math.PI * r
  const dash  = (pct / 100) * circ
  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#f1f5f9" strokeWidth="7" />
        <circle
          cx="36" cy="36" r={r} fill="none"
          stroke="url(#rg)" strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ / 4}
          style={{ transition: 'stroke-dasharray .5s ease' }}
        />
        <defs>
          <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <text x="36" y="40" textAnchor="middle" fontSize="14" fontWeight="600" fill="#0f172a">
          {pct}%
        </text>
      </svg>
      <p className="text-xs leading-tight text-center text-slate-500">
        {completed}/{total}<br />done
      </p>
    </div>
  )
}

// ─── Status filter pills ──────────────────────────────────────────────────────

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'ALL',              label: 'All'            },
  { value: 'JUDGE_EVALUATING', label: 'In Review'      },
  { value: 'AI_COMPLETED',     label: 'AI Done'        },
  { value: 'PENDING',          label: 'Pending'        },
  { value: 'COMPLETED',        label: 'Completed'      },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

function JudgeDashboard() {
  const user = useAuthStore((s) => s.user)

  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // ── Queries ────────────────────────────────────────────────────────────────

  const dashQ = useQuery({
    queryKey: queryKeys.judge.dashboard,
    queryFn:  judgeService.getDashboard,
  })

  const projQ = useQuery({
    queryKey: queryKeys.judge.assignedProjects,
    queryFn:  judgeService.getAssignedProjects,
  })

  const evalQ = useQuery({
    queryKey: queryKeys.judge.evaluations,
    queryFn:  judgeService.getEvaluations,
  })

  // ── Derived data ───────────────────────────────────────────────────────────

  const d = dashQ.data

  const allProjects: AssignedProject[] = useMemo(() => {
    if (!projQ.data) return []
    return Array.isArray(projQ.data)
      ? (projQ.data as AssignedProject[])
      : ((projQ.data as Record<string, unknown>).projects as AssignedProject[]) ?? []
  }, [projQ.data])

  const recentEvals: Evaluation[] = useMemo(() => {
    if (!evalQ.data) return []
    const arr = Array.isArray(evalQ.data) ? evalQ.data : []
    return (arr as Evaluation[])
      .filter((e) => e.status === 'COMPLETED' && e.judgeScore != null)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
  }, [evalQ.data])

  const filteredProjects: AssignedProject[] = useMemo(() => {
    const q = search.toLowerCase()
    return allProjects.filter((p) => {
      const matchSearch =
        !q ||
        (p.title ?? '').toLowerCase().includes(q) ||
        (p.team  ?? '').toLowerCase().includes(q)
      const matchStatus =
        statusFilter === 'ALL' || p.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [allProjects, search, statusFilter])

  const completedCount = useMemo(
    () => allProjects.filter((p) => p.status === 'COMPLETED').length,
    [allProjects],
  )

  // ── Loading / error ────────────────────────────────────────────────────────

  if (dashQ.isLoading) return <DashboardSkeleton />
  if (dashQ.isError)
    return <ErrorCard message={dashQ.error?.message} onRetry={dashQ.refetch} />

  const firstName = user?.name?.split(' ')[0] ?? 'Judge'

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Welcome banner ── */}
      <div className="relative p-6 overflow-hidden text-white shadow-sm rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 shadow-orange-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Welcome back, {firstName} 👋
            </h2>
            <p className="mt-1 text-sm text-white/80">
              {d?.pendingEvaluations
                ? `You have ${d.pendingEvaluations} pending review${d.pendingEvaluations > 1 ? 's' : ''} waiting.`
                : 'All caught up — no pending reviews right now.'}
            </p>
          </div>
          <Link
            to="/judge/reviews"
            search={{ projectId: undefined }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition border rounded-xl bg-white/20 hover:bg-white/30 border-white/30 backdrop-blur-sm"
          >
            Go to Reviews
            <ArrowRight size={15} />
          </Link>
        </div>
        {/* decorative blobs */}
        <div className="absolute w-40 h-40 rounded-full pointer-events-none -right-8 -top-8 bg-white/10" />
        <div className="absolute rounded-full pointer-events-none -bottom-6 right-24 h-28 w-28 bg-white/10" />
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Assigned Projects"
          value={d?.assignedProjects ?? 0}
          icon={ClipboardList}
          variant="blue"
          description="Total assigned to you"
        />
        <StatCard
          title="Pending Evaluations"
          value={d?.pendingEvaluations ?? 0}
          icon={Clock}
          variant="amber"
          description="Awaiting your review"
        />
        <StatCard
          title="Completed Evaluations"
          value={d?.completedEvaluations ?? 0}
          icon={CheckCircle}
          variant="green"
          description="Scores submitted"
        />
      </div>

      {/* ── Progress + Recent scores ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Completion progress */}
        <div className="p-5 bg-card border shadow-sm rounded-2xl border-border">
          <h3 className="mb-4 font-semibold text-foreground">Review progress</h3>
          <div className="flex items-center gap-6">
            <CompletionRing
              completed={completedCount}
              total={allProjects.length}
            />
            <div className="flex-1 space-y-2.5">
              {[
                { label: 'Completed',        count: allProjects.filter(p => p.status === 'COMPLETED').length,        color: 'bg-emerald-500' },
                { label: 'In review',        count: allProjects.filter(p => p.status === 'JUDGE_EVALUATING').length,  color: 'bg-purple-500'  },
                { label: 'AI done',          count: allProjects.filter(p => p.status === 'AI_COMPLETED').length,       color: 'bg-blue-500'    },
                { label: 'Pending',          count: allProjects.filter(p => p.status === 'PENDING').length,            color: 'bg-slate-300'   },
              ].map(({ label, count, color }) => (
                <div key={label} className="flex items-center gap-2.5 text-xs">
                  <span className={cn('h-2 w-2 rounded-full flex-shrink-0', color)} />
                  <span className="flex-1 text-muted-foreground">{label}</span>
                  <span className="font-semibold text-foreground tabular-nums">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent scores submitted */}
        <div className="p-5 bg-card border shadow-sm rounded-2xl border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Recent scores</h3>
            <Star size={15} className="text-amber-400" aria-hidden="true" />
          </div>
          {evalQ.isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>
          ) : recentEvals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No scores submitted yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {recentEvals.map((e) => (
                <li key={e.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground truncate max-w-[55%]">
                    {e.project?.title ?? 'Project'}
                  </span>
                  <div className="flex items-center flex-shrink-0 gap-2">
                    <ScoreBadge score={e.judgeScore} size="sm" />
                    <StatusBadge status={e.status as EvaluationStatus} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Pending reviews list ── */}
      <div className="overflow-hidden bg-card border shadow-sm rounded-2xl border-border">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">
            Assigned projects
            {allProjects.length > 0 && (
              <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {filteredProjects.length}/{allProjects.length}
              </span>
            )}
          </h3>

          {/* Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                size={13}
                className="absolute -translate-y-1/2 pointer-events-none left-3 top-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search project or team…"
                aria-label="Search assigned projects"
                className="w-48 rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition"
              />
            </div>
            <SlidersHorizontal size={13} className="text-slate-400" aria-hidden="true" />
          </div>
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1.5 px-5 py-3 border-b border-slate-100 flex-wrap">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              aria-pressed={statusFilter === value}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-all',
                statusFilter === value
                  ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-orange-200 hover:text-orange-600',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="p-4">
          {projQ.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : projQ.isError ? (
            <ErrorCard message={projQ.error?.message} onRetry={projQ.refetch} />
          ) : filteredProjects.length === 0 ? (
            <EmptyState
              title={search || statusFilter !== 'ALL' ? 'No matches found' : 'No assigned projects'}
              description={
                search || statusFilter !== 'ALL'
                  ? 'Try adjusting your search or filter.'
                  : 'You have no projects to review at the moment.'
              }
            />
          ) : (
            <ul className="space-y-2.5" role="list">
              {filteredProjects.map((p) => {
                const id = p.projectId ?? p.id ?? ''
                return (
                  <li
                    key={id}
                    className={cn(
                      'flex items-center justify-between rounded-xl border px-4 py-3 transition-colors',
                      p.status === 'COMPLETED'
                        ? 'border-emerald-500/20 bg-emerald-500/5'
                        : 'border-border bg-card hover:bg-muted/40',
                    )}
                  >
                    {/* Left — project info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-foreground">
                        {p.title ?? 'Untitled Project'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {p.team && (
                          <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {p.team}
                          </span>
                        )}
                        {p.aiScore != null && (
                          <span className="text-[11px] text-muted-foreground">
                            AI: <span className="font-medium text-foreground">{p.aiScore}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right — status + action */}
                    <div className="flex items-center flex-shrink-0 gap-3 ml-3">
                      {p.status && (
                        <StatusBadge status={p.status as EvaluationStatus} />
                      )}
                      {p.status !== 'COMPLETED' ? (
                        <Link
                          to="/judge/reviews"
                          search={{ projectId: id }}
                          aria-label={`Review ${p.title ?? 'project'}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-orange-600 hover:to-pink-600 transition"
                        >
                          Review
                          <ArrowRight size={12} />
                        </Link>
                      ) : (
                        <Link
                          to="/judge/reviews"
                          search={{ projectId: id }}
                          aria-label={`View ${p.title ?? 'project'}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-orange-300 hover:text-orange-600 transition"
                        >
                          View
                        </Link>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}