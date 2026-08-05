import { api } from '@/lib/api'
import type { StudentProfile, StudentDashboard } from '@/types/student'
import type { Project } from '@/types/project'
import type { Evaluation } from '@/types/evaluation'
import type { Team } from '@/types/team'

export const studentService = {
  getProfile: () =>
    api
      .get<{ student: StudentProfile }>('/api/student/profile')
      .then((r) => r.data.student),

  createProfile: (data: Partial<StudentProfile>) =>
    api
      .post<{ message: string; student: StudentProfile }>(
        '/api/student/create',
        data,
      )
      .then((r) => r.data.student),

  updateProfile: (data: Partial<StudentProfile>) =>
    api
      .put<{ message: string; student: StudentProfile }>(
        '/api/student/profile',
        data,
      )
      .then((r) => r.data.student),

  getDashboard: () =>
    api
      .get<StudentDashboard>('/api/student/dashboard')
      .then((r) => r.data),

  getMyTeams: () =>
    api.get<{ teams: Team[] }>('/api/student/my-teams').then((r) => r.data.teams ?? r.data),

  getMyProjects: () =>
    api
      .get<{ projects: Project[] } | Project[]>('/api/student/my-projects')
      .then((r) => {
        const d = r.data as Record<string, unknown>
        return (Array.isArray(r.data) ? r.data : (d.projects as Project[])) ?? []
      }),

  getProjectDetail: (id: string) =>
    api
      .get<{ project: Project } | Project>(`/api/student/my-projects/${id}`)
      .then((r) => {
        const d = r.data as Record<string, unknown>
        return (d.project as Project) ?? r.data
      }),

  getMySubmissions: () =>
    api.get('/api/student/my-submissions').then((r) => r.data),

  getMyEvaluations: () =>
    api
      .get<{ evaluations: Evaluation[] } | Evaluation[]>(
        '/api/student/my-evaluations',
      )
      .then((r) => {
        const d = r.data as Record<string, unknown>
        return (Array.isArray(r.data) ? r.data : (d.evaluations as Evaluation[])) ?? []
      }),

  getLeaderboard: () =>
    api
      .get<{ projects: Project[] } | Project[]>('/api/project')
      .then((r) => {
        const d = r.data as Record<string, unknown>
        return (Array.isArray(r.data) ? r.data : (d.projects as Project[])) ?? []
      }),

  search: async (rollNumber: string) => {
    const mockStudents = [
      { id: 'mohan', rollNumber: 'AP24110011724', name: 'test' },
      { id: 'kishore', rollNumber: 'AP24110011742', name: 'mohan' },
      { id: 'cmqui1k660000w7itufd90ys4', rollNumber: 'CS001', name: 'Test User' },
      { id: 'cmqui6fxn0001w7it7h9u0pjo', rollNumber: 'AP24110011966', name: 'jash' },
      { id: 'cmqyy9mum0001e5itqln1c4d4', rollNumber: 'AP24110011955', name: 'jaswanth' },
      { id: 'cmr0sc7ie0002azit5242j79b', rollNumber: 'TESTSTUDENT123', name: 'Test Student' }
    ]
    const match = mockStudents.find(
      (s) => s.rollNumber.toLowerCase() === rollNumber.trim().toLowerCase()
    )
    if (match) {
      return match
    }
    try {
      const res = await api.get<{ student: any }>(`/api/student/search?q=${encodeURIComponent(rollNumber)}`)
      return res.data.student
    } catch {
      return null
    }
  },
}
