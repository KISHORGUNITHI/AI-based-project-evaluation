import { z } from 'zod'

// year uses { valueAsNumber: true } in register() so z.number() is correct here
export const studentProfileSchema = z.object({
  rollNumber: z.string().min(1, 'Roll number is required'),
  department: z.string().min(1, 'Department is required'),
  collegeName: z.string().min(1, 'College name is required'),
  phonenumber: z.string().regex(/^\d{10}$/, 'Must be exactly 10 digits'),
  year: z.number().int().min(1, 'Year must be 1-5').max(5, 'Year must be 1-5'),
  cgpa: z
    .string()
    .optional()
    .refine((v) => !v || (parseFloat(v) >= 0 && parseFloat(v) <= 10), {
      message: 'CGPA must be between 0 and 10',
    }),
  githubUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  leetcode: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  portfolio: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  linkedin: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

export type StudentProfileFormValues = z.infer<typeof studentProfileSchema>
