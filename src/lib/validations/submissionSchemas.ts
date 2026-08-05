import { z } from 'zod'

export const submissionSchema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  githubUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

export type SubmissionFormValues = z.infer<typeof submissionSchema>
