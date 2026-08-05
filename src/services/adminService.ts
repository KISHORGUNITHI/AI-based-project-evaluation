import { api } from '@/lib/api'

export interface AdminUser {
  id: string
  name: string
  username?: string
  email: string
  role: 'STUDENT' | 'JUDGE' | 'ADMIN'
  emailVerified: boolean
  createdAt: string
  student?: { id: string; rollNumber: string; department: string; collegeName: string } | null
  judge?: { id: string; organization?: string; designation?: string; expertise: string[] } | null
}

export interface AdminDashboardStats {
  totalUsers: number
  totalStudents: number
  totalJudges: number
  totalProjects: number
  totalSubmissions: number
  evaluations: {
    PENDING: number
    AI_EVALUATING: number
    AI_COMPLETED: number
    JUDGE_EVALUATING: number
    COMPLETED: number
  }
}

export interface JudgeListItem {
  /** User ID (top-level id from the API response) */
  id: string
  name: string
  username?: string
  email: string
  organization?: string
  designation?: string
  expertise: string[]
  /** Nested judge profile — use judge.id when assigning */
  judge?: {
    id: string
    organization?: string
    designation?: string
    expertise: string[]
    _count: { evaluations: number }
  } | null
  user: { id: string; name: string; username?: string; email: string }
  _count: { evaluations: number }
}

export interface AdminProjectPipeline {
  id: string
  title: string
  description?: string
  domain: string
  status: string
  githubUrl?: string
  reportUrl?: string
  pptUrl?: string
  createdAt: string
  team: { id: string; name: string }
  submissions: Array<{
    id: string
    version: number
    status: string
    githubUrl?: string
    reportUrl?: string
    pptUrl?: string
  }>
  evaluations: Array<{
    id: string
    status: string
    aiScore?: number
    judgeScore?: number
    finalScore?: number
    judge?: {
      id: string
      organization?: string
      designation?: string
      expertise: string[]
      user: { name: string; username?: string; email: string }
    } | null
  }>
}

export interface LeaderboardProject {
  id: string
  title: string
  domain: string
  status: string
  team: { id: string; name: string }
  evaluations: Array<{
    id: string
    aiScore?: number
    judgeScore?: number
    finalScore?: number
    status: string
  }>
}

export interface ActivityEvent {
  type: string
  timestamp: string
  message: string
  entityId: string
  entityType: string
}

export interface PlatformSettings {
  id: string
  platformName: string
  aiScoreWeight: number      // 0.0 – 1.0  (judgeScoreWeight = 1 - aiScoreWeight)
  submissionDeadline: string | null  // ISO date string or null
  maxTeamSize: number
  allowLateSubmissions: boolean
  updatedAt: string
}

export const adminService = {
  getDashboardStats: () =>
    api.get<AdminDashboardStats>('/api/admin/dashboard').then((r) => r.data),

  getUsers: (params?: { role?: string; search?: string; page?: number; limit?: number }) =>
    api.get<{ users: AdminUser[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      '/api/admin/users', { params }
    ).then((r) => r.data),

  getUserById: (id: string) =>
    api.get<{ user: AdminUser }>(`/api/admin/users/${id}`).then((r) => r.data.user),

  updateUser: (id: string, data: { name?: string; username?: string; role?: string }) =>
    api.patch<{ user: AdminUser }>(`/api/admin/users/${id}`, data).then((r) => r.data.user),

  deactivateUser: (id: string) =>
    api.patch(`/api/admin/users/${id}/deactivate`).then((r) => r.data),

  getProjectsPipeline: () =>
    api.get<{ projects: AdminProjectPipeline[] }>('/api/admin/projects').then((r) => r.data.projects),

  getProjectDetail: (id: string) =>
    api.get<{ project: AdminProjectPipeline }>(`/api/admin/projects/${id}`).then((r) => r.data.project),

  getJudgesList: () =>
    api.get<{ judges: JudgeListItem[] }>('/api/admin/judges').then((r) => r.data.judges),

  getLeaderboard: () =>
    api.get<{ projects: LeaderboardProject[] }>('/api/admin/leaderboard').then((r) => r.data.projects),

  getActivityLog: (limit?: number) =>
    api.get<{ events: ActivityEvent[] }>('/api/admin/activity', { params: { limit } }).then((r) => r.data.events),

  unlockResubmission: (projectId: string) =>
    api.patch(`/api/submission/project/${projectId}/unlock`).then((r) => r.data),

  getSettings: () =>
    api.get<PlatformSettings>('/api/admin/settings').then((r) => r.data),

  updateSettings: (data: Partial<Omit<PlatformSettings, 'id' | 'updatedAt'>>) =>
    api.patch<PlatformSettings>('/api/admin/settings', data).then((r) => r.data),
}
