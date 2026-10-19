export class ApiError extends Error {
  constructor(message, status, code, errors = {}) {
    super(message)
    this.name = 'ApiError'
    Object.assign(this, { status, code, errors })
  }
}

export function normalizeBase(value) {
  const base = value.replace(/\/+$/, '')
  return /^https?:\/\/[^/]+$/.test(base) ? `${base}/api/v1` : base
}

export function createApiClient({
  baseUrl,
  getToken = () => null,
  onUnauthorized = () => {},
  fetcher = (...args) => fetch(...args),
}) {
  const base = normalizeBase(baseUrl)
  async function request(
    path,
    {
      method = 'GET',
      body,
      query,
      token,
      headers,
      blob = false,
      ...options
    } = {},
  ) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query || {})) {
      if (value !== undefined && value !== null && value !== '')
        params.set(
          key,
          typeof value === 'object' ? JSON.stringify(value) : String(value),
        )
    }
    const access = token === undefined ? getToken() : token
    const multipart =
      typeof FormData !== 'undefined' && body instanceof FormData
    let response
    try {
      response = await fetcher(
        `${base}${path}${params.size ? `?${params}` : ''}`,
        {
          ...options,
          method,
          headers: {
            Accept: 'application/json',
            ...(access ? { Authorization: `Bearer ${access}` } : {}),
            ...(body !== undefined && !multipart
              ? { 'Content-Type': 'application/json' }
              : {}),
            ...headers,
          },
          body:
            body === undefined
              ? undefined
              : multipart
                ? body
                : JSON.stringify(body),
        },
      )
    } catch (error) {
      if (error.name === 'AbortError') throw error
      throw new ApiError(
        'No se pudo conectar con el servidor. Comprueba que el backend esté encendido.',
        0,
        'network_error',
      )
    }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      if (response.status === 401 && access && token === undefined)
        onUnauthorized()
      throw new ApiError(
        data.message || `La solicitud falló (${response.status}).`,
        response.status,
        data.code,
        data.errors,
      )
    }
    if (response.status === 204) return null
    if (blob) return response.blob()
    try {
      return await response.json()
    } catch {
      throw new ApiError(
        'El servidor no devolvió una respuesta JSON válida. Revisa la URL de la API.',
        response.status,
        'invalid_response',
      )
    }
  }
  return {
    get: (path, options) => request(path, options),
    post: (path, body, options) =>
      request(path, { ...options, method: 'POST', body }),
    put: (path, body, options) =>
      request(path, { ...options, method: 'PUT', body }),
    patch: (path, body, options) =>
      request(path, { ...options, method: 'PATCH', body }),
    delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
    download: (path, options) => request(path, { ...options, blob: true }),
  }
}
