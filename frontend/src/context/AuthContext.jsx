import { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { authApi.me().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false)) }, [])
  const login = async (data) => { const next = await authApi.login(data); setUser(next.user || next); return next }
  const register = async (data) => { const next = await authApi.register(data); setUser(next.user || next); return next }
  const logout = async () => { try { await authApi.logout() } finally { setUser(null) } }
  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
}
export const useAuth = () => useContext(AuthContext)
