import { createFileRoute, redirect } from '@tanstack/react-router'
import { SidebarLayout } from '@/components/layout/SidebarLayout'

export const Route = createFileRoute('/_authenticated/admin')({
  beforeLoad: ({ context }) => {
    const ctx = context as { user?: { role: string } }
    if (!ctx.user) throw redirect({ to: '/login' })
    const userRole = ctx.user.role?.toUpperCase()
    if (userRole !== 'ADMIN') {
      if (userRole === 'STUDENT') throw redirect({ to: '/student/dashboard' })
      if (userRole === 'JUDGE') throw redirect({ to: '/judge/dashboard' })
      throw redirect({ to: '/login' })
    }
  },
  component: AdminLayout,
})

function AdminLayout() {
  return <SidebarLayout role="admin" />
}
