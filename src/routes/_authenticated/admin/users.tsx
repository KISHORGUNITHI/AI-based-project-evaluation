import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { Search, Loader2, UserX, Edit2, X, Check } from 'lucide-react'
import { queryKeys } from '@/lib/queryKeys'
import { adminService, type AdminUser } from '@/services/adminService'
import { ErrorCard } from '@/components/shared/ErrorCard'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { StatusBadge } from '@/components/shared/StatusBadge'

export const Route = createFileRoute('/_authenticated/admin/users')({ component: AdminUsers })

function RoleBadge({ role }: { role: string }) {
  return <StatusBadge status={role as any} />
}

function EditUserModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const qc = useQueryClient()
  const [name, setName] = useState(user.name)
  const [username, setUsername] = useState(user.username ?? '')

  const updateMut = useMutation({
    mutationFn: () => adminService.updateUser(user.id, { name, username }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.users })
      toast.success('User updated')
      onClose()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-card border border-border rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-foreground">Edit User</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)}
              placeholder="username or roll number"
              className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
            <input value={user.email} disabled
              className="w-full px-4 py-2.5 border border-border rounded-xl bg-muted/70 text-muted-foreground text-sm cursor-not-allowed outline-none" />
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="bg-white border border-slate-200 text-slate-700 font-medium rounded-xl px-4 py-2 hover:border-orange-300 hover:text-orange-600 transition">Cancel</button>
          <button disabled={updateMut.isPending} onClick={() => updateMut.mutate()}
            className="bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl px-4 py-2 hover:opacity-90 transition shadow-sm flex items-center gap-2 disabled:opacity-60">
            {updateMut.isPending && <Loader2 size={14} className="animate-spin" />}
            <Check size={14} /> Save
          </button>
        </div>
      </div>
    </div>
  )
}

function AdminUsers() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'STUDENT' | 'JUDGE' | 'ADMIN'>('ALL')
  const [page, setPage] = useState(1)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [deactivateId, setDeactivateId] = useState<string | null>(null)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [...queryKeys.admin.users, roleFilter, search, page],
    queryFn: () => adminService.getUsers({
      role: roleFilter === 'ALL' ? undefined : roleFilter,
      search: search || undefined,
      page,
      limit: 20,
    }),
  })

  const deactivateMut = useMutation({
    mutationFn: (id: string) => adminService.deactivateUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.users })
      setDeactivateId(null)
      toast.success('User sessions cleared — user has been logged out')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const users = data?.users ?? []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">User Management</h2>
          <p className="text-sm text-muted-foreground mt-1">View and manage all registered users</p>
        </div>
        {pagination && (
          <span className="bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900/30 rounded-full px-3 py-0.5 text-xs font-semibold shadow-sm w-fit shrink-0">
            {pagination.total} users
          </span>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-pulse" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search users or email…"
            className="w-full rounded-xl border border-border bg-background py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition" />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(['ALL', 'STUDENT', 'JUDGE', 'ADMIN'] as const).map(r => (
            <button key={r} onClick={() => { setRoleFilter(r); setPage(1) }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all border ${
                roleFilter === r
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white border-transparent shadow-sm'
                  : 'border-border bg-card text-muted-foreground hover:border-orange-200 hover:text-orange-600'
              }`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {isError ? (
        <ErrorCard message={(error as Error)?.message} onRetry={refetch} />
      ) : isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" /> Loading users…
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-sm">
          <p className="text-muted-foreground">No users found</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Name</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Username</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Email</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Role</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Verified</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Joined</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const initial = u.name.charAt(0).toUpperCase()
                return (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-orange-50/30 dark:hover:bg-orange-950/10 transition-colors">
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 text-white text-xs font-bold flex items-center justify-center shadow-sm shrink-0">
                          {initial}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{u.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle text-xs text-foreground/80">{u.username ? `@${u.username}` : '—'}</td>
                    <td className="px-4 py-3 align-middle text-xs text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3 align-middle"><RoleBadge role={u.role} /></td>
                    <td className="px-4 py-3 align-middle">
                      <StatusBadge status={u.emailVerified ? 'VERIFIED' : 'NOT_VERIFIED'} />
                    </td>
                    <td className="px-4 py-3 align-middle text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex gap-1">
                        <button onClick={() => setEditUser(u)}
                          className="text-slate-400 hover:text-orange-500 transition p-1.5 rounded-lg hover:bg-orange-50">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => setDeactivateId(u.id)}
                          title="Clear sessions (logout)"
                          className="text-slate-400 hover:text-red-500 transition p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400">
                          <UserX size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center gap-2 justify-center">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 rounded-lg border border-border text-sm disabled:opacity-40 hover:bg-muted text-muted-foreground transition">← Prev</button>
          <span className="text-sm text-muted-foreground">{page} / {pagination.totalPages}</span>
          <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 rounded-lg border border-border text-sm disabled:opacity-40 hover:bg-muted text-muted-foreground transition">Next →</button>
        </div>
      )}

      {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} />}

      <ConfirmDialog open={!!deactivateId} onOpenChange={() => setDeactivateId(null)}
        title="Deactivate User" description="This will clear all active sessions, forcing the user to log out immediately."
        onConfirm={() => deactivateId && deactivateMut.mutate(deactivateId)} isPending={deactivateMut.isPending}
        confirmLabel="Deactivate" variant="destructive" />
    </div>
  )
}
