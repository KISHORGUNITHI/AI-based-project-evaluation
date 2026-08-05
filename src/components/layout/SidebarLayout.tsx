import { useState } from 'react'
import { Outlet, useRouterState } from '@tanstack/react-router'
import { Menu, Sun, Moon } from 'lucide-react'
import { AppSidebar } from './AppSidebar'
import { useTheme } from './ThemeProvider'

type Role = 'student' | 'judge' | 'admin'

const PAGE_TITLES: Record<string, string> = {
  '/student/dashboard': 'Dashboard', '/student/profile': 'My Profile',
  '/student/teams': 'Teams', '/student/projects': 'Projects',
  '/student/evaluations': 'Evaluations', '/student/leaderboard': 'Leaderboard',
  '/student/notifications': 'Notifications', '/student/settings': 'Settings',
  '/judge/dashboard': 'Dashboard', '/judge/reviews': 'Reviews', '/judge/settings': 'Settings',
  '/admin/dashboard': 'Dashboard', '/admin/users': 'User Management',
  '/admin/projects': 'Projects', '/admin/analytics': 'Analytics', '/admin/settings': 'Settings',
}

export function SidebarLayout({ role }: { role: Role }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const router = useRouterState()
  const path = router.location.pathname
  const title = Object.entries(PAGE_TITLES).find(([k]) => path.startsWith(k))?.[1] ?? 'Dashboard'

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-60 shrink-0">
        <AppSidebar role={role} />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64">
            <AppSidebar role={role} onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 border-b border-border flex items-center px-4 gap-3 shrink-0 bg-background/80 backdrop-blur">
          <button className="md:hidden p-1.5 rounded-lg hover:bg-muted transition" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-bold flex-1 text-foreground">{title}</h1>
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-lg hover:bg-muted transition text-muted-foreground"
          >
            {resolvedTheme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
