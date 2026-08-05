import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
    if (!token) throw redirect({ to: '/login' })
    try {
      const session = await authService.getSession()
      if (!session?.user) throw redirect({ to: '/login' })
      const normalizedUser = {
        ...session.user,
        role: session.user.role?.toUpperCase() as any,
      }
      useAuthStore.getState().setUser(normalizedUser, token)
      return { user: normalizedUser }
    } catch {
      throw redirect({ to: '/login' })
    }
  },
  component: () => <Outlet />,
})
