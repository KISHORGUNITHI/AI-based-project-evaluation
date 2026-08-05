import { z } from 'zod'

export const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  domain: z.string().min(1, 'Domain is required').default('General'),
  githubUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  teamId: z.string().min(1, 'Team is required'),
})

export const updateProjectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  domain: z.string().min(1, 'Domain is required').default('General'),
  githubUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>
export type UpdateProjectFormValues = z.infer<typeof updateProjectSchema>
