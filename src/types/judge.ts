export interface JudgeProfile {
  id: string
  userId: string
  organization?: string
  designation?: string
  expertise: string[]
  experience?: number
  bio?: string
  createdAt: string
  updatedAt: string
}

export interface JudgeDashboard {
  assignedProjects: number
  completedEvaluations: number
  pendingEvaluations: number
}
