import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Sun, Moon, Monitor, Loader2, Settings2, Bot, UserCheck, CalendarDays, Building2, Users, Save, AlertCircle } from 'lucide-react'
import { z } from 'zod'
import { useTheme } from '@/components/layout/ThemeProvider'
import { useAuthStore } from '@/store/authStore'
import { adminService } from '@/services/adminService'
import { queryKeys } from '@/lib/queryKeys'
import type { Theme } from '@/components/layout/ThemeProvider'

export const Route = createFileRoute('/_authenticated/admin/settings')({ component: AdminSettings })

const settingsSchema = z.object({
  platformName:          z.string().min(1, 'Platform name is required').max(80),
  aiScoreWeight:         z.number().min(0).max(1),
  submissionDeadline:    z.string().optional(),
  maxTeamSize:           z.number().int().min(1).max(20),
  allowLateSubmissions:  z.boolean(),
})

type SettingsForm = z.infer<typeof settingsSchema>

function AdminSettings() {
  const qc = useQueryClient()
  const { theme, setTheme } = useTheme()
  const { user } = useAuthStore()

  const { data: settings, isLoading, isError } = useQuery({
    queryKey: queryKeys.admin.settings,
    queryFn:  adminService.getSettings,
    retry: 1,
  })

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting, isDirty } } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      platformName:         'EvalAI',
      aiScoreWeight:        0.4,
      submissionDeadline:   '',
      maxTeamSize:          5,
      allowLateSubmissions: false,
    },
    values: settings
      ? {
          platformName:         settings.platformName,
          aiScoreWeight:        settings.aiScoreWeight,
          submissionDeadline:   settings.submissionDeadline
            ? new Date(settings.submissionDeadline).toISOString().slice(0, 16)
            : '',
          maxTeamSize:          settings.maxTeamSize,
          allowLateSubmissions: settings.allowLateSubmissions,
        }
      : undefined,
  })

  const updateMutation = useMutation({
    mutationFn: (data: SettingsForm) =>
      adminService.updateSettings({
        platformName:         data.platformName,
        aiScoreWeight:        data.aiScoreWeight,
        submissionDeadline:   data.submissionDeadline || null,
        maxTeamSize:          data.maxTeamSize,
        allowLateSubmissions: data.allowLateSubmissions,
      }),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.admin.settings, updated)
      reset({
        platformName:         updated.platformName,
        aiScoreWeight:        updated.aiScoreWeight,
        submissionDeadline:   updated.submissionDeadline
          ? new Date(updated.submissionDeadline).toISOString().slice(0, 16)
          : '',
        maxTeamSize:          updated.maxTeamSize,
        allowLateSubmissions: updated.allowLateSubmissions,
      })
      toast.success('Platform settings saved!')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const aiWeight   = watch('aiScoreWeight')
  const judgeWeight = Math.round((1 - aiWeight) * 100)
  const aiPct       = Math.round(aiWeight * 100)

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your account, appearance, and platform configuration</p>
      </div>

      {/* ── Account ── */}
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Building2 size={16} className="text-orange-500" /> Account</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
            <input value={user?.name ?? ''} readOnly className="w-full px-4 py-2.5 border rounded-xl bg-muted/50 text-sm cursor-not-allowed" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
            <input value={user?.email ?? ''} readOnly className="w-full px-4 py-2.5 border rounded-xl bg-muted/50 text-sm cursor-not-allowed" />
          </div>
        </div>
        <input value="ADMIN" readOnly className="w-32 px-4 py-2.5 border rounded-xl bg-muted/50 text-sm cursor-not-allowed" />
      </div>

      {/* ── Appearance ── */}
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Sun size={16} className="text-orange-500" /> Appearance</h3>
        <div className="grid grid-cols-3 gap-3">
          {([['light', 'Light', Sun], ['dark', 'Dark', Moon], ['system', 'System', Monitor]] as [Theme, string, React.ElementType][]).map(([v, l, Icon]) => (
            <button key={v} onClick={() => setTheme(v)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition ${theme === v ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' : 'border-border hover:border-muted-foreground/30'}`}>
              <Icon size={20} className={theme === v ? 'text-orange-500' : 'text-muted-foreground'} />
              <span className="text-xs font-medium">{l}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Platform Settings ── */}
      <div className="rounded-2xl border bg-card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Settings2 size={16} className="text-orange-500" /> Platform Configuration
          </h3>
          {isLoading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
          {isError && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
              <AlertCircle size={12} /> Backend not connected — showing defaults
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-6">

          {/* Platform Name */}
          <div>
            <label className="text-sm font-medium mb-1.5 flex items-center gap-2 block">
              <Building2 size={14} className="text-orange-500" /> Platform Name
            </label>
            <input {...register('platformName')}
              className="w-full px-4 py-2.5 border rounded-xl bg-background text-foreground outline-none focus:ring-2 focus:ring-orange-400 text-sm" />
            {errors.platformName && <p className="mt-1 text-xs text-red-500">{errors.platformName.message}</p>}
            <p className="mt-1 text-xs text-muted-foreground">Shown in emails, reports, and the platform header.</p>
          </div>

          {/* Score Weight Slider */}
          <div>
            <label className="text-sm font-medium mb-3 flex items-center gap-2 block">
              <Bot size={14} className="text-orange-500" /> Score Weighting
            </label>
            <div className="space-y-4">
              {/* Visual breakdown */}
              <div className="flex rounded-xl overflow-hidden h-8 text-xs font-bold text-white">
                <div className="flex items-center justify-center bg-gradient-to-r from-orange-500 to-pink-500 transition-all"
                  style={{ width: `${aiPct}%` }}>
                  {aiPct >= 15 && `AI ${aiPct}%`}
                </div>
                <div className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                  style={{ width: `${judgeWeight}%` }}>
                  {judgeWeight >= 15 && `Judge ${judgeWeight}%`}
                </div>
              </div>

              {/* Slider */}
              <input
                type="range" min={0} max={1} step={0.05}
                value={aiWeight}
                onChange={e => setValue('aiScoreWeight', parseFloat(e.target.value), { shouldDirty: true })}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-orange-500 bg-muted"
              />

              {/* Labels */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100">
                  <Bot size={16} className="text-orange-500 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">AI Score Weight</p>
                    <p className="text-lg font-extrabold text-orange-500">{aiPct}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100">
                  <UserCheck size={16} className="text-blue-500 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Judge Score Weight</p>
                    <p className="text-lg font-extrabold text-blue-500">{judgeWeight}%</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Final Score = (AI Score × {aiPct}%) + (Judge Score × {judgeWeight}%). Currently hardcoded as 40/60 in the backend — changing this here will update the backend calculation once the API is connected.
              </p>
            </div>
          </div>

          {/* Submission Deadline */}
          <div>
            <label className="text-sm font-medium mb-1.5 flex items-center gap-2 block">
              <CalendarDays size={14} className="text-orange-500" /> Submission Deadline
            </label>
            <input {...register('submissionDeadline')} type="datetime-local"
              className="w-full px-4 py-2.5 border rounded-xl bg-background text-foreground outline-none focus:ring-2 focus:ring-orange-400 text-sm" />
            <p className="mt-1 text-xs text-muted-foreground">Leave empty for no deadline. Students will see this in their dashboard.</p>
          </div>

          {/* Max Team Size */}
          <div>
            <label className="text-sm font-medium mb-1.5 flex items-center gap-2 block">
              <Users size={14} className="text-orange-500" /> Max Team Size
            </label>
            <input {...register('maxTeamSize', { valueAsNumber: true })} type="number" min={1} max={20}
              className="w-32 px-4 py-2.5 border rounded-xl bg-background text-foreground outline-none focus:ring-2 focus:ring-orange-400 text-sm" />
            {errors.maxTeamSize && <p className="mt-1 text-xs text-red-500">{errors.maxTeamSize.message}</p>}
            <p className="mt-1 text-xs text-muted-foreground">Maximum number of students allowed per team.</p>
          </div>

          {/* Allow Late Submissions */}
          <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
            <div>
              <p className="text-sm font-medium">Allow Late Submissions</p>
              <p className="text-xs text-muted-foreground mt-0.5">If enabled, students can submit after the deadline.</p>
            </div>
            <button type="button"
              onClick={() => setValue('allowLateSubmissions', !watch('allowLateSubmissions'), { shouldDirty: true })}
              className={`relative w-11 h-6 rounded-full transition-colors ${watch('allowLateSubmissions') ? 'bg-gradient-to-r from-orange-500 to-pink-500' : 'bg-muted-foreground/30'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${watch('allowLateSubmissions') ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Save button */}
          <div className="flex items-center justify-between pt-2">
            {settings?.updatedAt && (
              <p className="text-xs text-muted-foreground">
                Last saved: {new Date(settings.updatedAt).toLocaleString()}
              </p>
            )}
            <button type="submit"
              disabled={isSubmitting || updateMutation.isPending || !isDirty}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold text-sm shadow hover:opacity-90 disabled:opacity-50 transition ml-auto">
              {(isSubmitting || updateMutation.isPending)
                ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                : <><Save size={14} /> Save Settings</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
