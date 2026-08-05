import { api } from '@/lib/api'
import type { LoginResponse, SignupResponse, SessionResponse } from '@/types/auth'

export const authService = {
  signIn: (email: string, password: string) =>
    api
      .post<LoginResponse>('/api/auth/sign-in/email', { email, password })
      .then((r) => r.data),

  signUp: (
    name: string,
    email: string,
    password: string,
    role: 'STUDENT' | 'JUDGE',
    username?: string,
  ) =>
    api
      .post<SignupResponse>('/api/auth/sign-up/email', { name, email, password, role, username })
      .then((r) => r.data),

  signOut: () => api.post('/api/auth/sign-out').then((r) => r.data),

  getSession: () =>
    api.get<SessionResponse>('/api/auth/get-session').then((r) => r.data),

  forgotPassword: (email: string) =>
    api.post('/api/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (token: string, password: string) =>
    api
      .post('/api/auth/reset-password', { token, password })
      .then((r) => r.data),

  // Legacy alias for compatibility
  login: (email: string, password: string) =>
    api
      .post<LoginResponse>('/api/auth/sign-in/email', { email, password })
      .then((r) => r.data),
}
