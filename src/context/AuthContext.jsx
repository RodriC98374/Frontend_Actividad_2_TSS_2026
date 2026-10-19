import { useEffect, useState } from 'react'
import { api, setAccessToken } from '@/services/api.js'

import { AuthContext } from './auth.js'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [expired, setExpired] = useState(false)
  useEffect(() => {
    function expire() {
      setAccessToken(null)
      setUser(null)
      setExpired(true)
    }
    window.addEventListener('session-expired', expire)
    return () => window.removeEventListener('session-expired', expire)
  }, [])
  async function login(email, password) {
    const { data } = await api.post(
      '/auth/login',
      { email, password },
      { token: null },
    )
    setAccessToken(data.access_token)
    setUser(data.user)
    setExpired(false)
  }
  async function logout() {
    try {
      await api.post('/auth/logout')
    } finally {
      setAccessToken(null)
      setUser(null)
    }
  }
  return (
    <AuthContext.Provider value={{ user, expired, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
