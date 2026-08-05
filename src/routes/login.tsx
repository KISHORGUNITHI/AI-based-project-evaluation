import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { loginSchema } from '@/lib/validations/authSchemas'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'
import type { z } from 'zod'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

type LoginForm = z.infer<typeof loginSchema>

function LoginPage() {
  const navigate = useNavigate()
  const { setUser } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await authService.signIn(data.email, data.password)

      if (data.rememberMe) {
        localStorage.setItem('token', res.token)
      } else {
        sessionStorage.setItem('token', res.token)
      }

      const normalizedUser = {
        ...res.user,
        role: res.user.role?.toUpperCase() as any,
      }
      setUser(normalizedUser, res.token)

      toast.success('Welcome back!')

      if (normalizedUser.role === 'JUDGE') {
        navigate({ to: '/judge/dashboard' })
      } else if (normalizedUser.role === 'ADMIN') {
        navigate({ to: '/admin/dashboard' })
      } else {
        navigate({ to: '/student/dashboard' })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      setError('root', { message: msg })
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-gradient-to-br from-orange-50 via-white to-pink-50">
      <div className="max-w-5xl w-full bg-white rounded-[32px] overflow-hidden shadow-2xl grid md:grid-cols-2">

        {/* LEFT SIDE */}
        <div className="flex-col justify-between hidden md:flex p-14 bg-gradient-to-br from-orange-50 via-white to-pink-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 text-xl font-bold text-white shadow-lg rounded-2xl bg-gradient-to-r from-orange-500 to-pink-600">
              AI
            </div>

            <span className="text-2xl font-bold text-slate-900">
              Eval<span className="text-pink-500">AI</span>
            </span>
          </div>

          <div className="flex justify-center">
            <div className="relative w-72 h-72">

              <div className="absolute inset-0 border-2 border-orange-100 rounded-full" />

              <div className="absolute border-2 border-pink-100 rounded-full inset-8" />

              <div className="absolute border-2 rounded-full inset-16 border-orange-50" />

              <div className="absolute flex items-center justify-center text-5xl bg-white rounded-full shadow-2xl inset-20">
                🤖
              </div>

              <div className="absolute w-4 h-4 bg-orange-400 rounded-full left-2 top-20" />

              <div className="absolute w-5 h-5 bg-pink-400 rounded-full right-2 top-40" />

              <div className="absolute w-3 h-3 bg-orange-300 rounded-full bottom-20 right-14" />
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              AI Project Evaluation
            </h2>

            <p className="mt-3 text-slate-500">
              Streamline project reviews with intelligent AI assessment.
            </p>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex flex-col justify-center p-10 md:p-14 bg-gradient-to-br from-white via-orange-50 to-pink-50">

          {/* Login Register Switch */}
          <div className="flex p-1.5 mb-8 rounded-full bg-white border border-orange-100 shadow-md">

            <span className="flex-1 py-3 text-sm font-bold text-center text-white rounded-full bg-gradient-to-r from-orange-500 to-pink-600">
              Log In
            </span>

            <Link
              to="/signup"
              className="flex-1 py-3 text-sm font-bold text-center text-slate-600"
            >
              Register
            </Link>
          </div>

          <h2 className="text-4xl font-bold text-slate-900">
            Welcome Back
          </h2>

          <p className="mt-2 text-slate-500">
            Enter your credentials to continue
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-8 space-y-4"
          >
            <div>
              <input
                {...register('email')}
                type="email"
                placeholder="Email Address"
                className="w-full px-5 py-4 transition bg-white border border-orange-100 shadow-sm outline-none rounded-2xl text-slate-900 focus:ring-2 focus:ring-pink-500"
              />

              {errors.email && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <input
                {...register('password')}
                type="password"
                placeholder="Password"
                className="w-full px-5 py-4 transition bg-white border border-orange-100 shadow-sm outline-none rounded-2xl text-slate-900 focus:ring-2 focus:ring-pink-500"
              />

              {errors.password && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                {...register('rememberMe')}
                type="checkbox"
                id="rememberMe"
              />

              <label
                htmlFor="rememberMe"
                className="text-sm text-slate-600"
              >
                Remember me
              </label>
            </div>

            {errors.root && (
              <p className="text-sm font-medium text-red-500">
                {errors.root.message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center w-full gap-2 py-4 font-bold text-white transition shadow-lg rounded-2xl bg-gradient-to-r from-orange-500 to-pink-600 hover:opacity-90 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In →'
              )}
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-slate-500">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-semibold text-pink-600 hover:text-pink-700"
            >
              Create Account
            </Link>
          </p>

          <div className="mt-4 flex items-center justify-center gap-4">
            <Link to="/judge-login" className="text-xs text-slate-400 hover:text-slate-600 transition">Judge Portal →</Link>
            <span className="text-slate-300">|</span>
            <Link to="/admin-login" className="text-xs text-slate-400 hover:text-slate-600 transition">Admin Portal →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}