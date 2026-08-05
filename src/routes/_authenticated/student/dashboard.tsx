import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Users, FolderKanban, Send, Cpu, UserCheck } from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import { queryKeys } from '@/lib/queryKeys'
import { studentService } from '@/services/studentService'
import { ErrorCard } from '@/components/shared/ErrorCard'
import { DashboardSkeleton } from '@/components/shared/LoadingSkeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useAuthStore } from '@/store/authStore'
import { formatDistanceToNow } from 'date-fns'
import type { Project } from '@/types/project'
import type { Evaluation } from '@/types/evaluation'

export const Route = createFileRoute('/_authenticated/student/dashboard')({
  component: StudentDashboard,
})

const evalStatusConfig = [
  { key: 'PENDING',          label: 'Pending',         color: 'bg-slate-400'  },
  { key: 'AI_EVALUATING',    label: 'AI Evaluating',   color: 'bg-purple-500' },
  { key: 'AI_COMPLETED',     label: 'AI Completed',    color: 'bg-green-500'  },
  { key: 'JUDGE_EVALUATING', label: 'Judge Reviewing', color: 'bg-amber-500'  },
  { key: 'COMPLETED',        label: 'Completed',       color: 'bg-orange-500' },
] as const

// Custom tooltip for Pie — shows project name, AI score, Judge score
const PieTooltip = ({ active, payload }: {
  active?: boolean
  payload?: Array<{ payload: { name: string; aiScore: number; judgeScore: number } }>
}) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs space-y-1.5 min-w-[160px]">
      <p className="font-bold text-slate-800 text-sm truncate">{d.name}</p>
      <div className="flex justify-between gap-6">
        <span className="text-orange-500 font-medium">AI Score</span>
        <span className="font-bold text-orange-600">{d.aiScore}</span>
      </div>
      <div className="flex justify-between gap-6">
        <span className="text-blue-500 font-medium">Judge Score</span>
        <span className="font-bold text-blue-600">{d.judgeScore}</span>
      </div>
    </div>
  )
}

// Dummy data removed — charts only show when real evaluation data exists
const PIE_COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#10b981']

function StudentDashboard() {
  const user = useAuthStore(s => s.user)
  const dashQ = useQuery({ queryKey: queryKeys.student.dashboard, queryFn: studentService.getDashboard })
  const projQ = useQuery({ queryKey: queryKeys.student.projects,    queryFn: studentService.getMyProjects })
  const evalQ = useQuery({ queryKey: queryKeys.student.evaluations, queryFn: studentService.getMyEvaluations })

  if (dashQ.isLoading) return <DashboardSkeleton />
  if (dashQ.isError)   return <ErrorCard message={dashQ.error?.message} onRetry={dashQ.refetch} />

  const d = dashQ.data
  const evals = (d?.evaluations ?? {}) as {
    COMPLETED?: number; PENDING?: number; AI_EVALUATING?: number
    AI_COMPLETED?: number; JUDGE_EVALUATING?: number
  }
  const recentProjects: Project[]  = (Array.isArray(projQ.data) ? projQ.data : []).slice(0, 5)
  const recentEvals:    Evaluation[]= (Array.isArray(evalQ.data) ? evalQ.data : []).slice(0, 5)
  const activeEvals = Object.values(evals).reduce((s, v) => s + (v ?? 0), 0)

  // Chart data — only show charts when real scored evaluations exist
  const scoredEvals = recentEvals.filter(e => e.aiScore != null || e.judgeScore != null)
  const chartRows = scoredEvals.map(e => ({
    name:       e.project?.title ?? 'Project',
    aiScore:    Number(e.aiScore    ?? 0),
    judgeScore: Number(e.judgeScore ?? 0),
  }))

  // Pie = AI score share per project (size of slice = aiScore value)
  // This way pie shows WHICH projects have higher AI scores relative to each other
  const pieData = chartRows.map((r, i) => ({
    name:       r.name,
    value:      r.aiScore,   // slice size = AI score
    aiScore:    r.aiScore,
    judgeScore: r.judgeScore,
    color:      PIE_COLORS[i % PIE_COLORS.length],
  }))

  // Bar = per project, side-by-side AI vs Judge
  const barData = chartRows.map(r => ({
    name:          r.name,
    'AI Score':    r.aiScore,
    'Judge Score': r.judgeScore,
  }))

  const avgAi    = chartRows.length > 0 ? Math.round(chartRows.reduce((s, r) => s + r.aiScore,    0) / chartRows.length) : 0
  const avgJudge = chartRows.length > 0 ? Math.round(chartRows.reduce((s, r) => s + r.judgeScore, 0) / chartRows.length) : 0

  return (
    <div className="space-y-5 pb-8">

      {/* ── Welcome Banner ── */}
      <div className="rounded-2xl bg-gradient-to-r from-orange-500 via-pink-500 to-pink-600 p-10 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-8">
        <div className="flex-1 flex flex-col justify-center space-y-3">
          <h3 className="text-3xl font-bold">Welcome back, {user?.name ?? 'there'} 👋</h3>
          <p className="text-lg text-white/90">
            {(d?.totalSubmissions ?? 0) === 0
              ? "You're all set. Submit your first project to get started."
              : `You have ${d?.totalSubmissions} submission${(d?.totalSubmissions ?? 0) > 1 ? 's' : ''} so far. Keep it up!`}
          </p>
        </div>
        <Link
          to="/student/projects"
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-orange-500 text-sm font-bold shadow-lg hover:bg-orange-50 transition"
        >
          <Send size={15} />
          New Submission
        </Link>
      </div>

      {/* ── 3 Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Teams */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 shadow-sm p-6">
          <div className="flex items-start justify-between">
            <p className="text-sm font-bold text-blue-500">Teams</p>
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
              <Users size={18} className="text-blue-500" />
            </div>
          </div>
          <p className="text-4xl font-extrabold text-slate-800 mt-4">{d?.totalTeams ?? 0}</p>
          <p className="text-xs text-slate-400 mt-1.5">Active team</p>
        </div>

        {/* Projects */}
        <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100 shadow-sm p-6">
          <div className="flex items-start justify-between">
            <p className="text-sm font-bold text-purple-500">Projects</p>
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
              <FolderKanban size={18} className="text-purple-500" />
            </div>
          </div>
          <p className="text-4xl font-extrabold text-slate-800 mt-4">{d?.totalProjects ?? 0}</p>
          <p className="text-xs text-slate-400 mt-1.5">{recentProjects.filter(p => p.status === 'DRAFT').length} in draft</p>
        </div>

        {/* Submissions */}
        <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-pink-50 border border-orange-100 shadow-sm p-6">
          <div className="flex items-start justify-between">
            <p className="text-sm font-bold text-orange-500">Submissions</p>
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
              <Send size={18} className="text-orange-500" />
            </div>
          </div>
          <p className="text-4xl font-extrabold text-slate-800 mt-4">{d?.totalSubmissions ?? 0}</p>
          <p className="text-xs text-slate-400 mt-1.5">{(d?.totalSubmissions ?? 0) === 0 ? 'None yet' : 'Total submitted'}</p>
        </div>
      </div>

      {/* ── Recent Projects + Evaluation Status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Recent Projects</h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-600">{recentProjects.length} total</span>
          </div>
          {projQ.isLoading ? <p className="text-sm text-slate-400">Loading…</p>
            : projQ.isError ? <ErrorCard message={projQ.error?.message} onRetry={projQ.refetch} />
            : recentProjects.length === 0 ? <p className="text-sm text-slate-400">No projects yet.</p>
            : <ul className="space-y-3">{recentProjects.map(p => (
                <li key={p.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{p.title}</p>
                    <p className="text-xs text-slate-400">
                      {p.updatedAt ? `Updated ${formatDistanceToNow(new Date(p.updatedAt), { addSuffix: true })}` : 'Recently updated'}
                    </p>
                  </div>
                  {p.status && <StatusBadge status={p.status} />}
                </li>
              ))}</ul>
          }
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Evaluation Status</h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-600">{activeEvals} active</span>
          </div>
          <ul className="space-y-3">
            {evalStatusConfig.map(({ key, label, color }) => (
              <li key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                  <span className="text-sm text-slate-700">{label}</span>
                </div>
                <span className="text-sm font-bold text-slate-800">{evals[key] ?? 0}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Charts Row: Pie (AI score per project) + Avg stat cards ── */}
      {chartRows.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Pie chart — slice per project, sized by AI score, hover shows both scores */}
          <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
            <div className="mb-3">
              <h3 className="font-bold text-slate-800">AI Score Distribution by Project</h3>
              <p className="text-xs text-slate-400 mt-0.5">Hover over a slice to compare AI vs Judge scores</p>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  outerRadius={95}
                  innerRadius={45}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="white" strokeWidth={2} />
                  ))}
                </Pie>
                <ReTooltip content={<PieTooltip />} />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ paddingTop: 12, fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Avg score stat cards */}
          <div className="flex flex-col gap-4">
            <div className="flex-1 rounded-2xl bg-orange-50 border border-orange-100 shadow-sm p-5 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <Cpu size={18} className="text-orange-500" />
                <p className="text-xs font-semibold text-orange-600">Avg AI Score</p>
              </div>
              <p className="text-4xl font-extrabold text-orange-600">{avgAi}</p>
              <p className="text-xs text-orange-400 mt-1">Out of 100</p>
            </div>
            <div className="flex-1 rounded-2xl bg-blue-50 border border-blue-100 shadow-sm p-5 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck size={18} className="text-blue-500" />
                <p className="text-xs font-semibold text-blue-600">Avg Judge Score</p>
              </div>
              <p className="text-4xl font-extrabold text-blue-600">{avgJudge}</p>
              <p className="text-xs text-blue-400 mt-1">Out of 100</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Bar Chart — AI vs Judge per project ── */}
      {chartRows.length > 0 && (
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800">AI vs Judge Score by Project</h3>
              <p className="text-xs text-slate-400 mt-0.5">Side-by-side comparison per project</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-orange-500 inline-block" />AI Score</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />Judge Score</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                angle={-20}
                textAnchor="end"
                interval={0}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <ReTooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              />
              <Bar dataKey="AI Score"    fill="#f97316" radius={[6,6,0,0]} />
              <Bar dataKey="Judge Score" fill="#3b82f6" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  )
}
