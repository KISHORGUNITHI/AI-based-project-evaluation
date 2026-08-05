import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/store/authStore'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
    if (!token) throw redirect({ to: '/home' })

    // If logged in, go to the right dashboard
    const user = useAuthStore.getState().user
    const storedUser = localStorage.getItem('auth_user')
    const role = user?.role ?? (storedUser ? JSON.parse(storedUser)?.role : null)

    if (role === 'ADMIN')  throw redirect({ to: '/admin/dashboard' })
    if (role === 'JUDGE')  throw redirect({ to: '/judge/dashboard' })
    if (role === 'STUDENT') throw redirect({ to: '/student/dashboard' })

    throw redirect({ to: '/home' })
  },
  component: () => null,
})
