import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Sun, Moon } from 'lucide-react'
import { queryKeys } from '@/lib/queryKeys'
import { judgeService } from '@/services/judgeService'
import { judgeProfileSchema } from '@/lib/validations/judgeSchemas'
import { useTheme } from '@/components/layout/ThemeProvider'
import { useAuthStore } from '@/store/authStore'
import type { z } from 'zod'
import type { Theme } from '@/components/layout/ThemeProvider'

export const Route = createFileRoute('/_authenticated/judge/settings')({ component: JudgeSettings })
type JudgeForm = z.infer<typeof judgeProfileSchema>

function JudgeSettings() {
  const [tab, setTab] = useState<'profile' | 'account'>('profile')
  const { theme, setTheme } = useTheme()
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const { data: profile, isError } = useQuery({ queryKey: queryKeys.judge.profile, queryFn: judgeService.getProfile, retry: false })
  const isCreate = isError || !profile

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<JudgeForm>({
    resolver: zodResolver(judgeProfileSchema),
  })

  useEffect(() => {
    if (profile) reset({
      organization: profile.organization ?? '',
      designation: profile.designation ?? '',
      experience: profile.experience ?? undefined,
      bio: profile.bio ?? '',
      expertise: (profile.expertise ?? []).join(', '),
    })
  }, [profile, reset])

  const mutation = useMutation({
    mutationFn: (d: JudgeForm) => {
      const payload = {
        ...d,
        expertise: d.expertise ? d.expertise.split(',').map(s => s.trim()).filter(Boolean) : [],
      }
      return isCreate ? judgeService.createProfile(payload) : judgeService.updateProfile(payload)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.judge.profile }); toast.success(isCreate ? 'Profile created!' : 'Profile updated!') },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="max-w-2xl space-y-6">
      <div><h2 className="text-2xl font-bold">Settings</h2></div>
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {[['profile', 'Profile'], ['account', 'Account']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k as typeof tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${tab === k ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}>{l}</button>
        ))}
      </div>

      {tab === 'profile' && (
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="rounded-2xl border bg-card p-6 space-y-4">
          <h3 className="font-semibold">{isCreate ? 'Create Judge Profile' : 'Edit Profile'}</h3>
          {[['organization','Organization'],['designation','Designation'],['bio','Bio']].map(([f,l]) => (
            <div key={f}>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{l}</label>
              <input {...register(f as keyof JudgeForm)} className="w-full px-4 py-2.5 border rounded-xl bg-background text-foreground outline-none focus:ring-2 focus:ring-pink-500 text-sm" />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Expertise (comma-separated)</label>
            <input {...register('expertise')} placeholder="AI, Backend, DevOps" className="w-full px-4 py-2.5 border rounded-xl bg-background text-foreground outline-none focus:ring-2 focus:ring-pink-500 text-sm" />
            {errors.expertise && <p className="mt-1 text-xs text-red-500">{String(errors.expertise.message)}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Experience (years)</label>
            <input {...register('experience', { valueAsNumber: true })} type="number" min={0} className="w-full px-4 py-2.5 border rounded-xl bg-background text-foreground outline-none focus:ring-2 focus:ring-pink-500 text-sm" />
          </div>
          <button type="submit" disabled={isSubmitting || mutation.isPending}
            className="bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl px-5 py-2 hover:opacity-90 flex items-center gap-2 transition disabled:opacity-60">
            {(isSubmitting || mutation.isPending) && <Loader2 size={14} className="animate-spin" />}
            {isCreate ? 'Create Profile' : 'Save Changes'}
          </button>
        </form>
      )}

      {tab === 'account' && (
        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-6 space-y-4">
            <h3 className="font-semibold">Account</h3>
            <input value={user?.name ?? ''} readOnly className="w-full px-4 py-2.5 border rounded-xl bg-muted text-muted-foreground text-sm cursor-not-allowed" />
            <input value={user?.email ?? ''} readOnly className="w-full px-4 py-2.5 border rounded-xl bg-muted text-muted-foreground text-sm cursor-not-allowed" />
          </div>
          <div className="rounded-2xl border bg-card p-6 space-y-4">
            <h3 className="font-semibold">Theme</h3>
            <div className="grid grid-cols-2 gap-3">
              {([['light','Light',Sun],['dark','Dark',Moon]] as [Theme,string,React.ElementType][]).map(([v,l,Icon]) => (
                <button key={v} onClick={() => setTheme(v)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition ${theme === v ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-border text-muted-foreground hover:border-orange-200'}`}>
                  <Icon size={20} className={theme === v ? 'text-orange-500' : 'text-muted-foreground'} />
                  <span className="text-xs font-medium">{l}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
