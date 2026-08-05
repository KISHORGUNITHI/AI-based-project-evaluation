import { createFileRoute, redirect } from '@tanstack/react-router'
import { SidebarLayout } from '@/components/layout/SidebarLayout'

export const Route = createFileRoute('/_authenticated/judge')({
  beforeLoad: ({ context }) => {
    const ctx = context as { user?: { role: string } }
    if (!ctx.user) throw redirect({ to: '/login' })
    const userRole = ctx.user.role?.toUpperCase()
    if (userRole !== 'JUDGE') {
      if (userRole === 'STUDENT') throw redirect({ to: '/student/dashboard' })
      if (userRole === 'ADMIN') throw redirect({ to: '/admin/dashboard' })
      throw redirect({ to: '/login' })
    }
  },
  component: JudgeLayout,
})

function JudgeLayout() {
  return <SidebarLayout role="judge" />
}
