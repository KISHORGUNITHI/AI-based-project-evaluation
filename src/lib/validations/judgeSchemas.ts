import { z } from 'zod'

// expertise is stored as comma-separated string in the form input,
// but we keep it as string in the form type and split it on submit.
// experience uses { valueAsNumber: true } in register() so we use z.number().
export const judgeProfileSchema = z.object({
  organization: z.string().optional(),
  designation: z.string().optional(),
  expertise: z.string().optional(),   // raw comma-separated string — split on submit
  experience: z.number().int().min(0).optional(),
  bio: z.string().optional(),
})

export type JudgeProfileFormValues = z.infer<typeof judgeProfileSchema>
