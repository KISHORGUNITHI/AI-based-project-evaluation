export type SubmissionStatus = 'SUBMITTED' | 'EVALUATING' | 'EVALUATED' | 'REJECTED'

export interface Submission {
  id: string
  projectId: string
  version: number
  submittedBy: string
  githubUrl?: string
  reportUrl?: string
  pptUrl?: string
  videoUrl?: string
  notes?: string
  status: SubmissionStatus
  createdAt: string
  updatedAt: string
}
