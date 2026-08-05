import type { Submission } from './submission'

export type ProjectStatus = 'DRAFT' | 'SUBMITTED' | 'EVALUATING' | 'EVALUATED' | 'REJECTED'

export interface Project {
  id: string
  title: string
  description?: string
  domain: string
  githubUrl?: string
  repoUrl?: string       // alias — maps to githubUrl in some responses
  reportUrl?: string
  pptUrl?: string
  videoUrl?: string
  teamId: string
  createdBy?: string
  status?: ProjectStatus
  techStack?: string[]
  createdAt: string
  updatedAt: string
  team?: { id: string; name: string }
  submissions?: Submission[]
  evaluations?: Array<{
    id: string
    status: string
    aiScore?: number | string | null
    judgeScore?: number | string | null
    finalScore?: number | string | null
    feedback?: string | null
  }>
}
