import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import useResource from '@/hooks/useResource.js'
import { api } from '@/services/api.js'
import {
  ActionForm,
  PageTitle,
  Resource,
  Select,
  Empty,
  Table,
} from '@/components/ui.jsx'
import { number, label } from '@/utils/format.js'
import { Filters } from '@/components/SurveyControls.jsx'

const kinds = {
  distribution: 'Distribución de respuestas',
  'numeric-summary': 'Resumen numérico',
  crosstab: 'Cruce de dos variables',
}
export default function AdvancedAnalytics() {
  const { dataset } = useOutletContext()
  const [survey, setSurvey] = useState('titulados')
  const [kind, setKind] = useState('distribution')
  const [field, setField] = useState('')
  const [column, setColumn] = useState('')
  const [filters, setFilters] = useState([])
  const [spec, setSpec] = useState(null)
  const [exported, setExported] = useState(null)
  const [savedMessage, setSavedMessage] = useState('')
  const catalog = useResource('/catalog', { survey_type: survey })
  const fields = catalog.data?.data.fields || []
  const eligible = fields.filter((f) =>
    f.analytics.includes(kind.replace('-', '_')),
  )
  const result = useResource(
    spec ? `/datasets/${dataset.id}/analytics/${spec.kind}` : null,
    spec ? { ...spec, kind: undefined } : {},
  )
  const data = result.data?.data
  const dirty =
    spec &&
    (spec.survey_type !== survey ||
      spec.kind !== kind ||
      spec.field_id !== (field || eligible[0]?.id) ||
      (kind === 'crosstab' &&
        spec.column_field_id !==
          (column || eligible[1]?.id || eligible[0]?.id)) ||
      JSON.stringify(spec.filters) !== JSON.stringify(filters))
  const selected = fields.find((f) => f.id === spec?.field_id)
  async function download(exportInfo) {
    const file = await api.download(`/exports/${exportInfo.id}/download`)
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = `encuestas-${exportInfo.id}.${exportInfo.specification.format}`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setSavedMessage('Descarga iniciada.')
  }
  return (
    <>
      <PageTitle
        title="Estadísticas"
        description="Resultados de respuestas incorporadas e incluidas en este estudio."
      />
      <section className="panel padded">
        <Resource resource={catalog}>
          <ActionForm
            submit="Consultar resultados"
            submitDisabled={!eligible.length}
            onSubmit={async () => {
              setSpec({
                survey_type: survey,
                kind,
                field_id: field || eligible[0].id,
                ...(kind === 'crosstab'
                  ? {
                      column_field_id:
                        column || eligible[1]?.id || eligible[0].id,
                    }
                  : {}),
                filters,
              })
              setExported(null)
              setSavedMessage('')
              if (spec) result.reload()
            }}
          >
            <div className="form-grid three">
              <Select
                label="Encuesta"
                value={survey}
                onChange={(e) => {
                  setSurvey(e.target.value)
                  setField('')
                  setColumn('')
                  setFilters([])
                  setSpec(null)
                  setExported(null)
                }}
                options={[
                  { value: 'titulados', label: 'Titulados' },
                  { value: 'empleadores', label: 'Empleadores' },
                ]}
              />
              <Select
                label="Análisis"
                value={kind}
                onChange={(e) => {
                  setKind(e.target.value)
                  setField('')
                  setColumn('')
                  setSpec(null)
                  setExported(null)
                }}
                options={Object.entries(kinds).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
              <Select
                label="Variable"
                value={field || eligible[0]?.id || ''}
                onChange={(e) => setField(e.target.value)}
                options={eligible.map((f) => ({
                  value: f.id,
                  label: `${f.id} · ${f.label}`,
                }))}
              />
              {kind === 'crosstab' && (
                <Select
                  label="Segunda variable (columnas)"
                  value={column || eligible[1]?.id || eligible[0]?.id || ''}
                  onChange={(e) => setColumn(e.target.value)}
                  options={eligible.map((f) => ({
                    value: f.id,
                    label: `${f.id} · ${f.label}`,
                  }))}
                />
              )}
            </div>
            <Filters fields={fields} value={filters} onChange={setFilters} />
          </ActionForm>
        </Resource>
      </section>
      {dirty && (
        <div className="notice">
          Cambiaste la consulta. Presiona «Consultar resultados» para actualizar
          el informe antes de exportarlo.
        </div>
      )}
      {spec ? (
        <Resource resource={result}>
          {data && (
            <>
              <div className="stat-strip">
                <div>
                  <span>
                    {kind === 'crosstab'
                      ? 'Pares válidos'
                      : 'Respuestas válidas'}
                  </span>
                  <strong>{number(data.denominator)}</strong>
                </div>
                <div>
                  <span>Respuestas después de filtros</span>
                  <strong>{number(data.total_responses)}</strong>
                </div>
                <div>
                  <span>Versión de datos</span>
                  <strong>{number(data.data_version)}</strong>
                </div>
              </div>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>{selected?.label || data.field_id}</h2>
                    <p className="muted">
                      {kinds[spec.kind]} · {data.field_id}
                      {data.column_field_id ? ` × ${data.column_field_id}` : ''}
                    </p>
                  </div>
                </div>
                {data.empty_reason && (
                  <div className="notice">
                    No hay respuestas válidas para este análisis. Los
                    porcentajes y promedios sin denominador se muestran como
                    «—».
                  </div>
                )}
                {spec.kind === 'distribution' && (
                  <Table
                    headers={[
                      'Respuesta',
                      { label: 'Personas', className: 'numeric' },
                      { label: 'Porcentaje', className: 'numeric' },
                    ]}
                  >
                    {data.items.map((o) => (
                      <tr key={o.code}>
                        <td>
                          <span>{o.label}</span>
                          <span className="bar-track" aria-hidden="true">
                            <span style={{ width: `${o.percentage || 0}%` }} />
                          </span>
                        </td>
                        <td className="numeric">{number(o.count)}</td>
                        <td className="numeric">
                          {o.percentage == null
                            ? '—'
                            : `${number(o.percentage)} %`}
                        </td>
                      </tr>
                    ))}
                  </Table>
                )}
                {spec.kind === 'numeric-summary' && (
                  <dl className="metrics-grid">
                    {[
                      ['count', 'Respuestas'],
                      ['mean', 'Media'],
                      ['min', 'Mínimo'],
                      ['max', 'Máximo'],
                      [
                        'sample_standard_deviation',
                        'Desviación estándar muestral',
                      ],
                    ].map(([key, text]) => (
                      <div key={key}>
                        <dt>{text}</dt>
                        <dd>{number(data[key])}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {spec.kind === 'crosstab' && (
                  <Table
                    headers={[
                      'Respuesta',
                      ...data.columns.map((c) => ({
                        label: c.label,
                        className: 'numeric',
                      })),
                    ]}
                  >
                    {data.rows.map((row) => (
                      <tr key={row.code}>
                        <td>{row.label}</td>
                        {data.columns.map((col) => {
                          const cell = data.cells.find(
                            (c) =>
                              c.row_code === row.code &&
                              c.column_code === col.code,
                          )
                          return (
                            <td key={col.code} className="numeric">
                              {number(cell?.count)}
                              <small className="cell-sub">
                                {cell?.percentage == null
                                  ? '—'
                                  : `${number(cell.percentage)} %`}
                              </small>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </Table>
                )}
                <p className="panel-note">
                  {data.multiple_selection
                    ? 'Multiselección: cada persona cuenta una vez por opción. La suma puede superar 100 %.'
                    : spec.kind === 'crosstab'
                      ? 'Porcentajes sobre el total de pares de respuestas válidas.'
                      : 'Denominador: personas con respuesta válida, después de aplicar los filtros.'}
                </p>
              </section>
              <div className="two-columns">
                <section className="panel">
                  <div className="panel-heading">
                    <h2>Estados de respuesta</h2>
                  </div>
                  <Table
                    headers={[
                      'Estado',
                      { label: 'Respuestas', className: 'numeric' },
                    ]}
                  >
                    {Object.entries(data.states).map(([state, count]) => (
                      <tr key={state}>
                        <td>{label(state)}</td>
                        <td className="numeric">{number(count)}</td>
                      </tr>
                    ))}
                  </Table>
                </section>
                <section className="panel padded">
                  <h2>Exportar este resultado</h2>
                  <p>
                    El archivo conserva filtros, denominador y versión. Si los
                    datos cambian, vuelve a consultar.
                  </p>
                  <ActionForm
                    submit="Generar y descargar"
                    disabled={!!dirty}
                    onSubmit={async (form) => {
                      const { data: exportInfo } = await api.post(
                        `/datasets/${dataset.id}/exports`,
                        {
                          ...spec,
                          format: form.get('format'),
                          expected_data_version: data.data_version,
                        },
                      )
                      setExported(exportInfo)
                      await download(exportInfo)
                    }}
                  >
                    <Select
                      label="Formato"
                      name="format"
                      options={[
                        { value: 'xlsx', label: 'Excel (.xlsx)' },
                        { value: 'csv', label: 'CSV (.csv)' },
                      ]}
                    />
                  </ActionForm>
                  {exported && (
                    <ActionForm
                      submit="Descargar nuevamente"
                      onSubmit={async () => {
                        const { data: current } = await api.get(
                          `/exports/${exported.id}`,
                        )
                        await download(current)
                      }}
                    />
                  )}
                  {savedMessage && <p role="status">{savedMessage}</p>}
                  <small className="muted">
                    Las exportaciones privadas vencen después de 7 días.
                  </small>
                </section>
              </div>
            </>
          )}
        </Resource>
      ) : (
        <Empty title="Elige una variable para analizar">
          El catálogo habilita los análisis compatibles con el tipo de cada
          pregunta.
        </Empty>
      )}
    </>
  )
}
