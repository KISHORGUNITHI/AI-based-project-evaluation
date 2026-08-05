import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/judge/')({
  beforeLoad: () => {
    throw redirect({ to: '/judge/dashboard' })
  },
  component: () => null,
})
