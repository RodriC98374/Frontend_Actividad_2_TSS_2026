import { createApiClient } from './http.js'

let token = null
export function setAccessToken(value) {
  token = value
}
export const api = createApiClient({
  baseUrl: import.meta.env.VITE_API_URL || '/api/v1',
  getToken: () => token,
  sessionAuth: true,
  getCsrfToken: () => {
    const value = document.cookie.split('; ').find(c => c.startsWith('XSRF-TOKEN='))
    return value ? decodeURIComponent(value.slice(11)) : null
  },
  onUnauthorized: () => window.dispatchEvent(new Event('session-expired')),
})

export async function prepareSession() {
  const base = import.meta.env.VITE_API_URL || '/api/v1'
  const url = new URL(base, window.location.origin)
  const response = await fetch(`${url.origin}/sanctum/csrf-cookie`, {
    credentials: 'include', headers: {Accept: 'application/json'}, signal: AbortSignal.timeout(30000),
  })
  if (!response.ok) throw new Error('No se pudo preparar la sesión. Intenta nuevamente.')
}
