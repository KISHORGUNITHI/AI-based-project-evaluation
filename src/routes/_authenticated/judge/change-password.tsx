import { createFileRoute } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, KeyRound } from 'lucide-react'
import { z } from 'zod'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

export const Route = createFileRoute('/_authenticated/judge/change-password')({ component: JudgeChangePassword })

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match', path: ['confirmPassword'],
}).refine(d => d.currentPassword !== d.newPassword, {
  message: 'New password must be different from current password', path: ['newPassword'],
})

type ChangePasswordForm = z.infer<typeof changePasswordSchema>

function JudgeChangePassword() {
  const { user, clearAuth } = useAuthStore()

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  })

  const onSubmit = async (data: ChangePasswordForm) => {
    try {
      // Use Better Auth's built-in change-password endpoint
      await api.post('/api/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })

      toast.success('Password changed! Please sign in with your new password.')

      // Clear auth and redirect to judge login
      localStorage.removeItem('token')
      localStorage.removeItem('auth_user')
      sessionStorage.removeItem('token')
      clearAuth()

      window.location.href = '/judge-login'
    } catch (err: unknown) {
      setError('root', { message: err instanceof Error ? err.message : 'Failed to change password' })
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md space-y-6">
        {/* Warning banner */}
        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <KeyRound size={18} />
            <p className="text-sm font-semibold">Action required</p>
          </div>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
            Welcome, {user?.name}! Your account was created by an administrator. Please set a new password before continuing.
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border bg-card p-6 space-y-5">
          <h2 className="text-xl font-bold">Set New Password</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Current Password</label>
              <input {...register('currentPassword')} type="password" placeholder="Your current / temporary password"
                className="w-full px-4 py-3 border rounded-xl bg-background text-foreground outline-none focus:ring-2 focus:ring-pink-500 text-sm" />
              {errors.currentPassword && <p className="mt-1 text-xs text-red-500">{errors.currentPassword.message}</p>}
            </div>

            <div>
              <label className="block mb-1 text-xs font-medium text-muted-foreground">New Password</label>
              <input {...register('newPassword')} type="password" placeholder="At least 8 characters"
                className="w-full px-4 py-3 text-sm border outline-none rounded-xl bg-background text-foreground focus:ring-2 focus:ring-pink-500" />
              {errors.newPassword && <p className="mt-1 text-xs text-red-500">{errors.newPassword.message}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Confirm New Password</label>
              <input {...register('confirmPassword')} type="password" placeholder="Repeat new password"
                className="w-full px-4 py-3 border rounded-xl bg-background text-foreground outline-none focus:ring-2 focus:ring-pink-500 text-sm" />
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
            </div>

            {errors.root && (
              <p className="px-3 py-2 text-sm text-red-500 rounded-lg bg-red-50 dark:bg-red-950/20">{errors.root.message}</p>
            )}

            <button type="submit" disabled={isSubmitting}
              className="flex items-center justify-center w-full gap-2 py-3 font-bold text-orange-600 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 dark:bg-orange-950/20 dark:hover:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/30 transition disabled:opacity-60">
              {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : 'Set Password & Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
