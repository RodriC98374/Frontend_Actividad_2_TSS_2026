import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createApiClient,
  normalizeBase,
  ApiError,
} from '../src/services/http.js'
import {
  buildMapping,
  captureAnswers,
  displayValue,
} from '../src/utils/survey.js'

test('normaliza la base de la API sin duplicar el prefijo', () => {
  assert.equal(
    normalizeBase('http://localhost:8000/'),
    'http://localhost:8000/api/v1',
  )
  assert.equal(normalizeBase('/api/v1/'), '/api/v1')
  assert.equal(
    normalizeBase('https://example.test/api/v1'),
    'https://example.test/api/v1',
  )
})

test('envía JSON, autorización y filtros tipados como un único parámetro', async () => {
  const filters = [{ field_id: 'T08', operator: 'eq', value: false }]
  const api = createApiClient({
    baseUrl: 'http://localhost:8000',
    getToken: () => 'admin-test',
    fetcher: async (url, options) => {
      assert.equal(new URL(url).pathname, '/api/v1/datasets/test/responses')
      assert.deepEqual(
        JSON.parse(new URL(url).searchParams.get('filters')),
        filters,
      )
      assert.equal(options.headers.Authorization, 'Bearer admin-test')
      assert.equal(new URL(url).searchParams.get('included'), '0')
      assert.equal(new URL(url).searchParams.get('page'), '1')
      return Response.json({ data: [] })
    },
  })
  assert.deepEqual(
    await api.get('/datasets/test/responses', {
      query: { filters, included: 0, page: 1 },
    }),
    { data: [] },
  )
})

test('sube archivos como FormData sin convertirlos a JSON ni fijar boundary', async () => {
  const form = new FormData()
  form.set('dataset_id', 'dataset')
  form.set('file', new Blob(['T08\nSí']), 'encuesta.csv')
  const api = createApiClient({
    baseUrl: '/api/v1',
    fetcher: async (_, options) => {
      assert.equal(options.body, form)
      assert.equal(options.headers['Content-Type'], undefined)
      return Response.json({ data: { id: 'import' } })
    },
  })
  await api.post('/imports', form)
})

test('conserva detalles de validación y conflictos de concurrencia', async () => {
  const api = createApiClient({
    baseUrl: '/api/v1',
    fetcher: async () =>
      Response.json(
        {
          message: 'La revisión cambió',
          code: 'revision_conflict',
          errors: { revision: ['Actualiza'] },
        },
        { status: 409 },
      ),
  })
  await assert.rejects(
    api.post('/imports/x/commit', {}),
    (error) =>
      error instanceof ApiError &&
      error.status === 409 &&
      error.errors.revision[0] === 'Actualiza',
  )
})

test('una invitación usa su token propio y un 401 no cierra la sesión administrativa', async () => {
  let expired = 0
  const api = createApiClient({
    baseUrl: '/api/v1',
    getToken: () => 'admin',
    onUnauthorized: () => expired++,
    fetcher: async (_, options) => {
      assert.equal(options.headers.Authorization, 'Bearer invitacion')
      return Response.json({ message: 'Vencida' }, { status: 401 })
    },
  })
  await assert.rejects(api.get('/capture/schema', { token: 'invitacion' }))
  assert.equal(expired, 0)
})

test('una sesión administrativa vencida notifica una vez al proveedor de acceso', async () => {
  let expired = 0
  const api = createApiClient({
    baseUrl: '/api/v1',
    getToken: () => 'admin',
    onUnauthorized: () => expired++,
    fetcher: async () =>
      Response.json({ message: 'No autorizado' }, { status: 401 }),
  })
  await assert.rejects(api.get('/datasets'))
  assert.equal(expired, 1)
})

test('permite login sin propagar un token administrativo existente', async () => {
  const api = createApiClient({
    baseUrl: '/api/v1',
    getToken: () => 'anterior',
    fetcher: async (_, options) => {
      assert.equal(options.headers.Authorization, undefined)
      assert.deepEqual(JSON.parse(options.body), {
        email: 'test@example.test',
        password: 'solo-prueba',
      })
      return Response.json({ data: {} })
    },
  })
  await api.post(
    '/auth/login',
    { email: 'test@example.test', password: 'solo-prueba' },
    { token: null },
  )
})

test('conserva Idempotency-Key y una respuesta sin contenido', async () => {
  const api = createApiClient({
    baseUrl: '/api/v1',
    fetcher: async (_, options) => {
      assert.equal(options.headers['Idempotency-Key'], 'test-key')
      return new Response(null, { status: 204 })
    },
  })
  assert.equal(
    await api.post(
      '/imports/i/commit',
      {},
      { headers: { 'Idempotency-Key': 'test-key' } },
    ),
    null,
  )
})

test('descarga archivos con autorización en lugar de incluir tokens en URLs', async () => {
  const api = createApiClient({
    baseUrl: '/api/v1',
    getToken: () => 'admin',
    fetcher: async (url, options) => {
      assert.equal(url, '/api/v1/exports/id/download')
      assert.equal(options.headers.Authorization, 'Bearer admin')
      return new Response('contenido', {
        headers: { 'Content-Type': 'text/csv' },
      })
    },
  })
  assert.equal(
    await (await api.download('/exports/id/download')).text(),
    'contenido',
  )
})

test('distingue interrupción, error de conexión y respuesta HTML inesperada', async () => {
  const abort = createApiClient({
    baseUrl: '/api/v1',
    fetcher: async () => {
      throw new DOMException('Abortado', 'AbortError')
    },
  })
  await assert.rejects(abort.get('/datasets'), (e) => e.name === 'AbortError')
  const network = createApiClient({
    baseUrl: '/api/v1',
    fetcher: async () => {
      throw new TypeError('Failed to fetch')
    },
  })
  await assert.rejects(
    network.get('/datasets'),
    (e) => e.code === 'network_error',
  )
  const html = createApiClient({
    baseUrl: '/api/v1',
    fetcher: async () => new Response('<html />'),
  })
  await assert.rejects(
    html.get('/datasets'),
    (e) => e.code === 'invalid_response',
  )
})

test('el mapeo respeta posiciones, columnas omitidas y región confirmada', () => {
  const columns = [0, 1, 2, 3].map((column_index) => ({
    column_index,
    header: 'Repetido',
  }))
  assert.deepEqual(buildMapping(columns, { 1: 'T08', 3: 'T01' }, 1, 2), [
    { column_index: 1, role: 'field', field_id: 'T08' },
    { column_index: 2, role: 'ignore' },
  ])
})

test('el formulario conserva false y cero y limpia contactos sin consentimiento', () => {
  const fields = [
    'T03',
    'T04',
    'T31',
    'T32',
    'T08',
    'T12',
    'X03',
    'X04',
    'X07',
  ].map((id) => ({ id }))
  const values = captureAnswers(fields, {
    T03: false,
    T04: 'oculto',
    T31: false,
    T32: 'privado@example.test',
    T08: false,
    T12: 0,
    X03: 'desempleado',
    X04: 'oculto',
    X07: [],
  })
  assert.equal(values.T08, false)
  assert.equal(values.T12, 0)
  assert.equal(values.T04, null)
  assert.equal(values.T32, null)
  assert.equal(values.X04, null)
  assert.equal(values.X07, null)
  assert.deepEqual(
    Object.keys(values),
    fields.map((f) => f.id),
  )
  assert.equal(captureAnswers([{ id: 'T15' }], { T15: 'oculto' }).T15, null)
  assert.equal(displayValue(false), 'No')
  assert.equal(displayValue(0), '0')
  assert.equal(displayValue(null), '—')
})
