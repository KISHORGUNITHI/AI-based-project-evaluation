export type EvaluationStatus =
  | 'PENDING'
  | 'AI_EVALUATING'
  | 'AI_COMPLETED'
  | 'JUDGE_EVALUATING'
  | 'COMPLETED'

export interface Evaluation {
  id: string
  projectId: string
  submissionId: string
  judgeId?: string
  aiScore?: number | string | null
  problemStatementScore?: number | string | null
  solutionDesignScore?: number | string | null
  implementationScore?: number | string | null
  innovationScore?: number | string | null
  documentationScore?: number | string | null
  strengths?: string[]
  weaknesses?: string[]
  suggestions?: string[]
  judgeScore?: number | string | null
  finalScore?: number | string | null
  feedback?: string
  status: EvaluationStatus
  createdAt: string
  updatedAt: string
  project?: { id: string; title: string; domain?: string }
  submission?: { id: string; version: number; githubUrl?: string; reportUrl?: string; pptUrl?: string; videoUrl?: string }
}
