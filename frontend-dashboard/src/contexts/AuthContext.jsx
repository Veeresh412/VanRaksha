import { createContext, useContext, useMemo, useState } from 'react'
import { requestOtp, verifyOtp } from '../services/auth'

const AUTH_STORAGE_KEY = 'vanraksha_auth_session'

const AuthContext = createContext(null)

function getStoredSession() {
  const storedValue = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!storedValue) return null

  try {
    return JSON.parse(storedValue)
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(getStoredSession)
  const [isRequestingOtp, setIsRequestingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)

  const sendOtp = async (payload) => {
    setIsRequestingOtp(true)
    const result = await requestOtp(payload)
    setIsRequestingOtp(false)
    return result
  }

  const login = async (payload) => {
    setIsVerifyingOtp(true)
    const result = await verifyOtp(payload)
    setIsVerifyingOtp(false)

    if (!result.success) {
      return result
    }

    setSession(result.session)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(result.session))

    return result
  }

  const logout = () => {
    setSession(null)
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  const value = useMemo(
    () => ({
      session,
      sendOtp,
      login,
      logout,
      isAuthenticated: Boolean(session),
      isRequestingOtp,
      isVerifyingOtp,
    }),
    [session, isRequestingOtp, isVerifyingOtp],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
