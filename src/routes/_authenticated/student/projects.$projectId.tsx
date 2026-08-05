import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { queryKeys } from '@/lib/queryKeys'
import { studentService } from '@/services/studentService'
import { submissionService } from '@/services/submissionService'
import { evaluationService } from '@/services/evaluationService'
import { ScoreBadge } from '@/components/shared/ScoreBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ErrorCard } from '@/components/shared/ErrorCard'
import { SkeletonCard } from '@/components/shared/LoadingSkeleton'
import type { Submission } from '@/types/submission'
import type { Evaluation } from '@/types/evaluation'

export const Route = createFileRoute('/_authenticated/student/projects/$projectId')({
  component: ProjectDetailPage,
})

function ProjectDetailPage() {
  const { projectId } = Route.useParams()

  const projQ = useQuery({
    queryKey: queryKeys.student.project(projectId),
    queryFn: () => studentService.getProjectDetail(projectId),
  })

  const subsQ = useQuery({
    queryKey: ['submissions', 'project', projectId],
    queryFn: () => submissionService.getByProject(projectId),
  })

  const evalQ = useQuery({
    queryKey: ['evaluations', 'project', projectId],
    queryFn: () => evaluationService.getByProject(projectId),
  })

  if (projQ.isLoading) return <SkeletonCard />
  if (projQ.isError) return <ErrorCard message={projQ.error?.message} onRetry={projQ.refetch} />

  const project = projQ.data
  const submissions = Array.isArray(subsQ.data) ? subsQ.data : []
  const evals = Array.isArray(evalQ.data) ? evalQ.data : []

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link to="/student/projects" className="p-2 rounded-xl hover:bg-muted transition text-muted-foreground">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold">{project?.title ?? 'Project'}</h2>
          {project?.status && <StatusBadge status={project.status} />}
        </div>
      </div>

      {/* Project info */}
      <div className="rounded-2xl border bg-card p-5 space-y-3">
        <h3 className="font-semibold">Project Info</h3>
        {project?.description && <p className="text-sm text-muted-foreground">{project.description}</p>}
        {project?.repoUrl && (
          <a href={project.repoUrl} target="_blank" rel="noreferrer"
            className="text-sm text-orange-500 hover:underline block">🔗 {project.repoUrl}</a>
        )}
        {project?.techStack && project.techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.techStack.map(t => (
              <span key={t} className="text-xs bg-muted px-2.5 py-1 rounded-full">{t}</span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submission history */}
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="font-semibold mb-4">Submission History</h3>
          {subsQ.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p>
            : submissions.length === 0
              ? <p className="text-sm text-muted-foreground">No submissions yet.</p>
              : <ul className="space-y-3">
                  {submissions.map((s: Submission) => (
                    <li key={s.id} className="p-3 rounded-xl bg-muted/50 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Version {s.version}</span>
                        {s.status && <StatusBadge status={s.status} />}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {s.githubUrl && <a href={s.githubUrl} target="_blank" rel="noreferrer" className="text-orange-500 hover:underline">GitHub</a>}
                        {s.reportUrl && <a href={s.reportUrl} target="_blank" rel="noreferrer" className="text-orange-500 hover:underline">Report PDF</a>}
                        {s.pptUrl && <a href={s.pptUrl} target="_blank" rel="noreferrer" className="text-orange-500 hover:underline">Slides</a>}
                        {s.videoUrl && <a href={s.videoUrl} target="_blank" rel="noreferrer" className="text-orange-500 hover:underline">Video</a>}
                        <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                      </div>
                    </li>
                  ))}
                </ul>
          }
        </div>

        {/* Evaluations */}
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="font-semibold mb-4">Evaluations</h3>
          {evalQ.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p>
            : evals.length === 0
              ? <p className="text-sm text-muted-foreground">No evaluations yet.</p>
              : <ul className="space-y-4">
                  {evals.map((e: Evaluation) => (
                    <li key={e.id} className="p-3 rounded-xl bg-muted/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <StatusBadge status={e.status as 'PENDING'} />
                      </div>
                      <div className="flex gap-3 flex-wrap">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">AI</p>
                          <ScoreBadge score={e.aiScore} size="sm" />
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Judge</p>
                          <ScoreBadge score={e.judgeScore} size="sm" />
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Final</p>
                          <ScoreBadge score={e.finalScore} size="sm" />
                        </div>
                      </div>
                      {e.feedback && (
                        <div className="prose prose-sm dark:prose-invert max-w-none text-xs mt-1
                          [&>h2]:text-xs [&>h2]:font-semibold [&>h3]:text-xs [&>h3]:font-semibold
                          [&>p]:mb-1 [&>ul]:pl-3 [&>li]:mb-0.5">
                          <ReactMarkdown>{e.feedback}</ReactMarkdown>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
          }
        </div>
      </div>
    </div>
  )
}
