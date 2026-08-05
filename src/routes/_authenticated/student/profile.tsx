import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { queryKeys } from '@/lib/queryKeys'
import { studentService } from '@/services/studentService'
import { studentProfileSchema } from '@/lib/validations/studentSchemas'
import { SkeletonCard } from '@/components/shared/LoadingSkeleton'
import { useAuthStore } from '@/store/authStore'
import type { z } from 'zod'

export const Route = createFileRoute('/_authenticated/student/profile')({
  component: StudentProfile,
})

type ProfileForm = z.infer<typeof studentProfileSchema>

function StudentProfile() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.student.profile,
    queryFn: studentService.getProfile,
    retry: false,
  })

  const isCreate = isError || !data

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(studentProfileSchema),
  })

  useEffect(() => {
    if (data) {
      reset({
        ...data,
        phonenumber: String(data.phonenumber),
        year: Number(data.year),
      } as ProfileForm)
    }
  }, [data, reset])

  const mutation = useMutation({
    mutationFn: isCreate
      ? studentService.createProfile
      : studentService.updateProfile,

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: queryKeys.student.profile,
      })

      qc.invalidateQueries({
        queryKey: queryKeys.student.dashboard,
      })

      toast.success(
        isCreate ? 'Profile created!' : 'Profile updated!'
      )

      if (isCreate) {
        navigate({
          to: '/student/dashboard',
        })
      }
    },

    onError: (e: Error) => toast.error(e.message),
  })

  const initials =
    user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? '??'

  return (
    <div className="max-w-4xl py-6 mx-auto space-y-6">

      {/* Profile Header */}
      <div className="flex items-center gap-5 p-8 border border-orange-100 shadow-xl rounded-3xl bg-gradient-to-br from-white via-orange-50 to-pink-50">

        <div className="flex items-center justify-center w-16 h-16 text-xl font-bold text-white rounded-full shadow-lg bg-gradient-to-r from-orange-500 to-pink-600">
          {initials}
        </div>

        <div>
          <p className="text-xl font-bold text-slate-900">
            {user?.name}
          </p>

          <p className="text-sm text-slate-500">
            {user?.email}
          </p>

          {data && (
            <p className="mt-1 text-sm text-slate-500">
              {data.department} • {data.collegeName} • Year {data.year}
            </p>
          )}
        </div>
      </div>

      {isCreate && !isLoading && (
        <div className="p-4 text-sm border rounded-2xl border-amber-200 bg-amber-50 text-amber-700">
          Complete your profile before creating teams or projects.
        </div>
      )}

      {isLoading ? (
        <SkeletonCard />
      ) : (
        <form
          onSubmit={handleSubmit((d) => mutation.mutate(d))}
          className="p-8 space-y-6 border border-orange-100 shadow-xl rounded-3xl bg-gradient-to-br from-white via-orange-50 to-pink-50"
        >
          <h3 className="text-2xl font-bold text-slate-900">
            {isCreate ? 'Create Profile' : 'Edit Profile'}
          </h3>

          {/* Basic Information */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(
              [
                ['rollNumber', 'Roll Number'],
                ['department', 'Department'],
                ['collegeName', 'College Name'],
                ['phonenumber', 'Phone Number'],
                ['cgpa', 'CGPA'],
              ] as const
            ).map(([field, label]) => (
              <div key={field}>
                <label className="block mb-2 text-sm font-medium text-slate-600">
                  {label}
                </label>

                <input
                  {...register(field)}
                  className="w-full px-5 py-3 transition bg-white border border-orange-100 shadow-sm outline-none rounded-2xl text-slate-900 focus:ring-2 focus:ring-pink-500"
                />

                {errors[field] && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors[field]?.message}
                  </p>
                )}
              </div>
            ))}

            <div>
              <label className="block mb-2 text-sm font-medium text-slate-600">
                Year
              </label>

              <input
                {...register('year', {
                  valueAsNumber: true,
                })}
                type="number"
                min={1}
                max={5}
                className="w-full px-5 py-3 transition bg-white border border-orange-100 shadow-sm outline-none rounded-2xl text-slate-900 focus:ring-2 focus:ring-pink-500"
              />

              {errors.year && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.year.message}
                </p>
              )}
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(
              [
                ['githubUrl', 'GitHub URL'],
                ['leetcode', 'LeetCode URL'],
                ['portfolio', 'Portfolio URL'],
                ['linkedin', 'LinkedIn URL'],
              ] as const
            ).map(([field, label]) => (
              <div key={field}>
                <label className="block mb-2 text-sm font-medium text-slate-600">
                  {label}
                </label>

                <input
                  {...register(field)}
                  className="w-full px-5 py-3 transition bg-white border border-orange-100 shadow-sm outline-none rounded-2xl text-slate-900 focus:ring-2 focus:ring-pink-500"
                />

                {errors[field] && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors[field]?.message}
                  </p>
                )}
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || mutation.isPending}
            className="flex items-center justify-center w-full gap-2 py-4 font-bold text-white transition shadow-lg rounded-2xl bg-gradient-to-r from-orange-500 to-pink-600 hover:opacity-90 disabled:opacity-60"
          >
            {(isSubmitting || mutation.isPending) && (
              <Loader2
                size={18}
                className="animate-spin"
              />
            )}

            {isCreate
              ? 'Create Profile'
              : 'Save Changes'}
          </button>
        </form>
      )}
    </div>
  )
}
