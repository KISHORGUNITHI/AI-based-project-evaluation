import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { queryKeys } from '@/lib/queryKeys'
import { adminService } from '@/services/adminService'
import { SkeletonCard } from '@/components/shared/LoadingSkeleton'

export const Route = createFileRoute('/_authenticated/admin/analytics')({ component: AdminAnalytics })

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8', SUBMITTED: '#3b82f6', EVALUATING: '#f59e0b',
  EVALUATED: '#22c55e', REJECTED: '#ef4444',
}

function scoreToRange(score: number): string {
  if (score < 10) return '0-9'
  if (score < 20) return '10-19'
  if (score < 30) return '20-29'
  if (score < 40) return '30-39'
  if (score < 50) return '40-49'
  if (score < 60) return '50-59'
  if (score < 70) return '60-69'
  if (score < 80) return '70-79'
  if (score < 90) return '80-89'
  return '90-100'
}

function AdminAnalytics() {
  const { data: projectsData, isLoading: projLoading } = useQuery({
    queryKey: queryKeys.admin.leaderboard,
    queryFn: adminService.getLeaderboard,
  })
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: queryKeys.admin.dashboard,
    queryFn: adminService.getDashboardStats,
  })

  const isLoading = projLoading || statsLoading
  const projs = (projectsData ?? []) as Array<{
    id: string; title: string; domain: string; status: string;
    evaluations?: Array<{ aiScore?: number; judgeScore?: number; finalScore?: number; status: string }>
  }>

  const statusData = Object.entries(
    projs.reduce((acc, p) => {
      const s = p.status ?? 'UNKNOWN'
      acc[s] = (acc[s] ?? 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))

  const domainData = Object.entries(
    projs.reduce((acc, p) => {
      const d = p.domain ?? 'Other'
      acc[d] = (acc[d] ?? 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).map(([name, count]) => ({ name, count }))

  // Score distribution histogram
  const scoreRanges: Record<string, number> = {
    '0-9': 0, '10-19': 0, '20-29': 0, '30-39': 0, '40-49': 0,
    '50-59': 0, '60-69': 0, '70-79': 0, '80-89': 0, '90-100': 0,
  }
  projs.forEach(p => {
    const eval0 = p.evaluations?.[0]
    if (eval0?.finalScore != null) {
      const range = scoreToRange(Number(eval0.finalScore))
      scoreRanges[range] = (scoreRanges[range] ?? 0) + 1
    }
  })
  const scoreDistData = Object.entries(scoreRanges).map(([range, count]) => ({ range, count }))
  const hasScores = scoreDistData.some(d => d.count > 0)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Analytics</h2>
        <p className="text-sm text-muted-foreground mt-1">Platform-wide statistics and trends</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Pie */}
        <div className="bg-card border border-border shadow-sm rounded-2xl p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">Project Status Breakdown</h3>
          {statusData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontFamily: 'inherit' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Projects by domain bar chart */}
        <div className="bg-card border border-border shadow-sm rounded-2xl p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">Projects by Domain</h3>
          {domainData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No domain data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={domainData}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#cbd5e1' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#cbd5e1' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontFamily: 'inherit' }} />
                <Bar dataKey="count" fill="url(#grad)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Score Distribution Histogram */}
        <div className="bg-card border border-border shadow-sm rounded-2xl p-5 lg:col-span-2">
          <h3 className="text-base font-semibold text-foreground mb-1">Final Score Distribution</h3>
          <p className="text-xs text-muted-foreground mb-4">How many projects landed in each score range</p>
          {!hasScores ? (
            <p className="text-sm text-muted-foreground text-center py-8">No finalized scores yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={scoreDistData}>
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#cbd5e1' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#cbd5e1' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontFamily: 'inherit' }} formatter={(val: unknown) => [`${val} project${Number(val) !== 1 ? 's' : ''}`, 'Count']} />
                <Bar dataKey="count" fill="url(#scoreGrad)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#16a34a" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Summary stats */}
        <div className="bg-card border border-border shadow-sm rounded-2xl p-5 lg:col-span-2">
          <h3 className="text-base font-semibold text-foreground mb-4">Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              ['Total Projects', statsData?.totalProjects ?? projs.length],
              ['Evaluated', projs.filter(p => p.status === 'EVALUATED').length],
              ['Submitted', projs.filter(p => p.status === 'SUBMITTED').length],
              ['Rejected', projs.filter(p => p.status === 'REJECTED').length],
            ].map(([label, val]) => (
              <div key={String(label)} className="text-center rounded-xl bg-muted/50 p-4 border border-border">
                <p className="text-2xl font-bold text-foreground">{val}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
