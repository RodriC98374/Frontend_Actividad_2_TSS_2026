// Run only against the disposable API described in README.md, never the working API.
import assert from 'node:assert/strict'
import { createApiClient } from '../src/services/http.js'

const base = 'http://127.0.0.1:8001/api/v1'
let token
const api = createApiClient({ baseUrl: base, getToken: () => token })
const data = async (promise) => (await promise).data
const login = await data(
  api.post(
    '/auth/login',
    { email: 'frontend-ui@example.test', password: 'FrontendIntegration2026!' },
    { token: null },
  ),
)
assert.equal(login.user.name, 'Prueba de frontend')
token = login.access_token
assert.equal((await data(api.get('/auth/me'))).can_view_contacts, true)
const capabilities = await data(api.get('/capabilities'))
const catalog = await data(
  api.get('/catalog', { query: { survey_type: 'titulados' } }),
)
assert.ok(catalog.fields.some((f) => f.id === 'X07'))
const dataset = await data(
  api.post('/datasets', {
    name: `Verificación HTTP ${new Date().toISOString()}`,
    reference_period: 'Prueba sintética',
  }),
)
assert.equal((await data(api.get(`/datasets/${dataset.id}`))).id, dataset.id)
await api.get('/datasets', { query: { per_page: 1 } })

const file = new FormData()
file.set('dataset_id', dataset.id)
file.set(
  'file',
  new Blob(['T03,T08,T12\nSí,Sí,2\nNo,No,0\nSí,tal vez,4\n']),
  'smoke.csv',
)
file.set('csv_delimiter', ',')
const uploadResult = await data(api.post('/imports', file))
const uploaded = await data(api.get(`/imports/${uploadResult.id}`))
await api.get('/imports', { query: { per_page: 1 } })
const sheet = uploaded.sheets[0]
const path = `/imports/${uploaded.id}`
await api.get(`${path}/sheets/${sheet.id}/preview`, { query: { per_page: 5 } })
const assessment = await data(
  api.get(`${path}/sheets/${sheet.id}/assessment`, {
    query: { survey_type: 'titulados', header_row: 1 },
  }),
)
assert.equal(assessment.columns[1].field_candidates[0], 'T08')
let configured = await data(
  api.put(`${path}/sheets/${sheet.id}`, {
    expected_configuration_revision: uploaded.configuration_revision,
    selected: true,
    survey_type: 'titulados',
    dictionary_version: capabilities.dictionary_version,
    header_row: 1,
    data_region: {
      first_data_row: 2,
      last_data_row: 4,
      first_column_index: 0,
      last_column_index: 2,
    },
    columns: ['T03', 'T08', 'T12'].map((field_id, column_index) => ({
      column_index,
      role: 'field',
      field_id,
    })),
    multiselect_rules: [],
  }),
)
const profile = await data(
  api.post('/import-profiles', {
    name: 'Perfil de prueba HTTP',
    sheet_id: sheet.id,
  }),
)
await api.get('/import-profiles')
await api.get(`/import-profiles/${profile.id}`)
let validation = await data(
  api.post(`${path}/validate`, {
    expected_configuration_revision: configured.configuration_revision,
  }),
)
await api.get(`${path}/validations/${validation.id}/rows`)
const issues = await api.get(`${path}/issues`, {
  query: { validation_run_id: validation.id, code: 'invalid_value' },
})
assert.ok(issues.data.length > 0)
const review = await api.get(`${path}/review-summary`, {
  query: { validation_run_id: validation.id, code: 'invalid_value' },
})
assert.equal(review.summary.selectable_rows, 1)
configured = await data(
  api.post(`${path}/review-exclusions`, {
    validation_run_id: validation.id,
    expected_configuration_revision: configured.configuration_revision,
    expected_affected_rows: 1,
    selection: { code: 'invalid_value' },
    reason: 'Valor sintético no interpretable',
  }),
)
validation = await data(
  api.post(`${path}/validate`, {
    expected_configuration_revision: configured.configuration_revision,
  }),
)
const prepared = await api.get(`${path}/validations/${validation.id}/rows`)
const excludedRow = prepared.data.find((r) => !r.proposed_inclusion)
configured = await data(
  api.post(`${path}/row-decisions`, {
    expected_configuration_revision: configured.configuration_revision,
    decisions: [
      {
        raw_row_id: excludedRow.raw_row_id,
        action: 'exclude',
        reason: 'Confirmación individual de prueba',
      },
    ],
  }),
)
validation = await data(
  api.post(`${path}/validate`, {
    expected_configuration_revision: configured.configuration_revision,
  }),
)
const payload = {
  configuration_revision: configured.configuration_revision,
  validation_run_id: validation.id,
  policy: { mode: 'append' },
}
const options = { headers: { 'Idempotency-Key': crypto.randomUUID() } }
const committed = await data(api.post(`${path}/commit`, payload, options))
assert.deepEqual(
  await data(api.post(`${path}/commit`, payload, options)),
  committed,
)
assert.equal((await data(api.get(path))).status, 'committed')
const summary = await data(api.get(`/datasets/${dataset.id}/summary`))
assert.ok(summary.counts.length > 0)
const responses = await api.get(`/datasets/${dataset.id}/responses`, {
  query: { survey_type: 'titulados', included: 1, filters: [] },
})
assert.equal(responses.meta.total, 2)
let response = await data(api.get(`/responses/${responses.data[0].id}`))
await api.get(`/responses/${response.id}/contacts`)
response = await data(
  api.patch(`/responses/${response.id}`, {
    expected_response_revision: response.response_revision,
    reason: 'Corrección sintética de prueba',
    answers: [{ field_id: 'T12', value: 3, state: 'respondida' }],
  }),
)
assert.ok((await api.get(`/responses/${response.id}/history`)).data.length)
for (const [kind, query] of [
  ['distribution', { field_id: 'T08' }],
  ['numeric-summary', { field_id: 'T12' }],
  ['crosstab', { field_id: 'T03', column_field_id: 'T08' }],
]) {
  const specification = { survey_type: 'titulados', ...query, filters: [] }
  const result = await data(
    api.get(`/datasets/${dataset.id}/analytics/${kind}`, {
      query: specification,
    }),
  )
  assert.equal(result.denominator, 2)
  const exported = await data(
    api.post(`/datasets/${dataset.id}/exports`, {
      ...specification,
      kind,
      expected_data_version: result.data_version,
      format: 'csv',
    }),
  )
  assert.equal((await data(api.get(`/exports/${exported.id}`))).status, 'ready')
  assert.ok((await api.download(`/exports/${exported.id}/download`)).size)
}
const filtered = await data(
  api.get(`/datasets/${dataset.id}/analytics/distribution`, {
    query: {
      survey_type: 'titulados',
      field_id: 'T08',
      filters: [{ field_id: 'T08', operator: 'eq', value: false }],
    },
  }),
)
assert.equal(filtered.denominator, 1)
const invitation = await data(
  api.post(`/datasets/${dataset.id}/invitations`, { expires_in_hours: 1 }),
)
const captureSchema = await data(
  api.get('/capture/schema', { token: invitation.token }),
)
assert.ok(captureSchema.required_fields.includes('X01'))
await api.post(
  '/capture/submissions',
  {
    consent: true,
    answers: {
      X01: 2023,
      X03: 'sin_trabajo',
      X05: 'maestria',
      X06: 'ia',
      X07: ['beca'],
      T31: false,
    },
  },
  { token: invitation.token },
)
const unused = await data(api.post(`/datasets/${dataset.id}/invitations`, {}))
await api.delete(`/invitations/${unused.invitation.id}`)
await assert.rejects(
  api.get('/capture/schema', { token: unused.token }),
  (e) => e.status === 401,
)

const schema = await data(
  api.post('/schemas', { name: 'Cuestionario de prueba HTTP' }),
)
await api.get('/schemas')
let version = await data(api.post(`/schemas/${schema.id}/versions`, {}))
await api.get(`/schemas/${schema.id}/versions`)
const update = await data(
  api.put(`/schema-versions/${version.id}/fields`, {
    expected_revision: version.revision,
    fields: [
      {
        code: 'Q1',
        label: 'Años',
        type: 'number',
        unit: 'años',
        required: false,
        sensitive: false,
        options: [],
      },
      {
        code: 'Q2',
        label: 'Descartable',
        type: 'text',
        unit: null,
        required: false,
        sensitive: false,
        options: [],
      },
    ],
  }),
)
version = update.version
const definitions = await api.get(`/schema-versions/${version.id}/fields`)
version = await data(
  api.delete(
    `/schema-versions/${version.id}/fields/${definitions.data.find((f) => f.code === 'Q2').id}`,
    { query: { expected_revision: version.revision } },
  ),
)
version = await data(
  api.post(`/schema-versions/${version.id}/publish`, {
    expected_revision: version.revision,
  }),
)
assert.equal(
  (await data(api.get(`/schema-versions/${version.id}`))).status,
  'published',
)
await api.post(`/datasets/${dataset.id}/schema-bindings`, {
  schema_version_id: version.id,
})
assert.equal(
  (await api.get(`/datasets/${dataset.id}/schema-bindings`)).data.length,
  1,
)
await api.post('/auth/logout')
console.log(
  'Integración HTTP completa: acceso, archivos, perfiles, revisión, incorporación idempotente, corrección, estadísticas, exportación, captura y esquemas. Solo datos sintéticos en umss_testing.',
)
