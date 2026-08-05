import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { signupSchema } from '@/lib/validations/authSchemas'
import { authService } from '@/services/authService'
import type { z } from 'zod'

export const Route = createFileRoute('/signup')({
  component: SignupPage,
})

type SignupForm = z.infer<typeof signupSchema>

function SignupPage() {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: 'STUDENT',
    },
  })

  const onSubmit = async (data: SignupForm) => {
    try {
      await authService.signUp(
        data.name,
        data.email,
        data.password,
        data.role,
        data.username,
      )

      toast.success('Account created! Please sign in.')

      navigate({ to: '/login' })
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Registration failed'

      setError('root', {
        message: msg,
      })
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-gradient-to-br from-orange-50 via-white to-pink-50">
      <div className="max-w-5xl w-full bg-white rounded-[32px] overflow-hidden shadow-2xl grid md:grid-cols-2">

        {/* LEFT PANEL */}
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
            <div className="relative flex items-center justify-center w-64 h-64">

              <div className="absolute inset-0 border-2 border-orange-100 rounded-full"></div>

              <div className="absolute border-2 border-pink-100 rounded-full inset-8"></div>

              <div className="absolute border-2 rounded-full inset-16 border-orange-50"></div>

              <div className="absolute flex items-center justify-center text-6xl bg-white rounded-full shadow-2xl inset-20">
                🎓
              </div>

              <div className="absolute w-4 h-4 bg-orange-400 rounded-full left-4 top-16"></div>

              <div className="absolute w-5 h-5 bg-pink-400 rounded-full right-4 top-32"></div>

              <div className="absolute w-3 h-3 bg-orange-300 rounded-full bottom-16 right-10"></div>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              Join EvalAI
            </h2>

            <p className="mt-3 text-slate-500">
              Create your account and start evaluating projects with AI.
            </p>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex flex-col justify-center p-10 md:p-14 bg-gradient-to-br from-white via-orange-50 to-pink-50">

          {/* LOGIN / REGISTER SWITCH */}
          <div className="flex p-1.5 mb-8 rounded-full bg-white border border-orange-100 shadow-md">

            <Link
              to="/login"
              className="flex-1 py-3 text-sm font-bold text-center text-slate-600"
            >
              Log In
            </Link>

            <span className="flex-1 py-3 text-sm font-bold text-center text-white rounded-full bg-gradient-to-r from-orange-500 to-pink-600">
              Register
            </span>
          </div>

          <h2 className="text-4xl font-bold text-slate-900">
            Create Account
          </h2>

          <p className="mt-2 text-slate-500">
            Enter your details to get started
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-8 space-y-4"
          >
            <div>
              <input
                {...register('name')}
                type="text"
                placeholder="Full Name"
                className="w-full px-5 py-4 transition bg-white border border-orange-100 shadow-sm outline-none rounded-2xl text-slate-900 focus:ring-2 focus:ring-pink-500"
              />

              {errors.name && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <input
                {...register('username')}
                type="text"
                placeholder="Username (e.g. roll number or @handle)"
                className="w-full px-5 py-4 transition bg-white border border-orange-100 shadow-sm outline-none rounded-2xl text-slate-900 focus:ring-2 focus:ring-pink-500"
              />

              {errors.username && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.username.message}
                </p>
              )}
            </div>

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
                placeholder="Password (min 8 characters)"
                className="w-full px-5 py-4 transition bg-white border border-orange-100 shadow-sm outline-none rounded-2xl text-slate-900 focus:ring-2 focus:ring-pink-500"
              />

              {errors.password && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <input
                {...register('confirmPassword')}
                type="password"
                placeholder="Confirm Password"
                className="w-full px-5 py-4 transition bg-white border border-orange-100 shadow-sm outline-none rounded-2xl text-slate-900 focus:ring-2 focus:ring-pink-500"
              />

              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.confirmPassword.message}
                </p>
              )}
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
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Creating Account...
                </>
              ) : (
                'Create Account →'
              )}
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-slate-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-pink-600 hover:text-pink-700"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
