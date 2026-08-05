export interface StudentProfile {
  id: string
  userId: string
  rollNumber: string
  department: string
  collegeName: string
  phonenumber: string
  year: number
  cgpa?: string
  githubUrl?: string
  leetcode?: string
  portfolio?: string
  linkedin?: string
  createdAt: string
  updatedAt: string
}

export interface StudentDashboard {
  totalTeams: number
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
