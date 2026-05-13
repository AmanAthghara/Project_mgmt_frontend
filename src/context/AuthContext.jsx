import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

const TOKEN_KEY   = 'access_token'
const REFRESH_KEY = 'refresh_token'
const USER_KEY    = 'user'

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
  })
  const [loading, setLoading] = useState(true)

  console.log('%c[AUTH CTX] mount — user:', 'color:#a78bfa', user?.email ?? 'none')

  // Verify token on app load
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      console.log('%c[AUTH CTX] no token found, skipping verify', 'color:#8b919e')
      setLoading(false)
      return
    }

    console.log('%c[AUTH CTX] verifying stored token...', 'color:#a78bfa')
    authApi.getMe()
      .then(({ data }) => {
        console.log('%c[AUTH CTX] token valid — user:', 'color:#34d399', data.data.user.email)
        setUser(data.data.user)
        localStorage.setItem(USER_KEY, JSON.stringify(data.data.user))
      })
      .catch(() => {
        console.warn('%c[AUTH CTX] token invalid — clearing session', 'color:#fbbf24')
        clearSession()
      })
      .finally(() => setLoading(false))
  }, [])

  const saveSession = useCallback((data) => {
    console.log('%c[AUTH CTX] saving session', 'color:#34d399', data.user.email)
    localStorage.setItem(TOKEN_KEY,   data.access_token)
    localStorage.setItem(REFRESH_KEY, data.refresh_token)
    localStorage.setItem(USER_KEY,    JSON.stringify(data.user))
    setUser(data.user)
  }, [])

  const clearSession = useCallback(() => {
    console.log('%c[AUTH CTX] clearing session', 'color:#f87171')
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  const login = useCallback(async (credentials) => {
    console.log('%c[AUTH CTX] login()', 'color:#a78bfa')
    const { data } = await authApi.login(credentials)
    saveSession(data.data)
    toast.success(`Welcome back, ${data.data.user.first_name}!`)
    return data
  }, [saveSession])

  const logout = useCallback(() => {
    console.log('%c[AUTH CTX] logout()', 'color:#f87171')
    clearSession()
    toast.success('Logged out successfully')
  }, [clearSession])

  const updateUser = useCallback((updated) => {
    console.log('%c[AUTH CTX] updateUser()', 'color:#a78bfa', updated)
    const merged = { ...user, ...updated }
    setUser(merged)
    localStorage.setItem(USER_KEY, JSON.stringify(merged))
  }, [user])

  const isAuthenticated = !!user

  const value = {
    user,
    loading,
    isAuthenticated,
    saveSession,
    login,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
