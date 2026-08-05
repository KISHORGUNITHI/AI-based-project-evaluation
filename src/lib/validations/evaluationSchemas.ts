import { z } from 'zod'

// Use z.number() — the form registers with { valueAsNumber: true } which handles coercion
export const judgeScoringSchema = z.object({
  judgeScore: z.number()
    .min(0, 'Score must be at least 0')
    .max(100, 'Score must be at most 100'),
  feedback: z.string().min(1, 'Feedback is required'),
})

export const createEvaluationSchema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  submissionId: z.string().min(1, 'Submission is required'),
})

export const aiScoreSchema = z.object({
  aiScore: z.number()
    .min(0, 'Score must be at least 0')
    .max(100, 'Score must be at most 100'),
  feedback: z.string().optional(),
})

export type JudgeScoringFormValues = z.infer<typeof judgeScoringSchema>
export type CreateEvaluationFormValues = z.infer<typeof createEvaluationSchema>
export type AiScoreFormValues = z.infer<typeof aiScoreSchema>
