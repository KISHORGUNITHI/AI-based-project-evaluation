import { api } from '@/lib/api'
import type { Project } from '@/types/project'

export interface LeaderboardProject extends Project {
  evaluations?: Array<{
    id: string
    aiScore: number | string | null
    judgeScore: number | string | null
    finalScore: number | string | null
    status: string
  }>
}

export const projectService = {
  getAll: () =>
    api.get<{ projects: Project[] } | Project[]>('/api/project').then((r) => {
      const d = r.data as Record<string, unknown>
      return (Array.isArray(r.data) ? r.data : (d.projects as Project[])) ?? []
    }),

  getLeaderboard: () =>
    api.get<{ projects: LeaderboardProject[] }>('/api/project/leaderboard').then((r) => r.data.projects ?? []),

  getById: (id: string) =>
    api.get<{ project: Project } | Project>(`/api/project/${id}`).then((r) => {
      const d = r.data as Record<string, unknown>
      return (d.project as Project) ?? (r.data as Project)
    }),

  getByTeam: (teamId: string) =>
    api
      .get<{ projects: Project[] } | Project[]>(`/api/project/team/${teamId}`)
      .then((r) => {
        const d = r.data as Record<string, unknown>
        return (Array.isArray(r.data) ? r.data : (d.projects as Project[])) ?? []
      }),

  create: (data: {
    title: string
    description?: string
    domain: string
    githubUrl?: string
    teamId: string
  }) =>
    api
      .post<{ message: string; project: Project }>('/api/project', data)
      .then((r) => r.data.project ?? r.data),

  update: (
    id: string,
    data: { title?: string; description?: string; domain?: string; githubUrl?: string },
  ) =>
    api
      .put<{ message: string; project: Project }>(`/api/project/${id}`, data)
      .then((r) => r.data.project ?? r.data),

  delete: (id: string) => api.delete(`/api/project/${id}`).then((r) => r.data),
}
