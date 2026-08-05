import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, Loader2, Scale, Copy, Eye, EyeOff, Trash2 } from 'lucide-react'
import { z } from 'zod'
import { api } from '@/lib/api'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { SkeletonCard } from '@/components/shared/LoadingSkeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'

export const Route = createFileRoute('/_authenticated/admin/judges')({ component: AdminJudges })

const createJudgeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  tempPassword: z.string().min(8, 'At least 8 characters'),
  organization: z.string().optional(),
  designation: z.string().optional(),
})

type CreateJudgeForm = z.infer<typeof createJudgeSchema>

type JudgeUser = {
  id: string
  name: string
  email: string
  createdAt: string
  judge?: { organization?: string; designation?: string; expertise?: string[] }
  mustChangePassword?: boolean
}

async function fetchJudges(): Promise<JudgeUser[]> {
  const r = await api.get<{ judges: JudgeUser[] } | JudgeUser[]>('/api/admin/judges')
  const d = r.data as Record<string, unknown>
  return (Array.isArray(r.data) ? r.data : (d.judges as JudgeUser[])) ?? []
}

async function deleteJudge(userId: string) {
  return api.delete(`/api/admin/judges/${userId}`).then(r => r.data)
}

function AdminJudges() {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null)

  const { data: judges = [], isLoading } = useQuery({
    queryKey: ['admin', 'judges'],
    queryFn: fetchJudges,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateJudgeForm>({
    resolver: zodResolver(createJudgeSchema),
    defaultValues: { tempPassword: generateTempPassword() },
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateJudgeForm) => api.post('/api/admin/judges', data).then(r => r.data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['admin', 'judges'] })
      setCreatedCredentials({ email: variables.email, password: variables.tempPassword })
      setCreateOpen(false)
      reset({ tempPassword: generateTempPassword() })
      toast.success('Judge account created!')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteJudge,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'judges'] }); setDeleteId(null); toast.success('Judge removed') },
    onError: (e: Error) => toast.error(e.message),
  })

  function copyCredentials() {
    if (!createdCredentials) return
    navigator.clipboard.writeText(`Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`)
    toast.success('Credentials copied!')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Judge Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Create and manage judge accounts</p>
        </div>
        <button onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl px-4 py-2 hover:opacity-90 transition shadow-sm">
          <Plus size={16} /> Add Judge
        </button>
      </div>

      {/* Credentials banner after creation */}
      {createdCredentials && (
        <div className="rounded-2xl border border-green-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-2">
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">✅ Judge account created — share these credentials securely</p>
          <div className="flex items-center gap-3 bg-background rounded-xl px-4 py-2.5 border border-border shadow-sm">
            <div className="flex-1 text-sm font-mono text-foreground">
              <p><span className="text-muted-foreground">Email:</span> {createdCredentials.email}</p>
              <p><span className="text-muted-foreground">Password:</span> {showPassword ? createdCredentials.password : '••••••••'}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowPassword(s => !s)} className="p-1.5 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              <button onClick={copyCredentials} className="p-1.5 text-muted-foreground hover:text-foreground">
                <Copy size={15} />
              </button>
            </div>
          </div>
          <p className="text-xs text-emerald-700 dark:text-emerald-500">The judge must log in at <strong>/login</strong> and will be prompted to change their password on first access.</p>
          <button onClick={() => setCreatedCredentials(null)} className="text-xs text-muted-foreground hover:text-foreground">Dismiss</button>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4">{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>
      ) : judges.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl shadow-sm p-8">
          <EmptyState title="No judges yet" description="Add judges so they can review and score projects."
            action={{ label: 'Add Judge', onClick: () => setCreateOpen(true) }} icon={<Scale size={24} />} />
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Judge</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Organization</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {judges.map(j => {
                const initial = j.name.charAt(0).toUpperCase()
                return (
                  <tr key={j.id} className="border-b border-border last:border-0 hover:bg-orange-50/30 dark:hover:bg-orange-950/10 transition-colors">
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 text-white text-xs font-bold flex items-center justify-center shadow-sm shrink-0">
                          {initial}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{j.name}</p>
                          <p className="text-xs text-muted-foreground">{j.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle text-muted-foreground">
                      <span className="font-medium text-foreground">{j.judge?.organization ?? '—'}</span>
                      {j.judge?.designation && <p className="text-xs text-muted-foreground mt-0.5">{j.judge.designation}</p>}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      {j.mustChangePassword ? (
                        <StatusBadge status="PENDING_JUDGE" />
                      ) : (
                        <StatusBadge status="ACTIVE" />
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <button onClick={() => setDeleteId(j.id)}
                        className="text-slate-300 hover:text-red-400 transition p-1.5 rounded-lg hover:bg-red-50 dark:hover:text-red-400">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Judge Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCreateOpen(false)} />
          <div className="relative z-10 bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h3 className="text-xl font-bold text-foreground">Add Judge</h3>
            <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Full Name *</label>
                  <input {...register('name')} placeholder="e.g. Dr. Anitha Rajan"
                    className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Email *</label>
                  <input {...register('email')} type="email" placeholder="judge@example.com"
                    className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Temporary Password *</label>
                  <div className="relative">
                    <input {...register('tempPassword')} type={showPassword ? 'text' : 'password'}
                      className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:ring-2 focus:ring-orange-500 text-sm pr-10" />
                    <button type="button" onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.tempPassword && <p className="mt-1 text-xs text-red-500">{errors.tempPassword.message}</p>}
                  <p className="mt-1 text-[10px] text-muted-foreground">Judge will be required to change this on first login</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Organization</label>
                    <input {...register('organization')} placeholder="University / Company"
                      className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Designation</label>
                    <input {...register('designation')} placeholder="Professor / Engineer"
                      className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setCreateOpen(false)}
                  className="bg-white border border-slate-200 text-slate-700 font-medium rounded-xl px-4 py-2 hover:border-orange-300 hover:text-orange-600 transition">Cancel</button>
                <button type="submit" disabled={createMutation.isPending}
                  className="bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl px-4 py-2 hover:opacity-90 transition shadow-sm flex items-center gap-2 disabled:opacity-60">
                  {createMutation.isPending && <Loader2 size={14} className="animate-spin" />} Create Judge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}
        title="Remove Judge" description="This will delete the judge account. This cannot be undone."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isPending={deleteMutation.isPending} confirmLabel="Remove" variant="destructive" />
    </div>
  )
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
