import { api } from '@/lib/api'
import type { JudgeProfile, JudgeDashboard } from '@/types/judge'
import type { Project } from '@/types/project'
import type { Submission } from '@/types/submission'
import type { Evaluation } from '@/types/evaluation'

export const judgeService = {
  getProfile: () =>
    api.get<JudgeProfile>('/api/judge').then((r) => r.data),

  createProfile: (data: Partial<JudgeProfile>) =>
    api.post<JudgeProfile>('/api/judge', data).then((r) => r.data),

  updateProfile: (data: Partial<JudgeProfile>) =>
    api.put<JudgeProfile>('/api/judge', data).then((r) => r.data),

  getDashboard: () =>
    api.get<JudgeDashboard>('/api/judge/dashboard').then((r) => r.data),

  getAssignedProjects: () =>
    api.get('/api/judge/assigned-projects').then((r) => r.data),

  getProjects: () =>
    api
      .get<{ projects: Project[] } | Project[]>('/api/judge/projects')
      .then((r) => {
        const d = r.data as Record<string, unknown>
        return (Array.isArray(r.data) ? r.data : (d.projects as Project[])) ?? []
      }),

  getProjectDetail: (projectId: string) =>
    api
      .get<{ project: Project } | Project>(`/api/judge/projects/${projectId}`)
      .then((r) => {
        const d = r.data as Record<string, unknown>
        return (d.project as Project) ?? r.data
      }),

  getLatestSubmission: (projectId: string) =>
    api
      .get<{ submission: Submission } | Submission>(`/api/judge/projects/${projectId}/latest-submission`)
      .then((r) => {
        const d = r.data as Record<string, unknown>
        if (d && 'submission' in d) {
          return d.submission as Submission
        }
        return r.data as Submission
      }),

  getSubmissions: (projectId: string) =>
    api
      .get<{ submissions: Submission[] } | Submission[]>(`/api/judge/projects/${projectId}/submissions`)
      .then((r) => {
        const d = r.data as Record<string, unknown>
        return (Array.isArray(r.data) ? r.data : (d.submissions as Submission[])) ?? []
      }),

  getEvaluations: () =>
    api
      .get<Evaluation[]>('/api/judge/evaluations')
      .then((r) => r.data),

  submitScore: (
    evaluationId: string,
    data: { judgeScore: number; feedback: string },
  ) =>
    api
      .patch<Evaluation>(`/api/evaluation/${evaluationId}/judge-score`, data)
      .then((r) => r.data),
}
