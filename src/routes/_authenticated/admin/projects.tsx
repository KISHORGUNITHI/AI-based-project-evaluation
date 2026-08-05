import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Loader2, X, ExternalLink, ChevronDown, ChevronUp, Unlock, UserPlus, AlertCircle, Search, Clipboard, Play, Check } from 'lucide-react'
import { queryKeys } from '@/lib/queryKeys'
import { evaluationService } from '@/services/evaluationService'
import { adminService, type AdminProjectPipeline, type JudgeListItem } from '@/services/adminService'
import { ScoreBadge } from '@/components/shared/ScoreBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorCard } from '@/components/shared/ErrorCard'
import { EmptyState } from '@/components/shared/EmptyState'

export const Route = createFileRoute('/_authenticated/admin/projects')({ component: AdminProjects })

const STATUS_FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'EVALUATING', label: 'Evaluating' },
  { value: 'EVALUATED', label: 'Evaluated' },
]

// ── Custom Status Badge Component ──────────────────────────────────────────
function ProjectStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status as any} />
}

// ── Custom Score Badge Component ───────────────────────────────────────────
function ProjectScoreBadge({ score }: { score?: number | string | null }) {
  if (score == null) {
    return <span className="text-muted-foreground/50 text-sm">N/A</span>
  }
  const num = Number(score)
  if (num === 0) {
    return <span className="text-muted-foreground/30 text-sm">—</span>
  }
  return (
    <span className="inline-flex items-center bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900/30 rounded-lg px-2 py-0.5 text-sm font-bold tabular-nums">
      {num.toFixed(1)}
    </span>
  )
}

// ── Row Actions Dropdown ──────────────────────────────────────────────────
function RowActionsMenu({ onRunAi, onAssignJudge, onFinalize, onUnlock }: {
  onRunAi: () => void
  onAssignJudge: () => void
  onFinalize: () => void
  onUnlock: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v) }}
        className="text-slate-400 hover:text-orange-500 transition p-1.5 rounded-lg hover:bg-orange-50"
        title="More actions"
      >
        <span className="font-bold text-sm block px-1 leading-none">⋯</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-48 rounded-xl border border-border bg-card shadow-xl z-50 py-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onRunAi() }}
            className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-muted flex items-center gap-2"
          >
            <Play size={11} fill="currentColor" className="text-purple-500" /> Run AI Score
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onAssignJudge() }}
            className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-muted flex items-center gap-2"
          >
            <UserPlus size={11} className="text-blue-500" /> Assign Judge
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onFinalize() }}
            className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-muted flex items-center gap-2"
          >
            <Check size={11} strokeWidth={3} className="text-emerald-500" /> Finalize Score
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onUnlock() }}
            className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-muted flex items-center gap-2"
          >
            <Unlock size={11} className="text-amber-500" /> Unlock Resubmission
          </button>
        </div>
      )}
    </div>
  )
}
const getRowBorderClass = (status: string) => {
  switch (status) {
    case 'AI_COMPLETED':
      return 'border-l-2 border-purple-400'
    case 'COMPLETED':
      return 'border-l-2 border-emerald-400'
    case 'JUDGE_EVALUATING':
      return 'border-l-2 border-amber-400'
    case 'PENDING':
    case 'AI_EVALUATING':
      return 'border-l-2 border-blue-400'
    default:
      return 'border-l-2 border-border'
  }
}

// ── Project Detail Slide-out ────────────────────────────────────────────────
function ProjectDetailPanel({ project, onClose }: { project: AdminProjectPipeline; onClose: () => void }) {
  const [showAllSubs, setShowAllSubs] = useState(false)
  const latestEval = project.evaluations[0]
  const latestSub = project.submissions[0]
  const allSubs = project.submissions

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl bg-card border-l border-border shadow-2xl overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <h3 className="font-bold text-lg text-foreground truncate pr-4">{project.title}</h3>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5 flex-1">
          {/* Meta */}
          <div className="flex flex-wrap gap-3 items-center">
            {project.status && <ProjectStatusBadge status={project.status} />}
            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">{project.domain}</span>
            <span className="text-xs text-muted-foreground">Team: <strong className="text-foreground">{project.team.name}</strong></span>
          </div>

          {project.description && (
            <p className="text-sm text-foreground/80">{project.description}</p>
          )}

          {/* Evaluation pipeline */}
          {latestEval && (
            <div className="rounded-xl border border-border p-4 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Evaluation</p>
                <ProjectStatusBadge status={latestEval.status} />
              </div>
              <div className="flex gap-4 flex-wrap">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">AI Score</p>
                  <ScoreBadge score={latestEval.aiScore} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Judge Score</p>
                  <ScoreBadge score={latestEval.judgeScore} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Final Score</p>
                  <ScoreBadge score={latestEval.finalScore} size="lg" />
                </div>
              </div>
              {latestEval.judge && (
                <div className="text-xs text-foreground/80">
                  Judge: <strong className="text-foreground">{latestEval.judge.user.name}</strong>
                  {latestEval.judge.user.username && <span className="ml-1 text-muted-foreground">@{latestEval.judge.user.username}</span>}
                  {latestEval.judge.organization && <span className="ml-1 text-muted-foreground">· {latestEval.judge.organization}</span>}
                  {latestEval.judge.expertise && latestEval.judge.expertise.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {latestEval.judge.expertise.map(e => (
                        <span key={e} className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] border border-blue-100 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-900/30">{e}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Latest submission links */}
          {latestSub && (
            <div className="rounded-xl border border-border p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Latest Submission (v{latestSub.version})</p>
              <div className="flex flex-wrap gap-2">
                {latestSub.githubUrl && (
                  <a href={latestSub.githubUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-orange-500 hover:underline">
                    <ExternalLink size={11} /> GitHub
                  </a>
                )}
                {latestSub.reportUrl && (
                  <a href={latestSub.reportUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-orange-500 hover:underline">
                    <ExternalLink size={11} /> Report PDF
                  </a>
                )}
                {latestSub.pptUrl && (
                  <a href={latestSub.pptUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-orange-500 hover:underline">
                    <ExternalLink size={11} /> Slides
                  </a>
                )}
              </div>
              <ProjectStatusBadge status={latestSub.status} />
            </div>
          )}

          {/* All submissions */}
          {allSubs.length > 1 && (
            <div>
              <button onClick={() => setShowAllSubs(v => !v)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                {showAllSubs ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {showAllSubs ? 'Hide' : 'Show'} all {allSubs.length} submissions
              </button>
              {showAllSubs && (
                <div className="mt-2 space-y-1">
                  {allSubs.map(s => (
                    <div key={s.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/40">
                      <span className="font-medium text-foreground">v{s.version}</span>
                      <div className="flex items-center gap-2">
                        {s.githubUrl && <a href={s.githubUrl} target="_blank" rel="noreferrer" className="text-orange-500 hover:underline">GitHub</a>}
                        {s.reportUrl && <a href={s.reportUrl} target="_blank" rel="noreferrer" className="text-orange-500 hover:underline">Report</a>}
                        <ProjectStatusBadge status={s.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
function AdminProjects() {
  const qc = useQueryClient()
  const [selectedProject, setSelectedProject] = useState<AdminProjectPipeline | null>(null)
  const [finalizeId, setFinalizeId] = useState<string | null>(null)
  const [aiModal, setAiModal] = useState<{ evalId: string } | null>(null)
  const [assignModal, setAssignModal] = useState<{ evalId: string; domain: string } | null>(null)
  const [unlockId, setUnlockId] = useState<string | null>(null)
  const [aiScore, setAiScore] = useState('')
  const [aiFeedback, setAiFeedback] = useState('')
  const [selectedJudgeId, setSelectedJudgeId] = useState('')
  const [assignError, setAssignError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [creatingEval, setCreatingEval] = useState(false)

  // Opens the assign judge modal — creates eval record first if one doesn't exist yet
  const openAssignJudge = async (p: AdminProjectPipeline) => {
    const existingEvalId = p.evaluations[0]?.id
    if (existingEvalId) {
      setAssignModal({ evalId: existingEvalId, domain: p.domain })
      setSelectedJudgeId('')
      setAssignError(null)
      return
    }
    const latestSub = p.submissions[0]
    if (!latestSub) {
      toast.error('No submission found — student must submit before a judge can be assigned')
      return
    }
    try {
      setCreatingEval(true)
      const created = await evaluationService.create({ projectId: p.id, submissionId: latestSub.id })
      await invalidateProjects()
      setAssignModal({ evalId: created.id, domain: p.domain })
      setSelectedJudgeId('')
      setAssignError(null)
    } catch (e) {
      toast.error((e as Error).message ?? 'Failed to create evaluation')
    } finally {
      setCreatingEval(false)
    }
  }
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUBMITTED' | 'EVALUATING' | 'EVALUATED'>('ALL')

  const { data: projects = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.admin.projects,
    queryFn: adminService.getProjectsPipeline,
  })

  const { data: judges = [], isLoading: judgesLoading } = useQuery({
    queryKey: queryKeys.admin.judges,
    queryFn: adminService.getJudgesList,
    enabled: !!assignModal,
  })

  const invalidateProjects = () => qc.invalidateQueries({ queryKey: queryKeys.admin.projects })
  const invalidate = invalidateProjects

  const finalizeMut = useMutation({
    mutationFn: (evalId: string) => evaluationService.finalize(evalId),
    onSuccess: () => {
      invalidate()
      setFinalizeId(null)
      toast.success('Evaluation finalized!')
      if (selectedProject) {
        refetch().then(res => {
          const updated = res.data?.find(p => p.id === selectedProject.id)
          if (updated) setSelectedProject(updated)
        })
      }
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const aiScoreMut = useMutation({
    mutationFn: (data: { id: string; aiScore: number; feedback?: string }) =>
      evaluationService.setAiScore(data.id, { aiScore: data.aiScore, feedback: data.feedback }),
    onSuccess: () => {
      invalidate()
      setAiModal(null)
      toast.success('AI score set!')
      if (selectedProject) {
        refetch().then(res => {
          const updated = res.data?.find(p => p.id === selectedProject.id)
          if (updated) setSelectedProject(updated)
        })
      }
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const assignJudgeMut = useMutation({
    mutationFn: ({ evalId, judgeId }: { evalId: string; judgeId: string }) =>
      evaluationService.assignJudge(evalId, judgeId),
    onSuccess: () => {
      invalidate()
      setAssignModal(null)
      setSelectedJudgeId('')
      setAssignError(null)
      toast.success('Judge assigned successfully!')
      if (selectedProject) {
        refetch().then(res => {
          const updated = res.data?.find(p => p.id === selectedProject.id)
          if (updated) setSelectedProject(updated)
        })
      }
    },
    onError: (e: Error) => {
      setAssignError(e.message)
      toast.error(e.message)
    },
  })

  const unlockMut = useMutation({
    mutationFn: (projectId: string) => adminService.unlockResubmission(projectId),
    onSuccess: () => {
      invalidate()
      setUnlockId(null)
      toast.success('Resubmission unlocked!')
      if (selectedProject) {
        refetch().then(res => {
          const updated = res.data?.find(p => p.id === selectedProject.id)
          if (updated) setSelectedProject(updated)
        })
      }
    },
    onError: (e: Error) => toast.error(e.message),
  })

  // Filter projects by search query & status filters
  const filteredProjects = (projects as AdminProjectPipeline[]).filter(p => {
    const s = search.toLowerCase()
    const matchesSearch = p.title.toLowerCase().includes(s) || p.team.name.toLowerCase().includes(s)
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const renderPrimaryAction = (p: AdminProjectPipeline) => {
    const latestEval = p.evaluations[0]
    const evalId = latestEval?.id
    const status = latestEval?.status ?? 'PENDING'
    
    if (status === 'PENDING' || status === 'AI_EVALUATING') {
      if (!evalId) return <span className="text-[11px] text-muted-foreground italic">No submission</span>
      return (
        <button
          onClick={() => { setAiModal({ evalId }); setAiScore(''); setAiFeedback('') }}
          className="bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl px-4 py-2 hover:opacity-90 transition shadow-sm flex items-center gap-1"
        >
          <Play size={11} fill="currentColor" /> Run AI
        </button>
      )
    }
    if (status === 'AI_COMPLETED') {
      return (
        <button
          onClick={() => {
            setAssignModal({ evalId, domain: p.domain })
            setSelectedJudgeId('')
            setAssignError(null)
          }}
          className="bg-white border border-slate-200 text-slate-700 font-medium rounded-xl px-4 py-2 hover:border-orange-300 hover:text-orange-600 transition shadow-sm flex items-center gap-1"
        >
          <UserPlus size={11} /> Assign Judge
        </button>
      )
    }
    if (status === 'JUDGE_EVALUATING') {
      return (
        <button
          onClick={() => setFinalizeId(evalId)}
          className="bg-emerald-500 text-white font-semibold rounded-xl px-3 py-1.5 hover:bg-emerald-600 transition flex items-center gap-1"
        >
          <Check size={11} strokeWidth={3} /> Finalize
        </button>
      )
    }
    if (status === 'COMPLETED' || p.status === 'EVALUATED') {
      return (
        <button
          onClick={() => setUnlockId(p.id)}
          className="bg-white border border-slate-200 text-slate-700 font-medium rounded-xl px-4 py-2 hover:border-orange-300 hover:text-orange-600 transition shadow-sm flex items-center gap-1"
        >
          <Unlock size={11} /> Unlock
        </button>
      )
    }
    return null
  }

  if (isError) return <ErrorCard message={(error as Error)?.message} onRetry={refetch} />

  return (
    <div className="space-y-6">
      {/* Row 1: Header Title & Project Count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-pink-500 rounded-full shrink-0" />
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-foreground">Project Management</h2>
            <span className="bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900/30 rounded-full px-3 py-0.5 text-xs font-semibold shadow-sm">
              {filteredProjects.length} Projects
            </span>
          </div>
        </div>
        <div className="hidden sm:block" />
      </div>

      {/* Row 2: Search bar on left, status filters on right */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search
            size={13}
            className="absolute -translate-y-1/2 pointer-events-none left-3 top-1/2 text-muted-foreground animate-pulse"
            aria-hidden="true"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects or teams…"
            className="w-full rounded-xl border border-border bg-background py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value as 'ALL')}
              aria-pressed={statusFilter === value}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all border ${
                statusFilter === value
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white border-transparent shadow-sm'
                  : 'border-border bg-card text-muted-foreground hover:border-orange-200 hover:text-orange-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" /> Loading projects…
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border border-l-4 border-l-orange-400 dark:border-l-orange-500 shadow-sm p-12">
          <EmptyState 
            title="No projects yet" 
            description="Projects submitted by students will appear here" 
            icon={<Clipboard size={24} />} 
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm border-l-4 border-l-orange-400 dark:border-l-orange-500">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Project</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Team</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Eval</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Judge</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">AI</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Judge Score</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Final</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <Search size={20} />
                      </div>
                      <p className="font-semibold text-foreground">No projects match your search</p>
                      <p className="text-xs text-muted-foreground">Try a different project name or team</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProjects.map(p => {
                  const latestEval = p.evaluations[0]
                  const evalId = latestEval?.id
                  const evalStatus = latestEval?.status ?? 'PENDING'
                  const borderClass = getRowBorderClass(evalStatus)
                  
                  return (
                    <tr key={p.id}
                      className="border-b border-border last:border-0 hover:bg-orange-50/30 dark:hover:bg-orange-955/10 cursor-pointer transition-colors"
                      onClick={() => setSelectedProject(p)}>
                      <td className={`px-4 py-4 align-middle ${borderClass}`}>
                        <span className="text-sm font-bold text-foreground block max-w-[180px] truncate" title={p.title}>{p.title}</span>
                        <span className="text-xs text-muted-foreground block mt-0.5">{p.team.name}</span>
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <span className="text-xs text-muted-foreground block mt-0.5">{p.team.name}</span>
                      </td>
                      <td className="px-4 py-4 align-middle">
                        {p.status ? <ProjectStatusBadge status={p.status} /> : '—'}
                      </td>
                      <td className="px-4 py-4 align-middle">
                        {latestEval ? <ProjectStatusBadge status={latestEval.status} /> : <span className="text-muted-foreground/30">—</span>}
                      </td>
                      <td className="px-4 py-4 align-middle text-xs">
                        {latestEval?.judge ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm">
                              {latestEval.judge.user.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-foreground font-medium">{latestEval.judge.user.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-4 align-middle"><ProjectScoreBadge score={latestEval?.aiScore} /></td>
                      <td className="px-4 py-4 align-middle"><ProjectScoreBadge score={latestEval?.judgeScore} /></td>
                      <td className="px-4 py-4 align-middle"><ProjectScoreBadge score={latestEval?.finalScore} /></td>
                      <td className="px-4 py-4 align-middle" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          {renderPrimaryAction(p)}
                          {creatingEval ? (
                            <Loader2 size={14} className="animate-spin text-muted-foreground" />
                          ) : (
                            <RowActionsMenu
                              onRunAi={() => { if (evalId) { setAiModal({ evalId }); setAiScore(''); setAiFeedback('') } }}
                              onAssignJudge={() => openAssignJudge(p)}
                              onFinalize={() => { if (evalId) setFinalizeId(evalId) }}
                              onUnlock={() => setUnlockId(p.id)}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Project detail slide-out */}
      {selectedProject && (
        <ProjectDetailPanel project={selectedProject} onClose={() => setSelectedProject(null)} />
      )}

      {/* AI Score modal */}
      {aiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAiModal(null)} />
          <div className="relative z-10 bg-card border border-border rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-foreground">Set AI Score</h3>
              <button onClick={() => setAiModal(null)} className="rounded-full p-1.5 hover:bg-muted text-muted-foreground">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <input
                value={aiScore}
                onChange={e => setAiScore(e.target.value)}
                type="number" min={0} max={100}
                placeholder="Score (0–100)"
                className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              />
              <textarea
                value={aiFeedback}
                onChange={e => setAiFeedback(e.target.value)}
                placeholder="Feedback (optional)"
                rows={3}
                className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-orange-500 text-sm resize-none"
              />
            </div>
            <div className="flex gap-3 justify-end mt-4">
              <button
                onClick={() => setAiModal(null)}
                className="bg-white border border-slate-200 text-slate-700 font-medium rounded-xl px-4 py-2 hover:border-orange-300 hover:text-orange-600 transition">
                Cancel
              </button>
              <button
                disabled={aiScoreMut.isPending || !aiScore}
                onClick={() => aiScoreMut.mutate({ id: aiModal.evalId, aiScore: Number(aiScore), feedback: aiFeedback })}
                className="bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl px-4 py-2 hover:opacity-90 transition shadow-sm flex items-center gap-2 disabled:opacity-60">
                {aiScoreMut.isPending && <Loader2 size={14} className="animate-spin" />}
                Save Score
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finalize confirm */}
      <ConfirmDialog
        open={!!finalizeId}
        onOpenChange={() => setFinalizeId(null)}
        title="Finalize Evaluation"
        description="This will compute the final score (40% AI + 60% Judge) and mark evaluation as COMPLETED."
        onConfirm={() => finalizeId && finalizeMut.mutate(finalizeId)}
        isPending={finalizeMut.isPending}
        confirmLabel="Finalize"
        variant="default"
      />

      {/* Unlock resubmission confirm */}
      <ConfirmDialog
        open={!!unlockId}
        onOpenChange={() => setUnlockId(null)}
        title="Unlock Resubmission"
        description="This will mark the latest submission as REJECTED so the team can resubmit."
        onConfirm={() => unlockId && unlockMut.mutate(unlockId)}
        isPending={unlockMut.isPending}
        confirmLabel="Unlock"
        variant="default"
      />

      {/* Assign Judge modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setAssignModal(null); setAssignError(null) }} />
          <div className="relative z-10 bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-foreground">Assign Judge</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Domain: <span className="font-semibold text-orange-600 dark:text-orange-400">{assignModal.domain}</span>
                </p>
              </div>
              <button
                onClick={() => { setAssignModal(null); setAssignError(null) }}
                className="rounded-full p-1.5 hover:bg-muted text-muted-foreground">
                <X size={16} />
              </button>
            </div>

            {/* Error banner */}
            {assignError && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-55/20 border border-red-200 dark:border-red-900/30">
                <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-655 dark:text-red-400">{assignError}</p>
              </div>
            )}

            {/* Judge list */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {judgesLoading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 size={16} className="animate-spin" /> Loading judges…
                </div>
              ) : (judges as JudgeListItem[]).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No judges found. Create a judge first.</p>
              ) : (
                (judges as JudgeListItem[]).map(j => {
                  // The API returns User ID as top-level id; the judge profile id is in j.judge.id
                  const judgeProfileId = j.judge?.id ?? j.id
                  const displayName = j.name ?? j.user?.name
                  const displayUsername = j.username ?? j.user?.username
                  const displayOrg = j.organization ?? j.judge?.organization
                  const displayDesig = j.designation ?? j.judge?.designation
                  const displayExpertise = j.expertise?.length ? j.expertise : (j.judge?.expertise ?? [])
                  const assignedCount = j._count?.evaluations ?? j.judge?._count?.evaluations ?? 0
                  return (
                  <button
                    key={j.id}
                    onClick={() => setSelectedJudgeId(judgeProfileId)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border transition ${
                      selectedJudgeId === judgeProfileId
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300 font-semibold'
                        : 'border-border bg-card hover:bg-muted hover:border-orange-300 text-foreground'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {displayName}
                          {displayUsername && (
                            <span className="text-muted-foreground ml-1.5 text-xs font-normal">@{displayUsername}</span>
                          )}
                        </p>
                        {displayOrg && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {displayOrg}{displayDesig ? ` · ${displayDesig}` : ''}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {assignedCount} assigned
                      </span>
                    </div>
                    {displayExpertise.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {displayExpertise.map(e => (
                          <span
                            key={e}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                              e.toLowerCase() === assignModal.domain.toLowerCase()
                                ? 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-850/40'
                                : 'bg-muted text-muted-foreground border border-border'
                            }`}>
                            {e}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 justify-end pt-2 border-t border-border">
              <button
                onClick={() => { setAssignModal(null); setAssignError(null) }}
                className="bg-white border border-slate-200 text-slate-700 font-medium rounded-xl px-4 py-2 hover:border-orange-300 hover:text-orange-600 transition">
                Cancel
              </button>
              <button
                disabled={assignJudgeMut.isPending || !selectedJudgeId}
                onClick={() => {
                  setAssignError(null)
                  assignJudgeMut.mutate({ evalId: assignModal.evalId, judgeId: selectedJudgeId })
                }}
                className="bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl px-4 py-2 hover:opacity-90 transition shadow-sm flex items-center gap-2 disabled:opacity-50">
                {assignJudgeMut.isPending
                  ? <><Loader2 size={14} className="animate-spin" /> Assigning…</>
                  : <><UserPlus size={14} /> Assign Judge</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
