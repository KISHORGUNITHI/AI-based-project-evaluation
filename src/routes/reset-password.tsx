import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute('/reset-password')({ component: ResetPasswordPage })

function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    toast.success('Password reset successfully! Please log in.')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-slate-50 to-pink-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white dark:bg-card rounded-[32px] p-10 shadow-xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 flex items-center justify-center text-white font-bold">AI</div>
          <span className="text-xl font-bold">EvalAI</span>
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Reset Password</h2>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="New password"
            className="w-full px-5 py-4 border border-slate-200 dark:border-slate-700 rounded-2xl bg-background text-foreground outline-none focus:ring-2 focus:ring-pink-500" />
          <input value={confirm} onChange={e => setConfirm(e.target.value)} type="password" placeholder="Confirm password"
            className="w-full px-5 py-4 border border-slate-200 dark:border-slate-700 rounded-2xl bg-background text-foreground outline-none focus:ring-2 focus:ring-pink-500" />
          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60">
            {loading ? <><Loader2 size={18} className="animate-spin" />Resetting…</> : 'Reset Password'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="text-pink-600 font-semibold">← Back to Login</Link>
        </p>
      </div>
    </div>
  )
}
