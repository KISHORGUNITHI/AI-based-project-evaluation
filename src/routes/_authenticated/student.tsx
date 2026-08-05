import { createFileRoute, redirect } from '@tanstack/react-router'
import { SidebarLayout } from '@/components/layout/SidebarLayout'
import { studentService } from '@/services/studentService'

export const Route = createFileRoute('/_authenticated/student')({
  beforeLoad: async ({ context, location }) => {
    const ctx = context as { user?: { role: string } }
    if (!ctx.user) throw redirect({ to: '/login' })
    const userRole = ctx.user.role?.toUpperCase()
    if (userRole !== 'STUDENT') {
      if (userRole === 'JUDGE') throw redirect({ to: '/judge/dashboard' })
      if (userRole === 'ADMIN') throw redirect({ to: '/admin/dashboard' })
      throw redirect({ to: '/login' })
    }

    if (location.pathname !== '/student/profile') {
      try {
        await studentService.getProfile()
      } catch {
        throw redirect({ to: '/student/profile' })
      }
    }
  },
  component: StudentLayout,
})

function StudentLayout() {
  return <SidebarLayout role="student" />
}
