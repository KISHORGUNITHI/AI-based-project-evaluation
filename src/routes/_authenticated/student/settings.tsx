import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/components/layout/ThemeProvider'
import { useAuthStore } from '@/store/authStore'
import type { Theme } from '@/components/layout/ThemeProvider'

export const Route = createFileRoute('/_authenticated/student/settings')({ component: SettingsPage })

function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'account' | 'appearance' | 'notifications'>('account')
  const { theme, setTheme } = useTheme()
  const { user } = useAuthStore()
  const [emailNotifs, setEmailNotifs] = useState(() => localStorage.getItem('pref_email_notifs') !== 'false')
  const [evalAlerts, setEvalAlerts] = useState(() => localStorage.getItem('pref_eval_alerts') !== 'false')

  const tabs = [{ key: 'account', label: 'Account' }, { key: 'appearance', label: 'Appearance' }, { key: 'notifications', label: 'Notifications' }] as const

  return (
    <div className="max-w-2xl space-y-6">
      <div><h2 className="text-2xl font-bold">Settings</h2><p className="text-sm text-muted-foreground">Manage your account preferences</p></div>

      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${activeTab === t.key ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'account' && (
        <div className="rounded-2xl border bg-card p-6 space-y-4">
          <h3 className="font-semibold">Account Information</h3>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <input value={user?.name ?? ''} readOnly className="w-full mt-1 px-4 py-2.5 border rounded-xl bg-muted/50 text-sm cursor-not-allowed" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <input value={user?.email ?? ''} readOnly className="w-full mt-1 px-4 py-2.5 border rounded-xl bg-muted/50 text-sm cursor-not-allowed" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Role</label>
            <input value={user?.role ?? ''} readOnly className="w-full mt-1 px-4 py-2.5 border rounded-xl bg-muted/50 text-sm cursor-not-allowed" />
          </div>
        </div>
      )}

      {activeTab === 'appearance' && (
        <div className="rounded-2xl border bg-card p-6 space-y-4">
          <h3 className="font-semibold">Theme</h3>
          <div className="grid grid-cols-3 gap-3">
            {([['light', 'Light', Sun], ['dark', 'Dark', Moon], ['system', 'System', Monitor]] as [Theme, string, React.ElementType][]).map(([val, label, Icon]) => (
              <button key={val} onClick={() => setTheme(val)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition ${theme === val ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' : 'border-border hover:border-muted-foreground/30'}`}>
                <Icon size={20} className={theme === val ? 'text-orange-500' : 'text-muted-foreground'} />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="rounded-2xl border bg-card p-6 space-y-4">
          <h3 className="font-semibold">Notification Preferences</h3>
          {([
            ['Email Notifications', 'Receive updates via email', emailNotifs, setEmailNotifs, 'pref_email_notifs'] as const,
            ['Evaluation Alerts', 'Get notified when evaluations complete', evalAlerts, setEvalAlerts, 'pref_eval_alerts'] as const,
          ]).map(([label, desc, val, setter, key]) => (
            <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <button onClick={() => { const next = !val; setter(next); localStorage.setItem(key, String(next)) }}
                className={`w-10 h-5 rounded-full transition-colors relative ${val ? 'bg-orange-500' : 'bg-muted'}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${val ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
