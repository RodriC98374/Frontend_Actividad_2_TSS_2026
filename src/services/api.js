const BASE_URL = import.meta.env.VITE_API_URL ?? ''

async function request(path, { method = 'GET', body, headers, ...options } = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    ...options,
  })

  if (!response.ok) {
    throw new Error(`${method} ${path} falló con estado ${response.status}`)
  }

  if (response.status === 204) return null

  return response.json()
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
}
