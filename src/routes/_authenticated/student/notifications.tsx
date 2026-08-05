import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Bell, CheckCircle, Star, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { queryKeys } from '@/lib/queryKeys'
import { studentService } from '@/services/studentService'
import { notificationService } from '@/services/notificationService'
import type { Evaluation } from '@/types/evaluation'

export const Route = createFileRoute('/_authenticated/student/notifications')({ component: NotificationsPage })

interface Notification {
  id: string; title: string; description: string; icon: React.ElementType;
  createdAt: string; read: boolean
}

function deriveNotifications(evaluations: Evaluation[]): Notification[] {
  return evaluations.map(e => ({
    id: e.id,
    title: e.status === 'COMPLETED' ? 'Evaluation Completed' : e.status === 'AI_COMPLETED' ? 'AI Evaluation Done' : 'Evaluation Update',
    description: e.status === 'COMPLETED'
      ? `Final score: ${e.finalScore ?? 'N/A'} — ${e.project?.title ?? 'your project'}`
      : `Status changed to ${e.status.replace('_', ' ')} for ${e.project?.title ?? 'your project'}`,
    icon: e.status === 'COMPLETED' ? CheckCircle : e.status.includes('AI') ? Star : Bell,
    createdAt: e.updatedAt,
    read: false,
  }))
}

function NotificationsPage() {
  const qc = useQueryClient()
  const [readIds, setReadIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('notif_read') ?? '[]') } catch { return [] }
  })

  // Real notifications query
  const realNotifsQ = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.getAll,
    retry: 1, // Only retry once to avoid long delays if endpoint is missing (404)
  })

  // Evaluations query (for derived fallback)
  // Enabled if the real notifications query fails
  const evalsQ = useQuery({
    queryKey: queryKeys.student.evaluations,
    queryFn: studentService.getMyEvaluations,
    enabled: realNotifsQ.isError,
  })

  // Mutations for real notifications
  const markReadMut = useMutation({
    mutationFn: notificationService.markRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllReadMut = useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  // Check if we use real or derived notifications
  const isRealActive = realNotifsQ.isSuccess && realNotifsQ.data !== undefined

  // Standardized notification structure
  let notifications: Notification[] = []

  if (isRealActive && realNotifsQ.data) {
    notifications = realNotifsQ.data.map((n: any) => {
      // Map DB fields (type, message) to display fields (title, description)
      const titleMap: Record<string, string> = {
        AI_COMPLETE:          'AI Evaluation Complete',
        EVALUATION_COMPLETE:  'Evaluation Completed',
        JUDGE_ASSIGNED:       'Judge Assigned',
      }
      const iconMap: Record<string, React.ElementType> = {
        AI_COMPLETE:         Star,
        EVALUATION_COMPLETE: CheckCircle,
        JUDGE_ASSIGNED:      Bell,
      }
      return {
        id: n.id,
        title: titleMap[n.type] ?? n.type ?? 'Notification',
        description: n.message ?? '',
        icon: iconMap[n.type] ?? Bell,
        createdAt: n.createdAt,
        read: !!n.read,
      }
    })
  } else {
    // Derived notifications from evaluations
    const evaluations = (evalsQ.data as Evaluation[]) || []
    notifications = deriveNotifications(evaluations).map(n => ({
      ...n,
      read: readIds.includes(n.id),
    }))
  }

  const markRead = (id: string) => {
    if (isRealActive) {
      markReadMut.mutate(id)
    } else {
      const updated = [...new Set([...readIds, id])]
      setReadIds(updated)
      localStorage.setItem('notif_read', JSON.stringify(updated))
    }
  }

  const markAllRead = () => {
    if (isRealActive) {
      markAllReadMut.mutate()
    } else {
      const all = notifications.map(n => n.id)
      setReadIds(all)
      localStorage.setItem('notif_read', JSON.stringify(all))
    }
  }

  const isLoading = realNotifsQ.isLoading || (realNotifsQ.isError && evalsQ.isLoading)

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notifications</h2>
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Loading...' : `${notifications.filter(n => !n.read).length} unread`}
          </p>
        </div>
        {notifications.some(n => !n.read) && (
          <button onClick={markAllRead} className="text-xs text-orange-500 hover:underline">
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin mx-auto mb-3 opacity-50" size={32} />
          <p>Fetching your notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bell size={32} className="mx-auto mb-3 opacity-30" />
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n.id} onClick={() => markRead(n.id)}
              className={`flex items-start gap-4 rounded-2xl border p-4 cursor-pointer transition hover:bg-muted/50 ${!n.read ? 'bg-orange-50/50 dark:bg-orange-950/10 border-orange-200 dark:border-orange-900/30' : 'bg-card'}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${!n.read ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' : 'bg-muted text-muted-foreground'}`}>
                <n.icon size={17} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
