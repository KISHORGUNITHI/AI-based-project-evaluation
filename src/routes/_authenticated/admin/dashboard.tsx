import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import {
  Users,
  FolderKanban,
  Send,
  Star,
  Search,
  ChevronRight,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import { queryKeys } from '@/lib/queryKeys'
import { projectService } from '@/services/projectService'
import { useAuthStore } from '@/store/authStore'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { DashboardSkeleton } from '@/components/shared/LoadingSkeleton'
import { ErrorCard } from '@/components/shared/ErrorCard'
import { cn } from '@/lib/utils'
import type { Project, ProjectStatus } from '@/types/project'

export const Route = createFileRoute('/_authenticated/admin/dashboard')({
  component: AdminDashboard,
})

// ─── Pipeline stages — derived from ProjectStatus ────────────────────────────

const PIPELINE: {
  key: ProjectStatus | 'DRAFT'
  label: string
  bg: string
  text: string
  bar: string
}[] = [
  { key: 'DRAFT',      label: 'Draft',      bg: 'bg-slate-100',   text: 'text-slate-700',   bar: 'bg-slate-400'   },
  { key: 'SUBMITTED',  label: 'Submitted',  bg: 'bg-blue-100',    text: 'text-blue-700',    bar: 'bg-blue-400'    },
  { key: 'EVALUATING', label: 'Evaluating', bg: 'bg-yellow-100',  text: 'text-yellow-700',  bar: 'bg-yellow-400'  },
  { key: 'EVALUATED',  label: 'Evaluated',  bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-400' },
  { key: 'REJECTED',   label: 'Rejected',   bg: 'bg-red-100',     text: 'text-red-700',     bar: 'bg-red-400'     },
]

// ─── Pipeline card ────────────────────────────────────────────────────────────

function PipelineCard({
  label, value, total, bg, text, bar,
}: {
  label: string; value: number; total: number
  bg: string; text: string; bar: string
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className={cn('rounded-xl p-4 flex flex-col gap-2', bg)}>
      <div className="flex items-center justify-between">
        <p className={cn('text-xs font-medium', text)}>{label}</p>
        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white/60', text)}>
          {pct}%
        </span>
      </div>
      <p className={cn('text-3xl font-bold tabular-nums', text)}>{value}</p>
      <div className="w-full h-1 overflow-hidden rounded-full bg-white/50">
        <div
          className={cn('h-full rounded-full transition-all duration-500', bar)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function AdminDashboard() {
  const user = useAuthStore((s) => s.user)
  const [search, setSearch] = useState('')

  // ── Single query — same as original ───────────────────────────────────────
  const projQ = useQuery({
    queryKey: queryKeys.projects.all,
    queryFn:  projectService.getAll,
  })

  // ── Derived counts — same logic as original ───────────────────────────────
  const projects: Project[] = useMemo(
    () => (Array.isArray(projQ.data) ? projQ.data : []),
    [projQ.data],
  )

  const evaluated = useMemo(
    () => projects.filter((p) => p.status === 'EVALUATED').length,
    [projects],
  )
  const submitted = useMemo(
    () => projects.filter((p) => p.status === 'SUBMITTED').length,
    [projects],
  )

  const filteredProjects = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return projects
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.team?.name ?? '').toLowerCase().includes(q) ||
        (p.domain ?? '').toLowerCase().includes(q),
    )
  }, [projects, search])

  // ── Loading / error ────────────────────────────────────────────────────────
  if (projQ.isLoading) return <DashboardSkeleton />
  if (projQ.isError)
    return <ErrorCard message={projQ.error?.message} onRetry={projQ.refetch} />

  const firstName = user?.name?.split(' ')[0] ?? 'Admin'

  return (
    <div className="space-y-6">

      {/* ── Welcome banner ── */}
      <div className="relative p-6 overflow-hidden text-white shadow-sm rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 shadow-orange-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Welcome back, {firstName} 👋
            </h2>
            <p className="mt-1 text-sm text-white/80">Platform overview</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/admin/projects"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition border rounded-xl bg-white/20 hover:bg-white/30 border-white/30 backdrop-blur-sm"
            >
              Manage Projects
              <ArrowRight size={15} />
            </Link>
            <Link
              to="/admin/users"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition border rounded-xl bg-white/20 hover:bg-white/30 border-white/30 backdrop-blur-sm"
            >
              Users
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
        <div className="absolute w-40 h-40 rounded-full pointer-events-none -right-8 -top-8 bg-white/10" />
        <div className="absolute rounded-full pointer-events-none -bottom-6 right-32 h-28 w-28 bg-white/10" />
      </div>

      {/* ── Stat cards — same values as original ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Projects"
          value={projects.length}
          icon={FolderKanban}
          variant="blue"
        />
        <StatCard
          title="Submitted"
          value={submitted}
          icon={Send}
          variant="amber"
        />
        <StatCard
          title="Evaluated"
          value={evaluated}
          icon={Star}
          variant="green"
        />
        <StatCard
          title="Active Users"
          value="—"
          icon={Users}
          variant="purple"
          description="User management coming soon"
        />
      </div>

      {/* ── Project status pipeline ── */}
      <div className="p-5 bg-card border shadow-sm rounded-2xl border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={15} className="text-orange-500" aria-hidden="true" />
            <h3 className="font-semibold text-foreground">Project pipeline</h3>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {projects.length} total
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {PIPELINE.map(({ key, label, bg, text, bar }) => (
            <PipelineCard
              key={key}
              label={label}
              value={projects.filter((p) => (p.status ?? 'DRAFT') === key).length}
              total={projects.length}
              bg={bg}
              text={text}
              bar={bar}
            />
          ))}
        </div>
      </div>

      {/* ── All projects table ── */}
      <div className="overflow-hidden bg-card border shadow-sm rounded-2xl border-border">

        {/* Table header + search */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-foreground">All Projects</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {search
                ? `${filteredProjects.length} of ${projects.length} projects`
                : `${projects.length} total`}
            </p>
          </div>
          <div className="relative">
            <Search
              size={13}
              className="absolute -translate-y-1/2 pointer-events-none left-3 top-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search project or team…"
              aria-label="Search projects"
              className="py-2 pl-8 pr-3 text-xs transition border outline-none w-52 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>

        {/* All projects table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3.5 text-left text-xs font-semibold tracking-wide text-muted-foreground">
                  Project
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold tracking-wide text-muted-foreground">
                  Team
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold tracking-wide text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold tracking-wide text-muted-foreground">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-sm text-center text-muted-foreground">
                    {search ? 'No projects match your search.' : 'No projects yet.'}
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => (
                  <tr
                    key={p.id}
                    className="transition-colors hover:bg-muted/40"
                  >
                    <td className="px-5 py-3.5 font-semibold text-foreground">
                      {p.title}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        {p.team?.name ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {p.status
                        ? <StatusBadge status={p.status} />
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        to="/admin/projects"
                        className="inline-flex items-center gap-1 text-xs font-medium text-orange-500 transition hover:text-orange-600"
                      >
                        Manage
                        <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
