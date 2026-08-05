// ─── Role ────────────────────────────────────────────────────────────────────

export type Role = 'STUDENT' | 'JUDGE' | 'ADMIN'

// ─── Request Types ────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  name: string
  email: string
  password: string
  role: 'STUDENT' | 'JUDGE'
}

// ─── Response Types ───────────────────────────────────────────────────────────

export interface User {
  id: string
  name: string
  email: string
  role: Role
  createdAt?: string
  updatedAt?: string
}

export interface AuthSession {
  token: string
  user: User
}

export interface LoginResponse {
  token: string
  user: User
}

export interface SignupResponse {
  message: string
  user: User
}

export interface SessionResponse {
  user: User
}

// ─── Error Types ──────────────────────────────────────────────────────────────

export interface ApiErrorResponse {
  message: string
  errors?: Record<string, string[]>
  statusCode?: number
}
