import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, Loader2, FolderKanban, Trash2, Edit2, Send, FileText, Presentation } from 'lucide-react'
import { z } from 'zod'
import { queryKeys } from '@/lib/queryKeys'
import { projectService } from '@/services/projectService'
import { studentService } from '@/services/studentService'
import { submissionService } from '@/services/submissionService'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { SkeletonCard } from '@/components/shared/LoadingSkeleton'
import type { Team } from '@/types/team'
import type { Project } from '@/types/project'

export const Route = createFileRoute('/_authenticated/student/projects')({ component: ProjectsPage })

// Project form — GitHub URL only (PDF/PPT are file uploads, not stored as URL)
const projectFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  problemStatement: z.string().optional(),
  domain: z.string().min(1, 'Domain is required'),
  techStack: z.string().optional(), // comma-separated
  githubUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  teamId: z.string().min(1, 'Team is required'),
})

const submissionFormSchema = z.object({
  projectId: z.string(),
  githubUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  notes: z.string().optional(),
})

type ProjectForm = z.infer<typeof projectFormSchema>
type SubmissionForm = z.infer<typeof submissionFormSchema>

function ProjectsPage() {
  const qc = useQueryClient()
  const [projectModal, setProjectModal] = useState<'create' | string | null>(null)
  const [submitModal, setSubmitModal] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // File upload state (stored locally, would be uploaded to storage in production)
  const [reportFile, setReportFile] = useState<File | null>(null)
  const [pptFile, setPptFile] = useState<File | null>(null)

  const { data: projects = [], isLoading } = useQuery({
    queryKey: queryKeys.student.projects,
    queryFn: studentService.getMyProjects,   // ← only THIS student's projects
  })
  const { data: teams = [] } = useQuery({
    queryKey: queryKeys.teams.my,
    queryFn: studentService.getMyTeams,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: queryKeys.student.projects })
    qc.invalidateQueries({ queryKey: queryKeys.student.dashboard })
  }

  const createMut = useMutation({
    mutationFn: (d: ProjectForm) => projectService.create({
      title: d.title,
      description: d.description,
      domain: d.domain,
      githubUrl: d.githubUrl || undefined,
      teamId: d.teamId,
    }),
    onSuccess: () => { invalidate(); setProjectModal(null); toast.success('Project created!') },
    onError: (e: Error) => toast.error(e.message),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProjectForm }) => projectService.update(id, {
      title: data.title,
      description: data.description,
      domain: data.domain,
      githubUrl: data.githubUrl || undefined,
    }),
    onSuccess: () => { invalidate(); setProjectModal(null); toast.success('Project updated!') },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => projectService.delete(id),
    onSuccess: () => { invalidate(); setDeleteId(null); toast.success('Project deleted') },
    onError: (e: Error) => toast.error(e.message),
  })

  const submitMut = useMutation({
    mutationFn: (d: SubmissionForm) => {
      const formData = new FormData()
      formData.append('projectId', d.projectId)
      if (d.githubUrl) formData.append('githubUrl', d.githubUrl)
      if (d.notes) formData.append('notes', d.notes)
      if (reportFile) formData.append('reportFile', reportFile)
      if (pptFile) formData.append('pptFile', pptFile)
      return submissionService.create(formData)
    },
    onSuccess: () => { invalidate(); closeSubmitModal(); toast.success('Project submitted successfully!') },
    onError: (e: Error) => toast.error(e.message),
  })

  const projForm = useForm<ProjectForm>({ resolver: zodResolver(projectFormSchema) })
  const subForm = useForm<SubmissionForm>({ resolver: zodResolver(submissionFormSchema) })

  const openCreate = () => {
    projForm.reset({ title: '', description: '', problemStatement: '', domain: '', techStack: '', githubUrl: '', teamId: '' })
    setProjectModal('create')
  }

  const openEdit = (p: Project) => {
    projForm.reset({
      title: p.title,
      description: p.description ?? '',
      domain: (p as unknown as Record<string, string>).domain ?? '',
      techStack: p.techStack?.join(', ') ?? '',
      githubUrl: p.githubUrl ?? p.repoUrl ?? '',
      teamId: p.teamId,
    })
    setProjectModal(p.id)
  }

  const openSubmit = (projectId: string) => {
    subForm.reset({ projectId, githubUrl: '', notes: '' })
    setReportFile(null)
    setPptFile(null)
    setSubmitModal(projectId)
  }

  const closeSubmitModal = () => {
    setSubmitModal(null)
    setReportFile(null)
    setPptFile(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Projects</h2>
          <p className="text-sm text-muted-foreground">Create and submit your projects for AI evaluation</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 text-white text-sm font-semibold hover:opacity-90 transition">
          <Plus size={16} /> New Project
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : (projects as Project[]).length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project to get it evaluated by AI."
          action={{ label: 'New Project', onClick: openCreate }}
          icon={<FolderKanban size={24} />}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(projects as Project[]).map((p) => {
            const latestSub = p.submissions?.[0]
            const isUnderReview = latestSub && (latestSub.status === 'SUBMITTED' || latestSub.status === 'EVALUATING')
            const isRejected = latestSub && latestSub.status === 'REJECTED'
            const isEvaluated = latestSub && latestSub.status === 'EVALUATED'

            return (
              <div key={p.id} className="rounded-2xl border bg-card p-5 space-y-3 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold truncate">{p.title}</h3>
                  {p.status && <StatusBadge status={p.status} />}
                </div>
                {p.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                )}
                {p.techStack && p.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.techStack.map(t => (
                      <span key={t} className="text-xs bg-muted px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                )}
                {p.githubUrl && (
                  <a href={p.githubUrl} target="_blank" rel="noreferrer"
                    className="text-xs text-orange-500 hover:underline truncate flex items-center gap-1">
                    <span>🔗</span> GitHub Repo
                  </a>
                )}
                <div className="flex gap-2 pt-1 mt-auto">
                  <button onClick={() => openEdit(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs border rounded-lg hover:bg-muted transition">
                    <Edit2 size={12} /> Edit
                  </button>
                  
                  {isUnderReview ? (
                    <span className="flex-1 flex items-center justify-center text-center py-1.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-lg dark:bg-amber-950/20 dark:border-amber-900/30">
                      Under Review — cannot resubmit
                    </span>
                  ) : isRejected ? (
                    <button onClick={() => openSubmit(p.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition dark:bg-red-950/20 dark:border-red-900/30 font-semibold">
                      <Send size={12} /> Rejected — resubmit
                    </button>
                  ) : isEvaluated ? (
                    <span className="flex-1 flex items-center justify-center text-center py-1.5 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 rounded-lg dark:bg-green-950/20 dark:border-green-900/30">
                      Evaluated
                    </span>
                  ) : (
                    <button onClick={() => openSubmit(p.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition dark:bg-indigo-950/20 dark:border-indigo-900/30 font-semibold">
                      <Send size={12} /> Submit
                    </button>
                  )}

                  <button onClick={() => setDeleteId(p.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive border rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Create / Edit Project Modal ─────────────────────────────── */}
      {projectModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setProjectModal(null)} />
          <div className="relative z-10 bg-card border rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-5">
              {projectModal === 'create' ? '✨ New Project' : '✏️ Edit Project'}
            </h3>
            <form onSubmit={projForm.handleSubmit((d) => {
              if (projectModal === 'create') createMut.mutate(d)
              else updateMut.mutate({ id: projectModal, data: d })
            })} className="space-y-4">

              {/* Title */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Project Title *</label>
                <input {...projForm.register('title')} placeholder="e.g. AI Attendance System"
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-background text-foreground outline-none focus:ring-2 focus:ring-pink-500 text-sm" />
                {projForm.formState.errors.title && <p className="mt-1 text-xs text-red-500">{projForm.formState.errors.title.message}</p>}
              </div>

              {/* Domain */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Domain *</label>
                <input {...projForm.register('domain')} placeholder="e.g. AI/ML, Web Dev, IoT, Blockchain"
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-background text-foreground outline-none focus:ring-2 focus:ring-pink-500 text-sm" />
                {projForm.formState.errors.domain && <p className="mt-1 text-xs text-red-500">{projForm.formState.errors.domain.message}</p>}
              </div>

              {/* Problem Statement */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Problem Statement</label>
                <textarea {...projForm.register('problemStatement')} placeholder="What problem does this project solve?" rows={2}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-background text-foreground outline-none focus:ring-2 focus:ring-pink-500 text-sm resize-none" />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Project Description</label>
                <textarea {...projForm.register('description')} placeholder="Describe your project in detail…" rows={3}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-background text-foreground outline-none focus:ring-2 focus:ring-pink-500 text-sm resize-none" />
              </div>

              {/* Technologies */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Technologies Used</label>
                <input {...projForm.register('techStack')} placeholder="React, Python, TensorFlow, PostgreSQL (comma-separated)"
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-background text-foreground outline-none focus:ring-2 focus:ring-pink-500 text-sm" />
              </div>

              {/* GitHub URL */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">GitHub Repository URL</label>
                <input {...projForm.register('githubUrl')} placeholder="https://github.com/username/repo"
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-background text-foreground outline-none focus:ring-2 focus:ring-pink-500 text-sm" />
                {projForm.formState.errors.githubUrl && <p className="mt-1 text-xs text-red-500">{projForm.formState.errors.githubUrl.message}</p>}
              </div>

              {/* Team */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Team *</label>
                <select {...projForm.register('teamId')}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-card outline-none focus:ring-2 focus:ring-pink-500 text-sm">
                  <option value="">Select your team</option>
                  {(teams as Team[]).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {projForm.formState.errors.teamId && <p className="mt-1 text-xs text-red-500">{projForm.formState.errors.teamId.message}</p>}
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setProjectModal(null)}
                  className="px-5 py-2.5 rounded-xl border text-sm font-medium hover:bg-muted transition">
                  Cancel
                </button>
                <button type="submit" disabled={createMut.isPending || updateMut.isPending}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 text-white text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition disabled:opacity-60">
                  {(createMut.isPending || updateMut.isPending) && <Loader2 size={14} className="animate-spin" />}
                  {projectModal === 'create' ? 'Create Project' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Submit Modal ─────────────────────────────────────────────── */}
      {submitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeSubmitModal} />
          <div className="relative z-10 bg-card border rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-xl font-bold mb-5">🚀 Submit Project</h3>
            <form onSubmit={subForm.handleSubmit((d) => submitMut.mutate(d))} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">GitHub Repository URL</label>
                <input {...subForm.register('githubUrl')} placeholder="https://github.com/username/repo"
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-background text-foreground outline-none focus:ring-2 focus:ring-pink-500 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                  <FileText size={12} /> Upload Report (PDF)
                </label>
                <label className="flex items-center gap-3 border-2 border-dashed rounded-2xl px-4 py-3 cursor-pointer hover:border-orange-300 hover:bg-muted/30 transition">
                  <FileText size={18} className="text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground truncate">
                    {reportFile ? reportFile.name : 'Click to upload PDF report'}
                  </span>
                  <input type="file" accept=".pdf" className="hidden"
                    onChange={e => setReportFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                  <Presentation size={12} /> Upload Presentation (PPT)
                </label>
                <label className="flex items-center gap-3 border-2 border-dashed rounded-2xl px-4 py-3 cursor-pointer hover:border-orange-300 hover:bg-muted/30 transition">
                  <Presentation size={18} className="text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground truncate">
                    {pptFile ? pptFile.name : 'Click to upload PPT/PPTX'}
                  </span>
                  <input type="file" accept=".ppt,.pptx,.odp" className="hidden"
                    onChange={e => setPptFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes (optional)</label>
                <textarea {...subForm.register('notes')} placeholder="Any notes for the evaluator…" rows={2}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-background text-foreground outline-none focus:ring-2 focus:ring-pink-500 text-sm resize-none" />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={closeSubmitModal}
                  className="px-5 py-2.5 rounded-xl border text-sm font-medium hover:bg-muted transition">
                  Cancel
                </button>
                <button type="submit" disabled={submitMut.isPending}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 text-white text-sm font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-60">
                  {submitMut.isPending && <Loader2 size={14} className="animate-spin" />}
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}
        title="Delete Project" description="This will permanently delete this project and all its submissions."
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        isPending={deleteMut.isPending} confirmLabel="Delete" variant="destructive" />
    </div>
  )
}
