import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, type User } from './api.ts'

type Auth = {
  user: User | null
  loading: boolean
  setUser: (u: User | null) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<Auth | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<{ user: User }>('/me')
      .then((r) => setUser(r.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  async function logout() {
    await api('/auth/logout', { method: 'POST' })
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, setUser, logout }}>{children}</AuthContext.Provider>
}

export function useAuth(): Auth {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
