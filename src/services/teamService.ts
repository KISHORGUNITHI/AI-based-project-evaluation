import { api } from '@/lib/api'
import type { Team } from '@/types/team'

export const teamService = {
  getMy: () =>
    api.get<{ teams: Team[] }>('/api/team/my').then((r) => r.data.teams ?? []),

  getByName: (name: string) =>
    api.get<{ team: Team }>(`/api/team/name/${name}`).then((r) => r.data.team),

  create: (data: { name: string; members?: { studentId: string }[] }) =>
    api.post<{ team: Team }>('/api/team', data).then((r) => r.data.team),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/api/team/${id}`).then((r) => r.data),

  addMember: (teamId: string, studentId: string) =>
    api
      .post<{ member: any }>(`/api/team/${teamId}/members`, { studentId })
      .then((r) => r.data.member),

  removeMember: (teamId: string, studentId: string) =>
    api
      .delete<{ message: string }>(`/api/team/${teamId}/members`, {
        data: { studentId },
      })
      .then((r) => r.data),
}
