import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useLocation } from 'react-router-dom'
import { AUTH_TOKEN_KEY, fetchCurrentUser } from '@/api/auth.ts'

export type AuthUser = {
  name: string
  userType: string
}

type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
  isLoggedIn: boolean
  isAdmin: boolean
  displayName: string
  logout: () => void
  setUser: (user: AuthUser | null) => void
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// JWT로 세션 조회 후 전역 유저 상태 제공
export function AuthProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshSession = useCallback(async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      setUser(null)
      return
    }

    try {
      const profile = await fetchCurrentUser(token)
      setUser({ name: profile.name, userType: profile.userType })
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      setIsLoading(true)
      await refreshSession()
      if (!cancelled) setIsLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [location.key, refreshSession])

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    const displayName = user?.name.trim().toUpperCase() ?? ''
    return {
      user,
      isLoading,
      isLoggedIn: user !== null,
      isAdmin: user?.userType === 'admin',
      displayName,
      logout,
      setUser,
      refreshSession,
    }
  }, [user, isLoading, logout, refreshSession])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
