import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Loader2, Sparkles, SlidersHorizontal, AlertCircle,
  CheckCircle2, Circle, FileText, Presentation,
  ExternalLink, ChevronDown, ChevronUp, Star, Send,
} from 'lucide-react'
import { z } from 'zod'
import { queryKeys } from '@/lib/queryKeys'
import { judgeService } from '@/services/judgeService'
import { evaluationService } from '@/services/evaluationService'
import { judgeScoringSchema } from '@/lib/validations/evaluationSchemas'
import { ScoreBadge } from '@/components/shared/ScoreBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ErrorCard } from '@/components/shared/ErrorCard'
import { EmptyState } from '@/components/shared/EmptyState'
import type { z as ZodType } from 'zod'
import type { EvaluationStatus } from '@/types/evaluation'
import ReactMarkdown from 'react-markdown'

import { API_BASE_URL } from '@/lib/api'
const resolveUrl = (url?: string) =>
  url?.startsWith('/uploads/') ? `${API_BASE_URL}${url}` : url

const Github = ({ size = 24, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
)

export const Route = createFileRoute('/_authenticated/judge/reviews')({
  validateSearch: (s: Record<string, unknown>) => ({
    projectId: typeof s.projectId === 'string' ? s.projectId : undefined,
  }),
  component: ReviewsPage,
})

type ScoringForm = ZodType.infer<typeof judgeScoringSchema>

const rubricSchema = z.object({
  rubricProblemStatement: z.coerce.number().int().min(1).max(100),
  rubricSolutionDesign: z.coerce.number().int().min(1).max(100),
  rubricImplementation: z.coerce.number().int().min(1).max(100),
  rubricInnovation: z.coerce.number().int().min(1).max(100),
  rubricDocumentation: z.coerce.number().int().min(1).max(100),
}).refine(
  d => d.rubricProblemStatement + d.rubricSolutionDesign + d.rubricImplementation
    + d.rubricInnovation + d.rubricDocumentation === 100,
  { message: 'Weights must sum to 100', path: ['rubricProblemStatement'] },
)
type RubricForm = z.infer<typeof rubricSchema>

type EvalWithRubric = {
  id: string; status: EvaluationStatus; aiScore?: number; judgeScore?: number
  finalScore?: number; feedback?: string; projectId?: string
  rubricProblemStatement: number; rubricSolutionDesign: number
  rubricImplementation: number; rubricInnovation: number; rubricDocumentation: number
  rubricSetByJudge: boolean
  problemStatementScore?: number; solutionDesignScore?: number
  implementationScore?: number; innovationScore?: number; documentationScore?: number
  strengths?: string[]; weaknesses?: string[]; suggestions?: string[]
}

type StepStatus = 'idle' | 'started' | 'done' | 'skipped' | 'failed'

const AI_STEPS = [
  { key: 'PDF Extraction', label: 'Extract PDF' },
  { key: 'PPT Analysis', label: 'Parse Slides' },
  { key: 'GitHub Analysis', label: 'Analyze GitHub' },
  { key: 'Document Analysis', label: 'Doc Agent' },
  { key: 'Code Analysis', label: 'Code Agent' },
  { key: 'AI Scoring', label: 'Score' },
  { key: 'Validation', label: 'Validate' },
  { key: 'Saving Results', label: 'Save' },
]

// ── Small helper components ──────────────────────────────────────────────────

function PipelineStatus({ steps }: { steps: Record<string, StepStatus> }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {AI_STEPS.map(({ key, label }, i) => {
        const s = steps[key] ?? 'idle'
        return (
          <div key={key} className="flex items-center gap-1">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${s === 'done' || s === 'skipped' ? 'bg-green-100 text-green-700' :
              s === 'started' ? 'bg-orange-100 text-orange-600 animate-pulse' :
                s === 'failed' ? 'bg-red-100 text-red-600' :
                  'bg-muted text-muted-foreground'
              }`}>
              {s === 'done' || s === 'skipped' ? <CheckCircle2 size={11} /> :
                s === 'started' ? <Loader2 size={11} className="animate-spin" /> :
                  <Circle size={11} />}
              <span>{label}</span>
            </div>
            {i < AI_STEPS.length - 1 && <span className="text-muted-foreground/30 text-xs">›</span>}
          </div>
        )
      })}
    </div>
  )
}

function FileLinks({ sub }: { sub: { version: number; githubUrl?: string; reportUrl?: string; pptUrl?: string; videoUrl?: string } }) {
  const links = [
    { url: sub.githubUrl, label: 'GitHub', icon: Github, iconColor: 'text-slate-700' },
    { url: resolveUrl(sub.reportUrl), label: 'PDF Report', icon: FileText, iconColor: 'text-red-500' },
    { url: resolveUrl(sub.pptUrl), label: 'Slides', icon: Presentation, iconColor: 'text-orange-500' },
    { url: resolveUrl(sub.videoUrl), label: 'Video', icon: ExternalLink, iconColor: 'text-purple-500' },
  ].filter(l => l.url)

  if (!links.length) return <p className="text-xs text-muted-foreground italic">No files uploaded</p>

  return (
    <div className="flex flex-wrap gap-2">
      {links.map(({ url, label, icon: Icon, iconColor }) => (
        <a key={label} href={url} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-orange-300 hover:text-orange-600 text-xs font-medium transition shadow-sm">
          <Icon size={12} className={iconColor} /> {label}
        </a>
      ))}
    </div>
  )
}

function RubricSlider({ label, name, register, value }: {
  label: string; name: keyof RubricForm
  register: ReturnType<typeof useForm<RubricForm>>['register']
  value: number
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className="font-bold text-orange-500 tabular-nums">{value}%</span>
      </div>
      <input {...register(name)} type="range" min={0} max={100} step={5}
        className="w-full h-1.5 bg-muted rounded-full accent-orange-500 cursor-pointer" />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

function ReviewsPage() {
  const qc = useQueryClient()
  const { projectId: initId } = Route.useSearch()
  const [selectedId, setSelectedId] = useState<string | null>(initId ?? null)
  const [showRubric, setShowRubric] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [aiRunning, setAiRunning] = useState(false)
  const [aiSteps, setAiSteps] = useState<Record<string, StepStatus>>({})
  const [activeFileTab, setActiveFileTab] = useState<'pdf' | 'ppt' | 'github'>('pdf')

  const projectsQ = useQuery({ queryKey: queryKeys.judge.projects, queryFn: judgeService.getProjects })
  const projects = projectsQ.data as Array<{ id: string; title?: string; status?: string }> ?? []
  const selected = projects.find(p => p.id === selectedId)

  const subsQ = useQuery({
    queryKey: queryKeys.judge.submissions(selectedId ?? ''),
    queryFn: () => judgeService.getSubmissions(selectedId!),
    enabled: !!selectedId,
  })
  const latestSub = (subsQ.data as Array<{ id: string; version: number; githubUrl?: string; reportUrl?: string; pptUrl?: string; videoUrl?: string; status?: string }> ?? [])[0]

  useEffect(() => {
    if (latestSub) {
      if (latestSub.reportUrl) setActiveFileTab('pdf')
      else if (latestSub.pptUrl) setActiveFileTab('ppt')
      else if (latestSub.githubUrl) setActiveFileTab('github')
    }
  }, [latestSub?.id])

  const evalQ = useQuery({
    queryKey: queryKeys.judge.evaluations,
    queryFn: judgeService.getEvaluations,
    enabled: !!selectedId,
    staleTime: 0,
  })
  const evals = (Array.isArray(evalQ.data) ? evalQ.data : ((evalQ.data as unknown as Record<string, unknown>)?.evaluations ?? [])) as EvalWithRubric[]
  const currentEval = evals.find(e => e.projectId === selectedId)
  const isCompleted = currentEval?.status === 'COMPLETED'
  const aiDone = ['AI_COMPLETED', 'COMPLETED'].includes(currentEval?.status ?? '')

  // Forms
  const scoreForm = useForm<ScoringForm>({
    resolver: zodResolver(judgeScoringSchema),
    defaultValues: { judgeScore: 0, feedback: '' },
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rubricForm = useForm<RubricForm>({
    resolver: zodResolver(rubricSchema) as any,
    defaultValues: { rubricProblemStatement: 20, rubricSolutionDesign: 20, rubricImplementation: 25, rubricInnovation: 20, rubricDocumentation: 15 }
  })
  const rv = rubricForm.watch()
  const rubricTotal = (rv.rubricProblemStatement ?? 0) + (rv.rubricSolutionDesign ?? 0) + (rv.rubricImplementation ?? 0) + (rv.rubricInnovation ?? 0) + (rv.rubricDocumentation ?? 0)

  useEffect(() => {
    if (!currentEval) return
    scoreForm.reset({
      judgeScore: currentEval.judgeScore ?? 0,
      feedback: (() => {
        if (!currentEval.feedback) return ''
        const idx = currentEval.feedback.indexOf('\n\nJudge: ')
        if (idx !== -1) {
          return currentEval.feedback.substring(idx + 10)
        }
        if (currentEval.feedback.startsWith('Judge: ')) {
          return currentEval.feedback.substring(7)
        }
        return ''
      })(),
    })
    rubricForm.reset({
      rubricProblemStatement: currentEval.rubricProblemStatement ?? 20,
      rubricSolutionDesign: currentEval.rubricSolutionDesign ?? 20,
      rubricImplementation: currentEval.rubricImplementation ?? 25,
      rubricInnovation: currentEval.rubricInnovation ?? 20,
      rubricDocumentation: currentEval.rubricDocumentation ?? 15,
    })
  }, [currentEval?.id])

  const saveRubric = useMutation({
    mutationFn: (d: RubricForm) => evaluationService.setRubric(currentEval!.id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.judge.evaluations })
      setShowRubric(false)
      toast.success('Rubric saved')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const submitScore = useMutation({
    mutationFn: (d: ScoringForm) => judgeService.submitScore(currentEval!.id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.judge.evaluations })
      qc.invalidateQueries({ queryKey: queryKeys.judge.projects })
      toast.success('Score submitted!')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  async function runAi() {
    if (!currentEval) return
    setAiRunning(true); setAiSteps({})
    try {
      await evaluationService.triggerAiEvaluation(currentEval.id, ev => {
        if (ev.step && ev.status) setAiSteps(p => ({ ...p, [ev.step]: ev.status as StepStatus }))
      })
      qc.invalidateQueries({ queryKey: queryKeys.judge.evaluations })
      qc.invalidateQueries({ queryKey: queryKeys.judge.projects })
      toast.success('AI evaluation complete!')
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'AI failed') }
    finally { setAiRunning(false) }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col gap-0">
      {/* Top bar */}
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-2xl font-bold tracking-tight">Reviews</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Review submissions and score projects</p>
      </div>

      <div className="flex flex-1 overflow-hidden px-6 pb-6 gap-4">

        {/* ── Left sidebar: project list ──────────────────────────────── */}
        <div className="w-64 shrink-0 rounded-2xl border bg-card flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Assigned Projects</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {projectsQ.isLoading ? (
              <p className="text-xs text-muted-foreground p-3">Loading…</p>
            ) : projects.length === 0 ? (
              <EmptyState title="No projects" description="Nothing assigned yet." />
            ) : projects.map(p => (
              <button key={p.id}
                onClick={() => { setSelectedId(p.id); setShowRubric(false); setShowHistory(false); setShowFeedback(false) }}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all text-sm ${selectedId === p.id
                  ? 'bg-gradient-to-r from-orange-50 to-pink-50 text-orange-600 font-semibold ring-1 ring-orange-200'
                  : 'hover:bg-muted/60 text-foreground'
                  }`}>
                <p className="truncate">{p.title ?? 'Project'}</p>
                {p.status && <p className="text-[10px] text-muted-foreground mt-0.5">{p.status}</p>}
              </button>
            ))}
          </div>
        </div>

        {/* ── Main content ────────────────────────────────────────────── */}
        <div className="flex-1 flex gap-4 overflow-hidden">
          {!selected ? (
            <div className="flex-1 rounded-2xl border bg-card h-64 flex items-center justify-center">
              <div className="text-center space-y-2">
                <Star size={32} className="mx-auto text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Select a project from the list</p>
              </div>
            </div>
          ) : (
            <>
              {/* Left Sub-column: Workflow and Scoring */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* ── Project header card ──────────────────────────── */}
                <div className="rounded-2xl border bg-card p-5 space-y-4">
                  {/* Title + status */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold">{selected.title}</h3>
                      {latestSub && <p className="text-xs text-muted-foreground mt-0.5">Submission v{latestSub.version}</p>}
                    </div>
                    {currentEval && <StatusBadge status={currentEval.status} />}
                  </div>

                  {/* Scores */}
                  {currentEval && (
                    <div className="flex gap-6 flex-wrap">
                      {[
                        { label: 'AI Score', score: currentEval.aiScore, variant: 'ai' as const },
                        { label: 'Judge Score', score: currentEval.judgeScore, variant: 'judge' as const },
                        { label: 'Final Score', score: currentEval.finalScore, variant: 'final' as const },
                      ].map(({ label, score, variant }) => (
                        <div key={label}>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">{label}</p>
                          <ScoreBadge score={score} variant={variant} className="rounded-xl px-3 py-1 text-sm font-semibold" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* File links */}
                  {latestSub && (
                    <div className="border-t pt-3 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">Submission Files</p>
                      <FileLinks sub={latestSub} />
                    </div>
                  )}
                </div>

                {/* ── Workflow steps indicator ─────────────────────── */}
                {currentEval && (
                  <div className="flex items-center gap-3 px-1">
                    {[
                      { n: 1, label: 'Set Rubric', done: currentEval.rubricSetByJudge },
                      { n: 2, label: 'Run AI', done: aiDone },
                      { n: 3, label: 'Submit Score', done: isCompleted },
                    ].map(({ n, label, done }, i) => (
                      <div key={n} className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${done ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                          {done ? '✓' : n}
                        </div>
                        <span className={`text-xs ${done ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>{label}</span>
                        {i < 2 && <div className="w-8 h-px bg-border" />}
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Step 1: Rubric ───────────────────────────────── */}
                {currentEval && !isCompleted && (
                  <div className="rounded-2xl border bg-card overflow-hidden">
                    <button onClick={() => setShowRubric(r => !r)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xl bg-orange-100 flex items-center justify-center">
                          <SlidersHorizontal size={14} className="text-orange-500" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold">Evaluation Rubric</p>
                          <p className="text-xs text-muted-foreground">
                            {currentEval.rubricSetByJudge ? 'Rubric saved ✓' : 'Set weights before running AI'}
                          </p>
                        </div>
                      </div>
                      {showRubric ? <ChevronUp size={15} className="text-muted-foreground" /> : <ChevronDown size={15} className="text-muted-foreground" />}
                    </button>

                    {showRubric && (
                      <form onSubmit={rubricForm.handleSubmit(d => saveRubric.mutate(d as RubricForm))}
                        className="px-5 pb-5 space-y-4 border-t">
                        <div className="pt-4 space-y-3">
                          <RubricSlider label="Problem Statement" name="rubricProblemStatement" register={rubricForm.register} value={rv.rubricProblemStatement ?? 0} />
                          <RubricSlider label="Solution Design" name="rubricSolutionDesign" register={rubricForm.register} value={rv.rubricSolutionDesign ?? 0} />
                          <RubricSlider label="Implementation" name="rubricImplementation" register={rubricForm.register} value={rv.rubricImplementation ?? 0} />
                          <RubricSlider label="Innovation" name="rubricInnovation" register={rubricForm.register} value={rv.rubricInnovation ?? 0} />
                          <RubricSlider label="Documentation" name="rubricDocumentation" register={rubricForm.register} value={rv.rubricDocumentation ?? 0} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-semibold ${rubricTotal === 100 ? 'text-green-600' : 'text-red-500'}`}>
                            Total: {rubricTotal}/100 {rubricTotal === 100 ? '✓' : '← must equal 100'}
                          </span>
                          <button type="submit" disabled={saveRubric.isPending || rubricTotal !== 100}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 text-xs font-semibold transition disabled:opacity-50">
                            {saveRubric.isPending && <Loader2 size={12} className="animate-spin" />} Save Rubric
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* ── Step 2: AI Analysis ──────────────────────────── */}
                {currentEval && !aiDone && (
                  <div className="rounded-2xl border bg-card p-5 space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-pink-100 flex items-center justify-center">
                        <Sparkles size={14} className="text-pink-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Run AI Analysis</p>
                        <p className="text-xs text-muted-foreground">Reads PDF, slides, GitHub → multi-agent pipeline</p>
                      </div>
                    </div>

                    {!currentEval.rubricSetByJudge && (
                      <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2.5 rounded-xl">
                        <AlertCircle size={13} /> Save the rubric above before running AI
                      </div>
                    )}

                    {aiRunning && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pipeline</p>
                        <PipelineStatus steps={aiSteps} />
                      </div>
                    )}

                    <button onClick={runAi} disabled={aiRunning || !currentEval.rubricSetByJudge}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200 text-sm font-semibold transition disabled:opacity-50">
                      {aiRunning ? <><Loader2 size={14} className="animate-spin" /> Analyzing…</> : <><Sparkles size={14} /> Run AI Evaluation</>}
                    </button>
                  </div>
                )}

                {/* Pipeline completed badge */}
                {currentEval && aiDone && Object.keys(aiSteps).length > 0 && (
                  <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-green-600" />
                      <p className="text-xs font-semibold text-green-700">AI Pipeline Completed</p>
                    </div>
                    <PipelineStatus steps={aiSteps} />
                  </div>
                )}

                {/* ── AI Results ───────────────────────────────────── */}
                {currentEval && aiDone && currentEval.feedback && (
                  <div className="rounded-2xl border bg-card overflow-hidden">
                    <button onClick={() => setShowFeedback(f => !f)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xl bg-purple-100 flex items-center justify-center">
                          <Sparkles size={14} className="text-purple-500" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold">AI Evaluation Results</p>
                          {currentEval.aiScore != null && (
                            <p className="text-xs text-muted-foreground">AI Score: {currentEval.aiScore}</p>
                          )}
                        </div>
                      </div>
                      {showFeedback ? <ChevronUp size={15} className="text-muted-foreground" /> : <ChevronDown size={15} className="text-muted-foreground" />}
                    </button>

                    {showFeedback && (
                      <div className="border-t px-5 py-4 space-y-4">
                        {/* Sub-scores */}
                        {currentEval.problemStatementScore != null && (
                          <div className="grid grid-cols-5 gap-2">
                            {[
                              ['Problem', currentEval.problemStatementScore],
                              ['Design', currentEval.solutionDesignScore],
                              ['Code', currentEval.implementationScore],
                              ['Innov.', currentEval.innovationScore],
                              ['Docs', currentEval.documentationScore],
                            ].map(([l, s]) => (
                              <div key={String(l)} className="text-center bg-muted/40 rounded-xl p-2">
                                <p className="text-[10px] text-muted-foreground mb-1">{l}</p>
                                <p className="text-sm font-bold">{s ?? '—'}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Strengths / Weaknesses */}
                        {((currentEval.strengths?.length ?? 0) > 0 || (currentEval.weaknesses?.length ?? 0) > 0) && (
                          <div className="grid grid-cols-2 gap-3">
                            {currentEval.strengths && currentEval.strengths.length > 0 && (
                              <div className="bg-green-50 rounded-xl p-3">
                                <p className="text-xs font-semibold text-green-600 mb-1.5">✅ Strengths</p>
                                <ul className="space-y-1">{currentEval.strengths.map((s, i) => <li key={i} className="text-xs text-muted-foreground">• {s}</li>)}</ul>
                              </div>
                            )}
                            {currentEval.weaknesses && currentEval.weaknesses.length > 0 && (
                              <div className="bg-red-50 rounded-xl p-3">
                                <p className="text-xs font-semibold text-red-500 mb-1.5">⚠️ Weaknesses</p>
                                <ul className="space-y-1">{currentEval.weaknesses.map((w, i) => <li key={i} className="text-xs text-muted-foreground">• {w}</li>)}</ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Markdown feedback */}
                        <div className="bg-muted/40 rounded-xl p-4">
                          <div className="prose prose-sm max-w-none text-sm [&>p]:mb-2 [&>h2]:text-sm [&>h3]:text-xs [&>ul]:pl-4">
                            <ReactMarkdown>{currentEval.feedback}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Step 3: Score ────────────────────────────────── */}
                {currentEval && aiDone && (
                  <div className="rounded-2xl border bg-card p-5 space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${isCompleted ? 'bg-green-100' : 'bg-blue-100'}`}>
                        {isCompleted ? <CheckCircle2 size={14} className="text-green-600" /> : <Send size={14} className="text-blue-500" />}
                      </div>
                      <p className="text-sm font-semibold">{isCompleted ? 'Score Submitted ✓' : 'Submit Your Score'}</p>
                    </div>

                    <form onSubmit={scoreForm.handleSubmit(d => submitScore.mutate(d))} className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Your Score (0–100)</label>
                        <input {...scoreForm.register('judgeScore', { valueAsNumber: true })} type="number" min={0} max={100}
                          readOnly={isCompleted}
                          className="w-full px-4 py-2.5 border rounded-xl bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-muted" />
                        {scoreForm.formState.errors.judgeScore && <p className="text-xs text-red-500 mt-1">{scoreForm.formState.errors.judgeScore.message}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Your Feedback</label>
                        <textarea {...scoreForm.register('feedback')} rows={3} readOnly={isCompleted}
                          placeholder="Add your assessment…"
                          className="w-full px-4 py-2.5 border rounded-xl bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                      </div>
                      {!isCompleted && (
                        <button type="submit" disabled={submitScore.isPending}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 text-sm font-semibold transition disabled:opacity-50">
                          {submitScore.isPending && <Loader2 size={14} className="animate-spin" />}
                          Submit Score
                        </button>
                      )}
                    </form>
                  </div>
                )}

                {/* ── Submission history ───────────────────────────── */}
                <div className="rounded-2xl border bg-card overflow-hidden">
                  <button onClick={() => setShowHistory(h => !h)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition">
                    <p className="text-sm font-semibold">Submission History</p>
                    {showHistory ? <ChevronUp size={15} className="text-muted-foreground" /> : <ChevronDown size={15} className="text-muted-foreground" />}
                  </button>
                  {showHistory && (
                    <div className="border-t px-4 py-3 space-y-2">
                      {(subsQ.data as Array<{ id: string; version: number; githubUrl?: string; reportUrl?: string; pptUrl?: string; videoUrl?: string; status?: string }> ?? []).map(s => (
                        <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 text-xs">
                          <span className="font-medium">Version {s.version}</span>
                          <div className="flex items-center gap-2">
                            <FileLinks sub={s} />
                            {s.status && <StatusBadge status={s.status as 'SUBMITTED'} />}
                          </div>
                        </div>
                      ))}
                      {(!subsQ.data || (subsQ.data as unknown[]).length === 0) && (
                        <p className="text-xs text-muted-foreground text-center py-3">No submissions yet</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Error display */}
                {evalQ.isError && <ErrorCard message={(evalQ.error as Error)?.message} onRetry={evalQ.refetch} />}
              </div>

              {/* Right Sub-column: Premium File Viewer / Previews */}
              {latestSub && (
                <div className="w-[500px] shrink-0 border bg-card rounded-2xl flex flex-col overflow-hidden">
                  <div className="flex border-b bg-muted/40 shrink-0">
                    {latestSub.reportUrl && (
                      <button
                        onClick={() => setActiveFileTab('pdf')}
                        className={`flex-1 py-3 text-xs font-semibold border-b-2 transition ${activeFileTab === 'pdf' ? 'border-orange-500 text-orange-600' : 'border-transparent text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        PDF Report
                      </button>
                    )}
                    {latestSub.pptUrl && (
                      <button
                        onClick={() => setActiveFileTab('ppt')}
                        className={`flex-1 py-3 text-xs font-semibold border-b-2 transition ${activeFileTab === 'ppt' ? 'border-orange-500 text-orange-600' : 'border-transparent text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        Slides (PPT)
                      </button>
                    )}
                    {latestSub.githubUrl && (
                      <button
                        onClick={() => setActiveFileTab('github')}
                        className={`flex-1 py-3 text-xs font-semibold border-b-2 transition ${activeFileTab === 'github' ? 'border-orange-500 text-orange-600' : 'border-transparent text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        GitHub Repo
                      </button>
                    )}
                  </div>

                  <div className="flex-1 bg-muted/10 relative overflow-hidden">
                    {activeFileTab === 'pdf' && latestSub.reportUrl && (
                      <iframe
                        src={resolveUrl(latestSub.reportUrl)}
                        className="w-full h-full border-0"
                        title="PDF Report Preview"
                      />
                    )}
                    {activeFileTab === 'ppt' && latestSub.pptUrl && (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                        <Presentation size={48} className="text-orange-500" />
                        <div>
                          <p className="text-sm font-semibold">Presentation Slides</p>
                          <p className="text-xs text-muted-foreground mt-1">Slides cannot be embedded directly in localhost.</p>
                        </div>
                        <a
                          href={resolveUrl(latestSub.pptUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition"
                        >
                          <ExternalLink size={13} /> Open Presentation
                        </a>
                      </div>
                    )}
                    {activeFileTab === 'github' && latestSub.githubUrl && (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                        <Github size={48} className="text-foreground" />
                        <div>
                          <p className="text-sm font-semibold">GitHub Repository</p>
                          <p className="text-xs text-muted-foreground mt-1">{latestSub.githubUrl}</p>
                        </div>
                        <a
                          href={latestSub.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition"
                        >
                          <ExternalLink size={13} /> Open GitHub Repo
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
