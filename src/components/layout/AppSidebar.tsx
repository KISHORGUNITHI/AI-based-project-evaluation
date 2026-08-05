import { Link, useRouterState } from '@tanstack/react-router'
import {
  LayoutDashboard, User, Users, FolderKanban, Star,
  Trophy, Bell, Settings, ClipboardList, BarChart3, LogOut, ChevronRight, Scale,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { notificationService } from '@/services/notificationService'

type Role = 'student' | 'judge' | 'admin'
interface NavItem { label: string; to: string; icon: React.ElementType }

function getNavItems(role: Role): NavItem[] {
  if (role === 'student') return [
    { label: 'Dashboard',    to: '/student/dashboard',     icon: LayoutDashboard },
    { label: 'Profile',      to: '/student/profile',       icon: User },
    { label: 'Teams',        to: '/student/teams',         icon: Users },
    { label: 'Projects',     to: '/student/projects',      icon: FolderKanban },
    { label: 'Evaluations',  to: '/student/evaluations',   icon: Star },
    { label: 'Leaderboard',  to: '/student/leaderboard',   icon: Trophy },
    { label: 'Notifications',to: '/student/notifications', icon: Bell },
    { label: 'Settings',     to: '/student/settings',      icon: Settings },
  ]
  if (role === 'judge') return [
    { label: 'Dashboard', to: '/judge/dashboard', icon: LayoutDashboard },
    { label: 'Reviews',   to: '/judge/reviews',   icon: ClipboardList },
    { label: 'Settings',  to: '/judge/settings',  icon: Settings },
  ]
  // admin
  return [
    { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Users',     to: '/admin/users',     icon: Users },
    { label: 'Judges',    to: '/admin/judges',    icon: Scale },
    { label: 'Projects',  to: '/admin/projects',  icon: FolderKanban },
    { label: 'Analytics', to: '/admin/analytics', icon: BarChart3 },
    { label: 'Settings',  to: '/admin/settings',  icon: Settings },
  ]
}

export function AppSidebar({ role, onClose }: { role: Role; onClose?: () => void }) {
  const router = useRouterState()
  const currentPath = router.location.pathname
  const { user, clearAuth } = useAuthStore()
  const items = getNavItems(role)

  // Fetch unread notification count for students only
  const notifsQ = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.getAll,
    enabled: role === 'student',
    refetchInterval: 30_000, // poll every 30s for new notifications
    staleTime: 15_000,
  })
  const unreadCount = role === 'student'
    ? (notifsQ.data ?? []).filter((n: any) => !n.read).length
    : 0

  const handleSignOut = async () => {
    try { await authService.signOut() } catch { /* ignore */ }
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    clearAuth()
    toast.success('Signed out')
    // redirect to appropriate login based on role
    if (role === 'admin') window.location.href = '/admin-login'
    else if (role === 'judge') window.location.href = '/judge-login'
    else window.location.href = '/login'
  }

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '??'

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      <div className="px-6 py-5 flex items-center gap-3 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm">AI</div>
        <span className="font-bold text-lg text-sidebar-foreground">EvalAI</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const active = currentPath.startsWith(item.to)
          const isBell = item.to === '/student/notifications'
          return (
            <Link key={item.to} to={item.to} onClick={onClose}
              className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground')}>
              <div className="relative">
                <item.icon size={17} />
                {isBell && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="flex-1">{item.label}</span>
              {isBell && unreadCount > 0 && !active && (
                <span className="text-[10px] font-bold text-orange-500">{unreadCount}</span>
              )}
              {active && <ChevronRight size={14} className="opacity-50" />}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-pink-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{initials}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">{user?.name ?? 'User'}</p>
            <p className="text-xs text-muted-foreground">{role.toUpperCase()}</p>
          </div>
          <button onClick={handleSignOut} className="text-muted-foreground hover:text-destructive transition" title="Sign out"><LogOut size={16} /></button>
        </div>
      </div>
    </div>
  )
}
