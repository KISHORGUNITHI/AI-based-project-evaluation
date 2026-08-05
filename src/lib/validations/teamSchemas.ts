import { z } from 'zod'

export const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required'),
  members: z.array(z.object({ studentId: z.string() })).optional(),
})

export const addMemberSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
})

export type CreateTeamFormValues = z.infer<typeof createTeamSchema>
export type AddMemberFormValues = z.infer<typeof addMemberSchema>
