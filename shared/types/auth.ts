export interface SessionUser {
  id: string
  email: string
  displayName: string | null
  timezone: string
}

export interface AuthResponse {
  user: SessionUser
}
