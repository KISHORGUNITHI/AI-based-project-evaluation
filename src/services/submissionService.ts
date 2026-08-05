import { api } from '@/lib/api'
import type { Submission } from '@/types/submission'

export const submissionService = {
  create: (data: FormData) =>
    api
      .post<{ message: string; submission: Submission }>('/api/submission', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  getById: (id: string) =>
    api
      .get<{ submission: Submission }>(`/api/submission/${id}`)
      .then((r) => r.data.submission ?? r.data),

  getByProject: (projectId: string) =>
    api
      .get<{ submissions: Submission[] } | Submission[]>(
        `/api/submission/project/${projectId}`,
      )
      .then((r) => {
        const d = r.data as Record<string, unknown>
        return (Array.isArray(r.data) ? r.data : (d.submissions as Submission[])) ?? []
      }),

  getLatest: (projectId: string) =>
    api
      .get<{ submission: Submission }>(`/api/submission/project/${projectId}/latest`)
      .then((r) => r.data.submission ?? r.data),

  updateStatus: (id: string, status: string) =>
    api.patch(`/api/submission/${id}/status`, { status }).then((r) => r.data),
}
