import { createApiClient } from './http.js'

let token = null
export function setAccessToken(value) {
  token = value
}
export const api = createApiClient({
  baseUrl: import.meta.env.VITE_API_URL || '/api/v1',
  getToken: () => token,
  onUnauthorized: () => window.dispatchEvent(new Event('session-expired')),
})
