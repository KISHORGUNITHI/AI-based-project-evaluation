import { api } from '@/lib/api'

export interface RealNotification {
  id: string
  type: string
  message: string
  read: boolean
  entityId?: string
  createdAt: string
}

export const notificationService = {
  getAll: () =>
    api
      .get<{ success: boolean; data: RealNotification[] }>('/api/notifications')
      .then((r) => r.data.data ?? []),

  markRead: (id: string) =>
    api
      .patch<{ success: boolean; message: string }>(`/api/notifications/${id}/read`)
      .then((r) => r.data),

  markAllRead: () =>
    api
      .patch<{ success: boolean; message: string }>('/api/notifications/read-all')
      .then((r) => r.data),
}
