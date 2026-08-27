import { createContext, useContext, useMemo, useState } from 'react'
import {
  getDemoLoginProfiles,
  loginWithDemoProfile,
  requestOtpForPhone,
  verifyOtpForPhone,
} from '../services/auth'

const AUTH_STORAGE_KEY = 'vanraksha_auth_session'

const AuthContext = createContext(null)

function getStoredSession() {
  const storedValue = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!storedValue) return null

  try {
    const parsed = JSON.parse(storedValue)

    if (!parsed?.access_token) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }

    return parsed
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(getStoredSession)
  const [isRequestingOtp, setIsRequestingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [isLoggingInDemo, setIsLoggingInDemo] = useState(false)

  const demoProfiles = useMemo(() => getDemoLoginProfiles(), [])

  const requestOtp = async (payload) => {
    setIsRequestingOtp(true)
    const result = await requestOtpForPhone(payload)
    setIsRequestingOtp(false)

    return result
  }

  const verifyOtp = async (payload) => {
    setIsVerifyingOtp(true)
    const result = await verifyOtpForPhone(payload)
    setIsVerifyingOtp(false)

    if (!result.success) {
      return result
    }

    setSession(result.session)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(result.session))

    return result
  }

  const login = verifyOtp

  const loginDemo = async (profileId) => {
    setIsLoggingInDemo(true)
    const result = await loginWithDemoProfile(profileId)
    setIsLoggingInDemo(false)

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
      requestOtp,
      verifyOtp,
      login,
      loginDemo,
      logout,
      demoProfiles,
      isDemoLoginEnabled: demoProfiles.length > 0,
      isAuthenticated: Boolean(session?.access_token),
      isRequestingOtp,
      isVerifyingOtp,
      isLoggingInDemo,
      isLoggingIn: isVerifyingOtp || isLoggingInDemo,
    }),
    [session, isRequestingOtp, isVerifyingOtp, isLoggingInDemo, demoProfiles, login],
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
