import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, Trophy, Medal, Award, Search, RefreshCw, LayoutList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { projectService } from '@/services/projectService'
import type { LeaderboardProject } from '@/services/projectService'
import { teamService } from '@/services/teamService'
import { SkeletonRow } from '@/components/shared/LoadingSkeleton'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import type { ProjectStatus } from '@/types/project'
import type { EvaluationStatus } from '@/types/evaluation'
import type { SubmissionStatus } from '@/types/submission'
import type { Team } from '@/types/team'

export const Route = createFileRoute('/_authenticated/student/leaderboard')({
  component: LeaderboardPage,
})

type SortKey = 'title' | 'status' | 'aiScore' | 'judgeScore' | 'finalScore'
type SortDir = 'asc' | 'desc'
type AnyStatus = ProjectStatus | EvaluationStatus | SubmissionStatus

interface LeaderboardRow extends LeaderboardProject {
  aiScore:    number | null
  judgeScore: number | null
  finalScore: number | null
  evalStatus?: string
  isCurrentUser?: boolean
}

const STATUS_CFG: Record<string, { label: string; dot: string; cls: string; pulse: boolean }> = {
  DRAFT:            { label: 'Draft',          dot: 'bg-slate-500',   cls: 'bg-gray-100  text-gray-800   ring-gray-300',    pulse: false },
  SUBMITTED:        { label: 'Submitted',       dot: 'bg-blue-500',    cls: 'bg-blue-100  text-blue-800   ring-blue-300',    pulse: false },
  EVALUATING:       { label: 'Evaluating',      dot: 'bg-amber-500',   cls: 'bg-amber-100 text-amber-800  ring-amber-300',   pulse: true  },
  EVALUATED:        { label: 'Evaluated',       dot: 'bg-emerald-500', cls: 'bg-emerald-100 text-emerald-800 ring-emerald-300', pulse: false },
  REJECTED:         { label: 'Rejected',        dot: 'bg-red-500',     cls: 'bg-red-100   text-red-800    ring-red-300',     pulse: false },
  PENDING:          { label: 'Pending',         dot: 'bg-slate-500',   cls: 'bg-gray-100  text-gray-800   ring-gray-300',    pulse: false },
  AI_EVALUATING:    { label: 'AI Evaluating',   dot: 'bg-blue-500',    cls: 'bg-blue-100  text-blue-800   ring-blue-300',    pulse: true  },
  AI_COMPLETED:     { label: 'AI Completed',    dot: 'bg-violet-500',  cls: 'bg-violet-100 text-violet-800 ring-violet-300',  pulse: false },
  JUDGE_EVALUATING: { label: 'Judge Reviewing', dot: 'bg-orange-500',  cls: 'bg-orange-100 text-orange-800 ring-orange-300',  pulse: true  },
  COMPLETED:        { label: 'Completed',       dot: 'bg-green-500',   cls: 'bg-green-100 text-green-800  ring-green-300',   pulse: false },
}

function StatusPill({ status }: { status: AnyStatus | string }) {
  const cfg = STATUS_CFG[status] ?? { label: status, dot: 'bg-slate-400', cls: 'bg-slate-100 text-slate-600 ring-slate-200', pulse: false }
  return (
    <Badge variant="outline" className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 border-0', cfg.cls)}>
      <span className={cn('h-1.5 w-1.5 flex-shrink-0 rounded-full', cfg.dot, cfg.pulse && 'animate-pulse')} />
      {cfg.label}
    </Badge>
  )
}

function scoreGradient(v: number) {
  if (v >= 90) return 'from-emerald-500 to-teal-500'
  if (v >= 75) return 'from-blue-500 to-indigo-500'
  if (v >= 50) return 'from-amber-400 to-orange-500'
  return 'from-red-500 to-rose-500'
}

function ScorePill({ score, size = 'sm' }: { score?: number | string | null; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'text-xs px-2.5 py-0.5 rounded-md font-semibold' : 'text-sm px-3 py-1 rounded-lg font-semibold'
  if (score == null) return <Badge variant="outline" className={cn('border-slate-200 bg-slate-100 text-slate-400', sz)}>N/A</Badge>
  const num = Number(score)
  return (
    <Badge className={cn('border-0 text-white shadow-sm tabular-nums bg-gradient-to-r', scoreGradient(num), sz)}>
      {num.toFixed(1)}
    </Badge>
  )
}

function ScoreBar({ score }: { score?: number | string | null }) {
  if (score == null) return null
  const pct = Math.min(100, Math.max(0, Number(score)))
  const fill = pct >= 90 ? 'from-emerald-400 to-teal-500' : pct >= 75 ? 'from-blue-400 to-indigo-500' : pct >= 50 ? 'from-amber-400 to-orange-500' : 'from-red-400 to-rose-500'
  return (
    <div className="mt-1.5 h-1 w-14 overflow-hidden rounded-full bg-slate-100">
      <div className={cn('h-full rounded-full bg-gradient-to-r', fill)} style={{ width: `${pct}%` }} />
    </div>
  )
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="flex items-center justify-center w-8 h-8 rounded-full shadow-sm bg-gradient-to-br from-yellow-300 to-amber-400"><Trophy size={14} className="text-white" /></span>
  if (rank === 2) return <span className="flex items-center justify-center w-8 h-8 rounded-full shadow-sm bg-gradient-to-br from-slate-300 to-slate-400"><Medal size={14} className="text-white" /></span>
  if (rank === 3) return <span className="flex items-center justify-center w-8 h-8 rounded-full shadow-sm bg-gradient-to-br from-amber-500 to-orange-500"><Award size={14} className="text-white" /></span>
  return <span className="flex items-center justify-center w-8 h-8 text-xs font-semibold rounded-full bg-slate-100 text-slate-500">{rank}</span>
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown size={12} className="opacity-30" />
  return dir === 'asc' ? <ChevronUp size={12} className="text-orange-500" /> : <ChevronDown size={12} className="text-orange-500" />
}

const SORT_OPTIONS: { k: SortKey; label: string }[] = [
  { k: 'finalScore', label: 'Final Score' },
  { k: 'aiScore',    label: 'AI Score'    },
  { k: 'judgeScore', label: 'Judge Score' },
  { k: 'title',      label: 'Name'        },
  { k: 'status',     label: 'Status'      },
]

function LeaderboardPage() {
  const user = useAuthStore(s => s.user)
  const [search, setSearch]   = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('finalScore')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // Single call — backend returns projects with evaluations[0] scores included
  const { data: projects = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['leaderboard'],
    queryFn:  projectService.getLeaderboard,
    staleTime: 30_000,
  })

  const { data: myTeams = [] } = useQuery<Team[]>({
    queryKey: ['teams', 'my'],
    queryFn:  teamService.getMy,
    enabled:  user != null,
  })

  const myTeamIds = useMemo<Set<string>>(
    () => new Set((myTeams as Team[]).filter(t => t.members?.some((m: any) => m.studentId === user?.id)).map(t => t.id)),
    [myTeams, user],
  )

  // Flatten evaluations[0] scores into each row
  const rows: LeaderboardRow[] = useMemo(
    () => (projects as LeaderboardProject[]).map(p => {
      const ev = p.evaluations?.[0] ?? null
      return {
        ...p,
        aiScore:       ev?.aiScore    != null ? Number(ev.aiScore)    : null,
        judgeScore:    ev?.judgeScore != null ? Number(ev.judgeScore) : null,
        finalScore:    ev?.finalScore != null ? Number(ev.finalScore) : null,
        evalStatus:    ev?.status,
        isCurrentUser: user != null && myTeamIds.has(p.teamId),
      }
    }),
    [projects, myTeamIds, user],
  )

  const sorted: LeaderboardRow[] = useMemo(() => {
    const q = search.toLowerCase()
    const filtered = rows.filter(p =>
      p.title.toLowerCase().includes(q) || (p.team?.name ?? '').toLowerCase().includes(q)
    )
    return [...filtered].sort((a, b) => {
      const va = sortKey === 'aiScore' ? a.aiScore : sortKey === 'judgeScore' ? a.judgeScore : sortKey === 'finalScore' ? a.finalScore : (a[sortKey as keyof LeaderboardRow] ?? '')
      const vb = sortKey === 'aiScore' ? b.aiScore : sortKey === 'judgeScore' ? b.judgeScore : sortKey === 'finalScore' ? b.finalScore : (b[sortKey as keyof LeaderboardRow] ?? '')
      if (va == null && vb == null) return 0
      if (va == null) return 1
      if (vb == null) return -1
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [rows, search, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir(['aiScore', 'judgeScore', 'finalScore'].includes(key) ? 'desc' : 'asc') }
  }

  const Th = ({ label, k, align = 'left' }: { label: string; k: SortKey; align?: 'left' | 'right' }) => (
    <th onClick={() => toggleSort(k)}
      className={cn('px-4 py-3 text-xs font-semibold tracking-wide cursor-pointer select-none transition-colors text-slate-400 hover:text-slate-700 whitespace-nowrap', align === 'right' && 'text-right', sortKey === k && 'text-orange-500')}>
      <span className={cn('inline-flex items-center gap-1', align === 'right' && 'flex-row-reverse')}>
        {label}<SortIcon active={sortKey === k} dir={sortDir} />
      </span>
    </th>
  )

  if (isError) return (
    <div className="flex flex-col items-center justify-center gap-4 text-center border border-red-100 shadow-sm rounded-2xl bg-red-50 p-14">
      <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full"><RefreshCw size={20} className="text-red-500" /></div>
      <div>
        <p className="text-sm font-semibold text-red-700">Failed to load leaderboard</p>
        <p className="mt-1 text-xs text-red-500">{(error as Error)?.message}</p>
      </div>
      <Button size="sm" onClick={() => refetch()} className="text-white border-0 shadow-sm bg-gradient-to-r from-orange-500 to-pink-500">
        <RefreshCw size={13} /> Try again
      </Button>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center shadow-sm h-9 w-9 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500">
              <Trophy size={16} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">Leaderboard</h1>
          </div>
          <p className="mt-1 text-sm ml-11 text-slate-500">All projects ranked by evaluation scores</p>
        </div>
        {user && (
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1.5 text-xs font-medium text-orange-600 shadow-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" />
            Your team rows are highlighted
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search project or team…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm shadow-sm outline-none focus:ring-2 focus:ring-orange-300" />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-slate-400">Sort by</span>
          {SORT_OPTIONS.map(({ k, label }) => (
            <Button key={k} size="sm" variant={sortKey === k ? 'default' : 'outline'} onClick={() => toggleSort(k)}
              className={cn('h-7 rounded-full px-3 text-xs gap-1 font-medium transition-all',
                sortKey === k ? 'border-0 bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-sm hover:from-orange-600 hover:to-pink-600'
                             : 'border-slate-200 bg-white text-slate-600 shadow-sm hover:border-orange-200 hover:text-orange-600')}>
              {label}<SortIcon active={sortKey === k} dir={sortDir} />
            </Button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden bg-white border shadow-sm rounded-2xl border-slate-200">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <LayoutList size={13} />
            {isLoading ? 'Loading…' : `${sorted.length} project${sorted.length !== 1 ? 's' : ''}`}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 w-12">#</th>
                <Th label="Project"     k="title"      />
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Team</th>
                <Th label="Status"      k="status"     />
                <Th label="AI Score"    k="aiScore"    align="right" />
                <Th label="Judge Score" k="judgeScore" align="right" />
                <Th label="Final Score" k="finalScore" align="right" />
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b"><td colSpan={7} className="p-0"><SkeletonRow /></td></tr>
                  ))
                : sorted.map((p, i) => (
                    <tr key={p.id} className={cn('border-b last:border-0 transition-colors',
                      p.isCurrentUser ? 'border-l-[3px] border-l-orange-400 bg-orange-50/60 hover:bg-orange-50' : 'hover:bg-slate-50/80')}>
                      <td className="px-4 py-3.5"><RankBadge rank={i + 1} /></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{p.title}</span>
                          {p.isCurrentUser && <Badge className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600 ring-1 ring-orange-200 border-0">You</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant="secondary" className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 border-0">{p.team?.name ?? '—'}</Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        {p.evalStatus
                          ? <StatusPill status={p.evalStatus} />
                          : p.status
                          ? <StatusPill status={p.status} />
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <ScorePill score={p.aiScore} size="sm" />
                        <div className="flex justify-end"><ScoreBar score={p.aiScore} /></div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <ScorePill score={p.judgeScore} size="sm" />
                        <div className="flex justify-end"><ScoreBar score={p.judgeScore} /></div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <ScorePill score={p.finalScore} size="md" />
                        <div className="flex justify-end"><ScoreBar score={p.finalScore} /></div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
          {!isLoading && sorted.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100"><Search size={20} className="text-slate-400" /></div>
              <div>
                <p className="text-sm font-semibold text-slate-600">No projects found</p>
                <p className="mt-0.5 text-xs text-slate-400">Try adjusting your search term</p>
              </div>
              <button onClick={() => setSearch('')} className="text-xs font-medium text-orange-500 underline">Clear search</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
