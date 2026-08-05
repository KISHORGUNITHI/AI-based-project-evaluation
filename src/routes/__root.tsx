import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { queryClient } from '@/lib/queryClient'
import { ThemeProvider } from '@/components/layout/ThemeProvider'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Outlet />
        <Toaster richColors position="top-right" />
        {import.meta.env.DEV && (
          <>
            <TanStackRouterDevtools />
            <ReactQueryDevtools />
          </>
        )}
      </ThemeProvider>
    </QueryClientProvider>
  )
}
