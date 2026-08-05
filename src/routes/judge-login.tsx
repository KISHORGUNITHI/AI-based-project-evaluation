import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Scale } from 'lucide-react'
import { loginSchema } from '@/lib/validations/authSchemas'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'
import type { z } from 'zod'

export const Route = createFileRoute('/judge-login')({
  component: JudgeLoginPage,
})

type LoginForm = z.infer<typeof loginSchema>

function JudgeLoginPage() {
  const navigate = useNavigate()
  const { setUser } = useAuthStore()

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await authService.signIn(data.email, data.password)
      const normalizedUser = {
        ...res.user,
        role: res.user.role?.toUpperCase() as any,
      }
      if (normalizedUser.role !== 'JUDGE') {
        setError('root', { message: 'This login is for judges only.' })
        return
      }
      if (data.rememberMe) localStorage.setItem('token', res.token)
      else sessionStorage.setItem('token', res.token)
      setUser(normalizedUser, res.token)
      toast.success('Welcome, Judge!')
      
      // Check if forced password change is required
      if ((res.user as unknown as Record<string, unknown>).mustChangePassword) {
        navigate({ to: '/judge/change-password' })
      } else {
        navigate({ to: '/judge/dashboard' })
      }
    } catch (err: unknown) {
      setError('root', { message: err instanceof Error ? err.message : 'Login failed' })
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-gradient-to-br from-orange-50 via-white to-pink-50">
      <div className="max-w-5xl w-full bg-white rounded-[32px] overflow-hidden shadow-2xl grid md:grid-cols-2">

        {/* LEFT */}
        <div className="hidden md:flex flex-col justify-between p-14 bg-gradient-to-br from-orange-50 via-white to-pink-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg">AI</div>
            <span className="text-2xl font-bold text-slate-900">Eval<span className="text-pink-500">AI</span></span>
          </div>

          <div className="flex justify-center">
            <div className="relative w-72 h-72">
              <div className="absolute inset-0 border-2 border-orange-100 rounded-full" />
              <div className="absolute inset-8 border-2 border-pink-100 rounded-full" />
              <div className="absolute inset-16 border-2 border-orange-50 rounded-full" />
              <div className="absolute inset-20 bg-white rounded-full shadow-2xl flex items-center justify-center text-5xl">⚖️</div>
              <div className="absolute w-4 h-4 bg-orange-400 rounded-full left-2 top-20" />
              <div className="absolute w-5 h-5 bg-pink-400 rounded-full right-2 top-40" />
              <div className="absolute w-3 h-3 bg-orange-300 rounded-full bottom-20 right-14" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 flex items-center justify-center">
                <Scale size={14} className="text-white" />
              </div>
              <span className="text-sm font-bold text-orange-600 uppercase tracking-wider">Judge Portal</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Judge Access</h2>
            <p className="mt-3 text-slate-500">Review and evaluate student projects with AI-assisted scoring.</p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col justify-center p-10 md:p-14 bg-gradient-to-br from-white via-orange-50 to-pink-50">

          {/* Portal badge */}
          <div className="flex items-center justify-center gap-2 mb-8 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-600 text-white text-sm font-bold shadow">
            <Scale size={14} />
            Judge Portal
          </div>

          <h2 className="text-4xl font-bold text-slate-900">Welcome, Judge</h2>
          <p className="mt-2 text-slate-500">Sign in to your judge account to continue</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <div>
              <input {...register('email')} type="email" placeholder="Judge Email Address"
                className="w-full px-5 py-4 bg-white border border-orange-100 shadow-sm outline-none rounded-2xl text-slate-900 focus:ring-2 focus:ring-pink-500 transition" />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div>
              <input {...register('password')} type="password" placeholder="Password"
                className="w-full px-5 py-4 bg-white border border-orange-100 shadow-sm outline-none rounded-2xl text-slate-900 focus:ring-2 focus:ring-pink-500 transition" />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>
            <div className="flex items-center gap-2">
              <input {...register('rememberMe')} type="checkbox" id="rememberMe" />
              <label htmlFor="rememberMe" className="text-sm text-slate-600">Remember me</label>
            </div>
            {errors.root && <p className="text-sm font-medium text-red-500">{errors.root.message}</p>}
            <button type="submit" disabled={isSubmitting}
              className="flex items-center justify-center w-full gap-2 py-4 font-bold text-white rounded-2xl bg-gradient-to-r from-orange-500 to-pink-600 shadow-lg hover:opacity-90 disabled:opacity-60 transition">
              {isSubmitting ? <><Loader2 size={18} className="animate-spin" />Signing In...</> : 'Sign In →'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-slate-500">
              Not a judge?{' '}
              <Link to="/login" className="font-semibold text-pink-600 hover:text-pink-700">Student Login</Link>
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
              <Link to="/login" className="hover:text-slate-600 transition">← Student Portal</Link>
              <span className="text-slate-300">|</span>
              <Link to="/admin-login" className="hover:text-slate-600 transition">Admin Portal →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
