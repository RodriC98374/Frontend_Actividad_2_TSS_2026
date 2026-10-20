import { useEffect, useState } from 'react'
import { api, setAccessToken, prepareSession } from '@/services/api.js'

import { AuthContext } from './auth.js'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [expired, setExpired] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sessionError, setSessionError] = useState(null)
  useEffect(() => {
    const controller = new AbortController()
    api.get('/auth/me', {signal: controller.signal, token: undefined})
      .then(({data}) => { if (!controller.signal.aborted) setUser(data) })
      .catch(e => { if (!controller.signal.aborted) { if (e.status !== 401) setSessionError(e); else setExpired(false) } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])
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
    await prepareSession()
    const { data } = await api.post(
      '/auth/login',
      { email, password, browser_session: true },
    )
    setAccessToken(null)
    setUser(data.user)
    setSessionError(null)
    setExpired(false)
  }
  async function logout() {
    await api.post('/auth/logout')
    setAccessToken(null)
    setUser(null)
  }
  return (
    <AuthContext.Provider value={{ user, expired, loading, sessionError, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
