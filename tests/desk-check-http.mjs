// Only the disposable API and synthetic account documented in README.md.
// Run AFTER PHPUnit, which recreates umss_testing. Leaves a study for UI review.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createApiClient } from '../src/services/http.js'

const fixtures = new URL('../../Backend_Actividad_2_TSS_2026/tests/Fixtures/desk-check/', import.meta.url)
const sample = await readFile(new URL('encuestas-controladas.csv', fixtures))
const expected = JSON.parse(await readFile(new URL('resultados-esperados.json', fixtures), 'utf8'))
assert.equal(createHash('sha256').update(sample).digest('hex'), expected.source_sha256)
let token
const api = createApiClient({ baseUrl: 'http://127.0.0.1:8002/api/v1', getToken: () => token })
const data = async promise => (await promise).data
const evidence = { started_at: new Date().toISOString(), source_sha256: expected.source_sha256, checks: [], status: 'RUNNING' }
const outputDirectory = new URL('../../informes/validacion-acredi/evidencias/', import.meta.url)
const output = new URL('desk-check-http.json', outputDirectory)
function checked(name) { evidence.checks.push(name); console.log(`OK: ${name}`) }
function close(expectedValue, actual) {
  if (expectedValue === null) assert.equal(actual, null)
  else assert.ok(typeof actual === 'number' && Math.abs(expectedValue - actual) <= 1e-9, `${expectedValue} != ${actual}`)
}

try {
  token = (await data(api.post('/auth/login', { email: 'frontend-ui@example.test', password: 'FrontendIntegration2026!' }, { token: null }))).access_token
  assert.ok(token)
  const capabilities = await data(api.get('/capabilities'))
  const dataset = await data(api.post('/datasets', { name: `Prueba de escritorio ${new Date().toISOString()}`, reference_period: '12 registros ficticios; no inferir población real' }))
  evidence.dataset_id = dataset.id
  checked('Inicio de sesión y estudio sintético aislado')
  const form = new FormData()
  form.set('dataset_id', dataset.id)
  form.set('csv_delimiter', ',')
  form.set('file', new Blob([sample]), 'encuestas-controladas.csv')
  const imported = await data(api.post('/imports', form))
  const item = await data(api.get(`/imports/${imported.id}`))
  const sheet = item.sheets[0]
  evidence.import_id = item.id
  assert.equal(sheet.row_count, 13)
  assert.equal(sheet.column_count, 5)
  const path = `/imports/${item.id}`
  let revision = (await data(api.put(`${path}/sheets/${sheet.id}`, {
    expected_configuration_revision: item.configuration_revision, selected: true, survey_type: 'titulados',
    dictionary_version: capabilities.dictionary_version, header_row: 1,
    data_region: { first_data_row: 2, last_data_row: 13, first_column_index: 0, last_column_index: 4 },
    columns: [{ column_index: 0, role: 'ignore' }, ...['T03', 'T08', 'T12', 'X07'].map((field_id, i) => ({ column_index: i + 1, role: 'field', field_id }))],
    multiselect_rules: [{ field_id: 'X07', representation: 'delimited_cell', column_index: 4, delimiter: ';' }],
  }))).configuration_revision
  const previous = await data(api.post(`${path}/validate`, { expected_configuration_revision: revision }))
  assert.equal(previous.counts.warning_issues, 3)
  const prepared = (await api.get(`${path}/validations/${previous.id}/rows`)).data
  assert.equal(prepared.length, 12)
  const raw = (await api.get(`${path}/sheets/${sheet.id}/preview`)).data
  const idByRow = new Map(raw.map(r => [r.row_number, r.id]))
  const decisions = expected.rows.filter(r => !r.included).map(r => ({ raw_row_id: idByRow.get(r.file_row), action: 'exclude', reason: r.exclusion_reason }))
  assert.ok(decisions.every(d => d.raw_row_id))
  revision = (await data(api.post(`${path}/row-decisions`, { expected_configuration_revision: revision, decisions }))).configuration_revision
  await assert.rejects(api.post(`${path}/commit`, { configuration_revision: revision, validation_run_id: previous.id, policy: { mode: 'append' } }, { headers: { 'Idempotency-Key': crypto.randomUUID() } }), e => e.status === 409)
  const before = await data(api.get(`/datasets/${dataset.id}/analytics/overview`, { query: { survey_type: 'titulados' } }))
  assert.equal(before.total_responses, 0)
  checked('Carga, tres incidencias, exclusiones motivadas y rechazo de validación antigua sin publicación')
  const run = await data(api.post(`${path}/validate`, { expected_configuration_revision: revision }))
  assert.equal(run.counts.included_rows, 10)
  assert.equal(run.counts.excluded_rows, 2)
  const body = { configuration_revision: revision, validation_run_id: run.id, policy: { mode: 'append' } }
  const options = { headers: { 'Idempotency-Key': crypto.randomUUID() } }
  const commit = await data(api.post(`${path}/commit`, body, options))
  assert.deepEqual(await data(api.post(`${path}/commit`, body, options)), commit)
  const responses = await api.get(`/datasets/${dataset.id}/responses`, { query: { survey_type: 'titulados', included: 1 } })
  assert.equal(responses.meta.total, 10)
  evidence.data_version = commit.data_version
  evidence.ui_url = `http://127.0.0.1:5175/estudios/${dataset.id}/estadisticas`
  checked('Revalidación e incorporación idempotente: 10 incluidas y versión 1')
  for (const [scenario, filters] of [['initial', []], ['T03_yes', [{ field_id: 'T03', operator: 'eq', value: true }]], ['empty', [{ field_id: 'T03', operator: 'eq', value: true }, { field_id: 'T03', operator: 'eq', value: false }]]]) {
    const reference = expected.scenarios[scenario]
    for (const [field_id, field] of Object.entries(reference.fields)) {
      const kind = field_id === 'T12' ? 'numeric-summary' : 'distribution'
      const result = await data(api.get(`/datasets/${dataset.id}/analytics/${kind}`, { query: { survey_type: 'titulados', field_id, filters } }))
      assert.equal(result.data_version, 1)
      assert.equal(result.total_responses, reference.total_responses)
      assert.equal(result.denominator, field.denominator)
      assert.deepEqual(result.states, field.states)
      if (kind === 'numeric-summary') {
        for (const key of ['count', 'mean', 'min', 'max', 'sample_standard_deviation']) close(field[key], result[key])
      } else {
        for (const item of result.items) {
          assert.equal(item.count, field.items[item.code].count)
          close(field.items[item.code].percentage, item.percentage)
        }
      }
    }
    const cross = await data(api.get(`/datasets/${dataset.id}/analytics/crosstab`, { query: { survey_type: 'titulados', field_id: 'T03', column_field_id: 'T08', filters } }))
    assert.equal(cross.denominator, reference.crosstab.denominator)
    for (const cell of cross.cells) {
      const ref = reference.crosstab.cells[`${cell.row_code}/${cell.column_code}`]
      assert.equal(cell.count, ref.count)
      close(ref.percentage, cell.percentage)
    }
    checked(`Referencia independiente por HTTP: ${scenario}, cuatro preguntas y cruce`)
  }
  await api.post('/auth/logout', {})
  await assert.rejects(api.get('/auth/me'), e => e.status === 401)
  checked('Cierre de sesión efectivo')
  evidence.status = 'PASSED'
} catch (error) {
  evidence.status = 'FAILED'
  evidence.error = { message: error.message, status: error.status ?? null }
  process.exitCode = 1
  console.error(error.message)
} finally {
  evidence.finished_at = new Date().toISOString()
  await mkdir(outputDirectory, { recursive: true })
  await writeFile(output, JSON.stringify(evidence, null, 2) + '\n')
  console.log(`Evidencia: ${output.pathname}`)
}
