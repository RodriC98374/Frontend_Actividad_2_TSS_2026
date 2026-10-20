import { useConfirmDiscard } from '@/context/unsaved.js'
import { useRef, useState } from 'react'
import {
  Link,
  useNavigate,
  useOutletContext,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { api } from '@/services/api.js'
import { useAuth } from '@/context/auth.js'
import useResource from '@/hooks/useResource.js'
import {
  ActionForm,
  Field,
  Select,
  PageTitle,
  Resource,
  Empty,
  ErrorNotice,
  Status,
  Table,
  Pagination,
  Icon,
} from '@/components/ui.jsx'
import { number, date, surveyLabels } from '@/utils/format.js'
import { buildMapping, displayValue } from '@/utils/survey.js'

export default function Imports() {
  const [page, setPage] = useState(1)
  const [searchParams] = useSearchParams()
  const datasetId = searchParams.get('dataset_id') || undefined
  const resource = useResource('/imports', { page, per_page: 20, dataset_id: datasetId })
  return (
    <>
      <PageTitle
        title="Importaciones"
        description={datasetId ? "Importaciones del estudio seleccionado." : "Archivos originales, configuración y estado de incorporación."}
        actions={
          <Link className="button" to="/estudios">
            Elegir un estudio
          </Link>
        }
      />
      <Resource resource={resource}>
        {resource.data?.data.length ? (
          <section className="panel">
            <Table
              headers={[
                'Archivo',
                'Estado',
                { label: 'Filas leídas', className: 'numeric' },
                'Fecha',
                '',
              ]}
            >
              {resource.data.data.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link
                      className="entity-link"
                      to={`/importaciones/${item.id}`}
                    >
                      {item.original_name}
                    </Link>
                    <small className="cell-sub">
                      {item.source_label || 'Sin etiqueta de origen'}
                    </small>
                  </td>
                  <td>
                    <Status value={item.status} />
                  </td>
                  <td className="numeric">{number(item.counts?.read_rows)}</td>
                  <td>{date(item.created_at)}</td>
                  <td>
                    <Link
                      className="button small"
                      to={`/importaciones/${item.id}`}
                    >
                      Revisar
                    </Link>
                  </td>
                </tr>
              ))}
            </Table>
            <Pagination meta={resource.data?.meta} onPage={setPage} />
          </section>
        ) : (
          <Empty
            title="Todavía no hay archivos cargados"
            action={
              <Link className="button primary" to="/estudios">
                Abrir estudios
              </Link>
            }
          >
            Elige un estudio para comenzar una importación.
          </Empty>
        )}
      </Resource>
    </>
  )
}

export function Upload() {
  const { dataset } = useOutletContext()
  const { user } = useAuth()
  const navigate = useNavigate()
  const capabilities = useResource('/capabilities')
  const max = capabilities.data?.data.limits.max_bytes
  return (
    <>
      <PageTitle
        title="Importar un archivo"
        description={`Las respuestas se incorporarán a «${dataset.name}» después de revisarlas.`}
      />
      {!user.can_import_files ? (
        <div className="notice">
          La carga y el mapeo de originales requieren permiso de importación y originales.
          Solicita ese permiso al administrador del sistema.
        </div>
      ) : (
        <div className="settings-row">
          <div>
            <h2>Archivo de encuestas</h2>
            <p>
              Una fila por registro y una columna por variable. Puedes
              configurar hojas, encabezados y columnas después de cargarlo.
            </p>
            <ul className="plain-list">
              <li>Excel .xlsx o CSV.</li>
              <li>Los originales se conservan en el servidor.</li>
              <li>La carga no modifica las estadísticas.</li>
            </ul>
            <Resource resource={capabilities}>
              <p className="muted">
                Máximo {number(max / 1024 / 1024)} MB y{' '}
                {number(capabilities.data?.data.limits.max_rows)} filas por
                archivo.
              </p>
            </Resource>
          </div>
          <section className="panel padded">
            <ActionForm
              submit="Cargar y configurar"
              onSubmit={async (form) => {
                const file = form.get('file')
                if (!/\.(xlsx|csv)$/i.test(file.name))
                  throw new Error('Selecciona un archivo XLSX o CSV.')
                if (max && file.size > max)
                  throw new Error('El archivo supera el tamaño permitido.')
                form.set('dataset_id', dataset.id)
                const result = await api.post('/imports', form)
                navigate(`/importaciones/${result.data.id}`)
              }}
            >
              <div className="upload-field">
                <Icon name="upload" size={28} />
                <Field
                  label="Seleccionar archivo"
                  name="file"
                  type="file"
                  accept=".xlsx,.csv"
                  required
                />
                <small>
                  Confirma que tienes autorización para usar los datos del
                  archivo.
                </small>
              </div>
              <Field
                label="Etiqueta de origen (opcional)"
                name="source_label"
                maxLength={255}
                placeholder="Encuesta de seguimiento, gestión 2026"
              />
              <div className="form-grid">
                <Select
                  label="Separador si es CSV"
                  name="csv_delimiter"
                  defaultValue=","
                  options={[
                    { value: ',', label: 'Coma (,)' },
                    { value: ';', label: 'Punto y coma (;)' },
                    { value: '\t', label: 'Tabulación' },
                  ]}
                />
                <Select
                  label="Codificación si es CSV"
                  name="csv_encoding"
                  defaultValue="UTF-8"
                  options={['UTF-8', 'Windows-1252'].map((value) => ({
                    value,
                    label: value,
                  }))}
                />
              </div>
            </ActionForm>
          </section>
        </div>
      )}
    </>
  )
}

export function ImportDetail() {
  const { importId } = useParams()
  const resource = useResource(`/imports/${importId}`)
  const confirmDiscard = useConfirmDiscard()
  const [tab, setTab] = useState('configurar')
  const item = resource.data?.data
  const editable =
    item &&
    [
      'awaiting_configuration',
      'configured',
      'needs_review',
      'ready_to_commit',
    ].includes(item.status)
  return (
    <Resource resource={resource}>
      {item && (
        <>
          <div className="breadcrumb">
            <Link to="/importaciones">Importaciones</Link>
            <span>/</span>
            <Link to={`/estudios/${item.dataset_id}`}>Abrir estudio</Link>
          </div>
          <PageTitle
            title={item.original_name}
            description={`${item.source_label || 'Archivo de encuestas'} · Revisión ${item.configuration_revision}`}
            actions={
              <button className="button" onClick={resource.reload}>
                Actualizar
              </button>
            }
          />
          <div className="import-status">
            <Status value={item.status} />
            <span>{number(item.sheets.length)} hojas</span>
            <span>{date(item.created_at)}</span>
          </div>
          <ErrorNotice error={item.last_error} />
          {item.duplicate_import_ids?.length > 0 && (
            <div className="notice">
              Este archivo coincide con otra carga del estudio. Revisa los{' '}
              <Link to="/importaciones">archivos existentes</Link> antes de
              incorporarlo.
            </div>
          )}
          <nav className="tabs" aria-label="Pasos de la importación">
            {[
              ['configurar', '1. Configurar hojas'],
              ['revisar', '2. Validar y revisar'],
              ['incorporar', '3. Incorporar'],
            ].map(([value, text]) => (
              <button
                key={value}
                className={tab === value ? 'active' : ''}
                onClick={() => { if (value === tab || confirmDiscard()) setTab(value) }}
              >
                {text}
              </button>
            ))}
          </nav>
          {tab === 'configurar' && (
            <SheetConfiguration
              item={item}
              editable={editable}
              onSaved={resource.reload}
            />
          )}
          {tab === 'revisar' && (
            <ImportReview
              item={item}
              editable={editable}
              onSaved={resource.reload}
            />
          )}
          {tab === 'incorporar' && (
            <CommitImport item={item} onSaved={resource.reload} />
          )}
        </>
      )}
    </Resource>
  )
}

function SheetConfiguration({ item, editable, onSaved }) {
  const { user } = useAuth()
  const confirmDiscard = useConfirmDiscard()
  const [sheetId, setSheetId] = useState(item.sheets[0]?.id || '')
  const sheet = item.sheets.find((s) => s.id === sheetId)
  if (!user.can_import_files)
    return (
      <div className="notice">
        La vista previa y configuración de originales requieren permiso de
        importación. Puedes continuar con la revisión de datos preparados.
      </div>
    )
  return (
    <>
      <div className="toolbar">
        <Select
          label="Hoja del archivo"
          value={sheetId}
          onChange={(e) => { if (confirmDiscard()) setSheetId(e.target.value) }}
          options={item.sheets.map((s) => ({
            value: s.id,
            label: `${s.name} · ${s.row_count} filas, ${s.column_count} columnas`,
          }))}
        />
      </div>
      {sheet ? (
        <SheetEditor
          key={`${sheet.id}-${item.configuration_revision}`}
          item={item}
          sheet={sheet}
          editable={editable}
          onSaved={onSaved}
        />
      ) : (
        <Empty title="No hay hojas disponibles">
          Revisa el estado de lectura del archivo.
        </Empty>
      )}
    </>
  )
}

function SheetEditor({ item, sheet, editable, onSaved }) {
  const [survey, setSurvey] = useState(sheet.survey_type || 'titulados')
  const [header, setHeader] = useState(sheet.header_row || 1)
  const [firstRow, setFirstRow] = useState(
    sheet.data_region?.first_data_row || header + 1,
  )
  const [lastRow, setLastRow] = useState(
    sheet.data_region?.last_data_row || sheet.row_count,
  )
  const [firstColumn, setFirstColumn] = useState(
    sheet.data_region?.first_column_index || 0,
  )
  const [lastColumn, setLastColumn] = useState(
    sheet.data_region?.last_column_index ?? Math.max(0, sheet.column_count - 1),
  )
  const [mapping, setMapping] = useState(
    Object.fromEntries(
      (sheet.mapping || [])
        .filter((m) => m.role === 'field')
        .map((m) => [m.column_index, m.field_id]),
    ),
  )
  const [rules, setRules] = useState(
    Object.fromEntries(
      (sheet.multiselect_rules || []).map((r) => [r.field_id, r]),
    ),
  )
  const [page, setPage] = useState(1)
  const [profile, setProfile] = useState('')
  const [note, setNote] = useState('')
  const assessment = useResource(
    `/imports/${item.id}/sheets/${sheet.id}/assessment`,
    { survey_type: survey, header_row: header },
  )
  const preview = useResource(
    `/imports/${item.id}/sheets/${sheet.id}/preview`,
    { page, per_page: 8 },
  )
  const catalog = useResource('/catalog', {
    survey_type: survey,
    dictionary_version: item.dictionary_version,
  })
  const profiles = useResource('/import-profiles', { per_page: 100 })
  const columns = assessment.data?.data.columns || []
  const fields = catalog.data?.data.fields || []
  const mapped = buildMapping(columns, mapping, firstColumn, lastColumn)
  const multiple = fields.filter(
    (f) => f.type === 'multiselect' && mapped.some((c) => c.field_id === f.id),
  )
  function ruleFor(f) {
    return (
      rules[f.id] || {
        field_id: f.id,
        representation: 'delimited_cell',
        delimiter: ';',
      }
    )
  }
  function updateRule(f, update) {
    setRules((r) => ({ ...r, [f.id]: { ...ruleFor(f), ...update } }))
  }
  async function save() {
    const multiselect = multiple.map((f) => {
      const rule = ruleFor(f)
      const indexes = mapped
        .filter((c) => c.field_id === f.id)
        .map((c) => c.column_index)
      if (rule.representation === 'delimited_cell') {
        if (indexes.length !== 1)
          throw new Error(
            `La pregunta ${f.id} tiene varias columnas. Selecciona «Una columna por opción».`,
          )
        return {
          field_id: f.id,
          representation: rule.representation,
          column_index: indexes[0],
          delimiter: rule.delimiter,
        }
      }
      return {
        field_id: f.id,
        representation: 'option_columns',
        options: indexes.map((column_index) => ({
          column_index,
          option_code:
            rule.options?.find((o) => o.column_index === column_index)
              ?.option_code || '',
        })),
        selected_values: rule.selected_values || [
          1,
          '1',
          true,
          'Sí',
          'Si',
          'si',
        ],
        unselected_values: rule.unselected_values || [
          0,
          '0',
          false,
          null,
          '',
          'No',
          'no',
        ],
      }
    })
    await api.put(`/imports/${item.id}/sheets/${sheet.id}`, {
      expected_configuration_revision: item.configuration_revision,
      selected: true,
      survey_type: survey,
      dictionary_version: item.dictionary_version,
      header_row: header,
      data_region: {
        first_data_row: firstRow,
        last_data_row: lastRow,
        first_column_index: firstColumn,
        last_column_index: lastColumn,
      },
      columns: mapped,
      multiselect_rules: multiselect,
      import_profile_id: profile || null,
    })
    onSaved()
  }
  return (
    <>
      <section className="panel padded">
        <div className="panel-heading plain">
          <h2>Encabezado y región de datos</h2>
          {sheet.selected && (
            <span className="status status-ready">Hoja seleccionada</span>
          )}
        </div>
        <ActionForm
          submit="Guardar configuración de la hoja"
          disabled={!editable}
          submitDisabled={!columns.length || !fields.length}
          onSubmit={save}
        >
          <div className="form-grid three">
            <Select
              label="Encuesta"
              value={survey}
              onChange={(e) => {
                setSurvey(e.target.value)
                setMapping({})
                setRules({})
                setProfile('')
              }}
              options={Object.entries(surveyLabels).map(([value, text]) => ({
                value,
                label: text,
              }))}
            />
            <Field
              label="Fila del encabezado"
              type="number"
              min={1}
              max={Math.max(1, sheet.row_count - 1)}
              value={header}
              onChange={(e) => {
                const n = Number(e.target.value)
                setHeader(n)
                setFirstRow(n + 1)
              }}
              required
            />
            <div className="field">
              <label>Encabezados sugeridos</label>
              <div className="actions">
                {assessment.data?.data.header_candidates.map((c) => (
                  <button
                    className="button small"
                    type="button"
                    key={c.row_number}
                    onClick={() => {
                      setHeader(c.row_number)
                      setFirstRow(c.row_number + 1)
                    }}
                  >
                    Fila {c.row_number}
                  </button>
                )) || <span className="muted">Evaluando…</span>}
              </div>
            </div>
          </div>
          <div className="form-grid four">
            <Field
              label="Primera fila de datos"
              type="number"
              min={header + 1}
              max={sheet.row_count}
              value={firstRow}
              onChange={(e) => setFirstRow(Number(e.target.value))}
              required
            />
            <Field
              label="Última fila de datos"
              type="number"
              min={firstRow}
              max={sheet.row_count}
              value={lastRow}
              onChange={(e) => setLastRow(Number(e.target.value))}
              required
            />
            <Field
              label="Primera columna (desde 0)"
              type="number"
              min={0}
              max={lastColumn}
              value={firstColumn}
              onChange={(e) => setFirstColumn(Number(e.target.value))}
              required
            />
            <Field
              label="Última columna (desde 0)"
              type="number"
              min={firstColumn}
              max={sheet.column_count - 1}
              value={lastColumn}
              onChange={(e) => setLastColumn(Number(e.target.value))}
              required
            />
          </div>
          <div className="mapping-heading">
            <h2>Correspondencia de columnas</h2>
            <button
              className="button"
              type="button"
              disabled={!columns.length}
              onClick={() =>
                setMapping(
                  Object.fromEntries(
                    columns
                      .filter((c) => c.field_candidates.length === 1)
                      .map((c) => [c.column_index, c.field_candidates[0]]),
                  ),
                )
              }
            >
              Proponer coincidencias exactas
            </button>
          </div>
          <p className="muted">
            Las sugerencias necesitan tu revisión. Las columnas sin
            correspondencia se ignorarán.
          </p>
          <Resource resource={assessment}>
            <Resource resource={catalog}>
              <Table
                headers={[
                  'Columna',
                  'Encabezado original',
                  'No vacías / vacías',
                  'Pregunta del catálogo',
                ]}
              >
                {columns
                  .filter(
                    (c) =>
                      c.column_index >= firstColumn &&
                      c.column_index <= lastColumn,
                  )
                  .map((c) => (
                    <tr key={c.column_index}>
                      <td className="mono">{c.column_index}</td>
                      <td>{c.header || 'Sin encabezado'}</td>
                      <td>
                        {number(c.nonempty_count)} / {number(c.empty_count)}
                      </td>
                      <td>
                        <select
                          aria-label={`Pregunta para columna ${c.column_index}`}
                          value={mapping[c.column_index] || ''}
                          onChange={(e) =>
                            setMapping((m) => ({
                              ...m,
                              [c.column_index]: e.target.value,
                            }))
                          }
                        >
                          <option value="">Ignorar columna</option>
                          {fields.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.id} · {f.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
              </Table>
            </Resource>
          </Resource>
          {multiple.map((f) => {
            const r = ruleFor(f)
            const indexes = mapped
              .filter((c) => c.field_id === f.id)
              .map((c) => c.column_index)
            return (
              <div className="multi-config" key={f.id}>
                <h3>
                  {f.id} · {f.label}
                </h3>
                <Select
                  label="Cómo se representa la multiselección"
                  value={r.representation}
                  onChange={(e) =>
                    updateRule(f, { representation: e.target.value })
                  }
                  options={[
                    {
                      value: 'delimited_cell',
                      label: 'Varias opciones en una celda',
                    },
                    {
                      value: 'option_columns',
                      label: 'Una columna por opción',
                    },
                  ]}
                />
                {r.representation === 'delimited_cell' ? (
                  <Field
                    label="Separador entre opciones"
                    value={r.delimiter}
                    maxLength={5}
                    minLength={1}
                    onChange={(e) =>
                      updateRule(f, { delimiter: e.target.value })
                    }
                    required
                  />
                ) : (
                  <>
                    <div className="form-grid">
                      {indexes.map((index) => (
                        <Select
                          key={index}
                          label={`Opción de la columna ${index}`}
                          value={
                            r.options?.find((o) => o.column_index === index)
                              ?.option_code || ''
                          }
                          onChange={(e) =>
                            updateRule(f, {
                              options: [
                                ...(r.options || []).filter(
                                  (o) => o.column_index !== index,
                                ),
                                {
                                  column_index: index,
                                  option_code: e.target.value,
                                },
                              ],
                            })
                          }
                          required
                          options={[
                            { value: '', label: 'Seleccionar opción' },
                            ...f.options.map((o) => ({
                              value: o.code,
                              label: o.label,
                            })),
                          ]}
                        />
                      ))}
                    </div>
                    <p className="field-note">
                      Seleccionado: 1, «1», verdadero y «Sí/Si/si». No
                      seleccionado: 0, «0», falso, vacío y «No/no». Otras marcas
                      se reportarán como incidencia; adapta el archivo si
                      utiliza valores diferentes.
                    </p>
                  </>
                )}
              </div>
            )
          })}
          <details className="profile-details">
            <summary>Usar un perfil guardado</summary>
            <Resource resource={profiles}>
              <Select
                label="Perfil compatible (primera página, hasta 100)"
                value={profile}
                onChange={(e) => {
                  const p = profiles.data?.data.find(
                    (x) => x.id === e.target.value,
                  )
                  setProfile(e.target.value)
                  if (p) {
                    setHeader(p.settings.header_row)
                    setFirstRow(p.settings.data_region.first_data_row)
                    setLastRow(
                      p.settings.data_region.last_data_row || sheet.row_count,
                    )
                    setFirstColumn(p.settings.data_region.first_column_index)
                    setLastColumn(p.settings.data_region.last_column_index)
                    setMapping(
                      Object.fromEntries(
                        p.settings.columns
                          .filter((c) => c.role === 'field')
                          .map((c) => [c.column_index, c.field_id]),
                      ),
                    )
                    setRules(
                      Object.fromEntries(
                        p.settings.multiselect_rules.map((r) => [
                          r.field_id,
                          r,
                        ]),
                      ),
                    )
                  }
                }}
                options={[
                  { value: '', label: 'Sin perfil' },
                  ...(profiles.data?.data || [])
                    .filter(
                      (p) =>
                        p.survey_type === survey &&
                        p.dictionary_version === item.dictionary_version,
                    )
                    .map((p) => ({
                      value: p.id,
                      label: `${p.name} · v${p.profile_version}`,
                    })),
                ]}
              />
            </Resource>
            <p>
              Confirma que las posiciones y la región del perfil coincidan con
              este archivo.
            </p>
          </details>
          <label className="checkbox-row">
            <input type="checkbox" required />
            Confirmo el encabezado, la región, las columnas y las reglas de esta
            hoja.
          </label>
        </ActionForm>
        {editable && (
          <div className="actions secondary-actions">
            <ActionForm
              submit="Omitir esta hoja"
              onSubmit={async () => {
                await api.put(`/imports/${item.id}/sheets/${sheet.id}`, {
                  expected_configuration_revision: item.configuration_revision,
                  selected: false,
                  multiselect_rules: [],
                })
                onSaved()
              }}
            />
            <span className="field-note">
              Las hojas omitidas no se incorporan.
            </span>
          </div>
        )}
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h2>Vista previa de originales</h2>
          <span className="muted">Se conservan las posiciones del archivo</span>
        </div>
        <Resource resource={preview}>
          <Table
            headers={[
              'Fila',
              ...Array.from(
                { length: sheet.column_count },
                (_, i) => `Col. ${i}`,
              ),
            ]}
          >
            {preview.data?.data.map((row) => (
              <tr key={row.id}>
                <td className="mono">{row.row_number}</td>
                {Array.from({ length: sheet.column_count }, (_, index) => (
                  <td
                    key={index}
                    title={
                      row.original_cells.find((c) => c.column_index === index)
                        ?.type
                    }
                  >
                    {displayValue(
                      row.original_cells.find((c) => c.column_index === index)
                        ?.value,
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </Table>
          <Pagination meta={preview.data?.meta} onPage={setPage} />
        </Resource>
      </section>
      {sheet.selected && (
        <section className="panel padded">
          <h2>Guardar esta configuración como perfil</h2>
          <ActionForm
            submit="Guardar perfil"
            onSubmit={async (form) => {
              await api.post('/import-profiles', {
                name: form.get('name'),
                sheet_id: sheet.id,
              })
              setNote('Perfil guardado.')
              profiles.reload()
            }}
          >
            <Field
              label="Nombre del perfil"
              name="name"
              required
              maxLength={255}
            />
            <p className="muted">
              Guarda la configuración ya confirmada en el servidor.
            </p>
          </ActionForm>
          {note && <p role="status">{note}</p>}
        </section>
      )}
    </>
  )
}

function ImportReview({ item, editable, onSaved }) {
  const [view, setView] = useState('groups')
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({})
  const run = item.latest_validation_run_id
  const query = { validation_run_id: run, ...filters, page, per_page: 15 }
  const summary = useResource(
    run ? `/imports/${item.id}/review-summary` : null,
    query,
  )
  const issues = useResource(
    run && view === 'issues' ? `/imports/${item.id}/issues` : null,
    query,
  )
  const rows = useResource(
    run && view === 'rows'
      ? `/imports/${item.id}/validations/${run}/rows`
      : null,
    { page, per_page: 10 },
  )
  const [decision, setDecision] = useState(null)
  const [excluding, setExcluding] = useState(false)
  const current = summary.data?.summary.is_current
  function filter(key, value) {
    setFilters((old) => {
      const next = { ...old }
      if (value) next[key] = value
      else delete next[key]
      return next
    })
    setPage(1)
    setExcluding(false)
  }
  const counts = summary.data?.summary.validation_counts || item.counts
  return (
    <>
      <div className="review-toolbar">
        <div>
          <h2>Validación de la revisión {item.configuration_revision}</h2>
          <p>
            Las decisiones y cambios de configuración requieren validar de
            nuevo.
          </p>
        </div>
        <ActionForm
          submit="Validar configuración vigente"
          disabled={!editable || !item.sheets.some((s) => s.selected)}
          onSubmit={async () => {
            await api.post(`/imports/${item.id}/validate`, {
              expected_configuration_revision: item.configuration_revision,
            })
            onSaved()
            summary.reload()
            issues.reload()
            rows.reload()
          }}
        />
      </div>
      {!run ? (
        <Empty title="Todavía no hay una validación">
          Configura al menos una hoja y valida para revisar las respuestas
          preparadas.
        </Empty>
      ) : (
        <>
          <Resource resource={summary}>
            <div className="stat-strip">
              <div>
                <span>Filas incluidas</span>
                <strong>{number(counts?.included_rows)}</strong>
              </div>
              <div>
                <span>Filas excluidas</span>
                <strong>{number(counts?.excluded_rows)}</strong>
              </div>
              <div>
                <span>Advertencias</span>
                <strong>{number(counts?.warning_issues)}</strong>
              </div>
              <div>
                <span>Bloqueos</span>
                <strong>{number(counts?.blocking_issues)}</strong>
              </div>
            </div>
            {!current && (
              <div className="notice">
                Esta validación ya no corresponde a la revisión vigente. Vuelve
                a validar antes de incorporar o excluir por grupo.
              </div>
            )}
            <div className="toolbar">
              <Select
                label="Ver"
                value={view}
                onChange={(e) => {
                  setView(e.target.value)
                  setPage(1)
                }}
                options={[
                  { value: 'groups', label: 'Incidencias agrupadas' },
                  { value: 'issues', label: 'Incidencias individuales' },
                  { value: 'rows', label: 'Filas preparadas' },
                ]}
              />
              {view !== 'rows' && (
                <>
                  <Select
                    label="Gravedad"
                    value={filters.severity || ''}
                    onChange={(e) => filter('severity', e.target.value)}
                    options={[
                      { value: '', label: 'Todas' },
                      { value: 'warning', label: 'Advertencias' },
                      { value: 'blocking', label: 'Bloqueos' },
                    ]}
                  />
                  <Field
                    label="Pregunta"
                    placeholder="Ej. T08"
                    value={filters.field_id || ''}
                    onChange={(e) => filter('field_id', e.target.value)}
                  />
                  <Field
                    label="Código de incidencia"
                    value={filters.code || ''}
                    onChange={(e) => filter('code', e.target.value)}
                  />
                  {Object.keys(filters).length > 0 && (
                    <button
                      className="button"
                      onClick={() => {
                        setFilters({})
                        setPage(1)
                        setExcluding(false)
                      }}
                    >
                      Limpiar filtros
                    </button>
                  )}
                </>
              )}
            </div>
            {view === 'groups' && (
              <section className="panel">
                <Table
                  headers={[
                    'Incidencia',
                    'Pregunta',
                    'Gravedad',
                    { label: 'Filas', className: 'numeric' },
                    '',
                  ]}
                >
                  {summary.data?.data.map((group, index) => (
                    <tr key={index}>
                      <td>{group.code}</td>
                      <td>{group.field_id || '—'}</td>
                      <td>
                        <Status value={group.severity} />
                      </td>
                      <td className="numeric">{number(group.affected_rows)}</td>
                      <td>
                        <button
                          className="button small"
                          onClick={() => {
                            setFilters({
                              code: group.code,
                              severity: group.severity,
                              ...(group.field_id
                                ? { field_id: group.field_id }
                                : {}),
                            })
                            setPage(1)
                            setExcluding(false)
                          }}
                        >
                          Seleccionar grupo
                        </button>
                      </td>
                    </tr>
                  ))}
                </Table>
                {!summary.data?.data.length && (
                  <p className="panel-body">
                    No hay incidencias para esta selección.
                  </p>
                )}
                <Pagination meta={summary.data?.meta} onPage={setPage} />
              </section>
            )}
            {view === 'issues' && (
              <Resource resource={issues}>
                <section className="panel">
                  <Table
                    headers={[
                      'Fila original',
                      'Pregunta',
                      'Gravedad',
                      'Detalle',
                    ]}
                  >
                    {issues.data?.data.map((i) => (
                      <tr key={i.id}>
                        <td>{i.raw_row_id || '—'}</td>
                        <td>{i.field_id || '—'}</td>
                        <td>
                          <Status value={i.severity} />
                        </td>
                        <td>
                          <strong>{i.code}</strong>
                          <small className="cell-sub">{i.message}</small>
                        </td>
                      </tr>
                    ))}
                  </Table>
                  <Pagination meta={issues.data?.meta} onPage={setPage} />
                </section>
              </Resource>
            )}
            {view === 'rows' && (
              <Resource resource={rows}>
                <section className="panel">
                  <Table
                    headers={[
                      'Fila original',
                      'Incorporar',
                      'Respuestas preparadas',
                      '',
                    ]}
                  >
                    {rows.data?.data.map((row) => (
                      <tr key={row.id}>
                        <td>{row.raw_row_id}</td>
                        <td>
                          {row.proposed_inclusion ? 'Sí' : 'No'}
                          <small className="cell-sub">
                            {row.exclusion_reason}
                          </small>
                        </td>
                        <td>
                          <details>
                            <summary>
                              {row.prepared_fields.length} preguntas
                            </summary>
                            <dl className="answer-list">
                              {row.prepared_fields.map((f) => (
                                <div key={f.field_id}>
                                  <dt>{f.field_id}</dt>
                                  <dd>
                                    {displayValue(f.value)}{' '}
                                    <small>{f.state}</small>
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          </details>
                        </td>
                        <td>
                          <button
                            className="button small"
                            disabled={!editable || !current}
                            onClick={() => setDecision(row)}
                          >
                            Decidir fila
                          </button>
                        </td>
                      </tr>
                    ))}
                  </Table>
                  <Pagination meta={rows.data?.meta} onPage={setPage} />
                </section>
              </Resource>
            )}
            {view !== 'rows' &&
              Object.keys(filters).length > 0 &&
              current &&
              editable && (
                <div className="bulk-box">
                  <p>
                    <strong>
                      {number(summary.data?.summary.selectable_rows)} filas
                    </strong>{' '}
                    en la selección actual. Excluirlas conservará el original y
                    exigirá otra validación.
                  </p>
                  <button
                    className="button danger"
                    disabled={!summary.data?.summary.selectable_rows}
                    onClick={() => setExcluding(!excluding)}
                  >
                    Revisar exclusión de la selección
                  </button>
                  {excluding && (
                    <ActionForm
                      key={JSON.stringify(filters)}
                      submit="Confirmar exclusión de estas filas"
                      onSubmit={async (form) => {
                        const count = summary.data.summary.selectable_rows
                        if (Number(form.get('count')) !== count)
                          throw new Error(
                            'El número escrito no coincide con las filas seleccionadas.',
                          )
                        await api.post(
                          `/imports/${item.id}/review-exclusions`,
                          {
                            validation_run_id: run,
                            expected_configuration_revision:
                              item.configuration_revision,
                            expected_affected_rows: count,
                            selection: filters,
                            reason: form.get('reason'),
                          },
                        )
                        setExcluding(false)
                        onSaved()
                        summary.reload()
                      }}
                    >
                      <Field
                        label="Motivo de exclusión"
                        name="reason"
                        minLength={3}
                        maxLength={1000}
                        required
                      />
                      <Field
                        label={`Escribe ${summary.data?.summary.selectable_rows} para confirmar el total`}
                        name="count"
                        type="number"
                        required
                      />
                    </ActionForm>
                  )}
                </div>
              )}
          </Resource>
          {decision && (
            <section className="panel padded">
              <h2>Decisión para la fila original {decision.raw_row_id}</h2>
              <ActionForm
                submit="Guardar decisión y volver a validar"
                onSubmit={async (form) => {
                  await api.post(`/imports/${item.id}/row-decisions`, {
                    expected_configuration_revision:
                      item.configuration_revision,
                    decisions: [
                      {
                        raw_row_id: decision.raw_row_id,
                        action: form.get('action'),
                        reason: form.get('reason'),
                      },
                    ],
                  })
                  setDecision(null)
                  onSaved()
                  summary.reload()
                  rows.reload()
                }}
              >
                <Select
                  label="Decisión"
                  name="action"
                  options={[
                    { value: 'exclude', label: 'Excluir la fila' },
                    {
                      value: 'include',
                      label:
                        'Incluir la fila si tiene respuestas interpretables',
                    },
                  ]}
                />
                <Field
                  label="Motivo"
                  name="reason"
                  required
                  minLength={3}
                  maxLength={1000}
                />
                <button
                  type="button"
                  className="button"
                  onClick={() => setDecision(null)}
                >
                  Cancelar
                </button>
              </ActionForm>
            </section>
          )}
        </>
      )}
    </>
  )
}

function CommitImport({ item, onSaved }) {
  const [mode, setMode] = useState('append')
  const [replacement, setReplacement] = useState('')
  const key = useRef(null)
  if (item.status === 'committed')
    return (
      <Empty
        title="El archivo ya fue incorporado"
        action={
          <Link
            className="button primary"
            to={`/estudios/${item.dataset_id}/estadisticas`}
          >
            Ver estadísticas
          </Link>
        }
      >
        Las respuestas están disponibles en el estudio. La incorporación
        conserva el archivo y su trazabilidad.
      </Empty>
    )
  const ready =
    item.status === 'ready_to_commit' && !!item.latest_validation_run_id
  return (
    <section className="panel padded narrow">
      <h2>Confirmar incorporación al estudio</h2>
      <p>
        Se publicarán {number(item.counts?.included_rows)} filas incluidas. Las
        filas excluidas se conservarán fuera de las estadísticas.
      </p>
      {!ready && (
        <div className="notice">
          Primero completa una validación vigente sin bloqueos en el paso
          «Validar y revisar».
        </div>
      )}
      <ActionForm
        submit="Incorporar respuestas"
        disabled={!ready}
        onSubmit={async () => {
          key.current ||= crypto.randomUUID()
          await api.post(
            `/imports/${item.id}/commit`,
            {
              configuration_revision: item.configuration_revision,
              validation_run_id: item.latest_validation_run_id,
              policy: {
                mode,
                ...(mode === 'replace'
                  ? { replace_import_id: replacement }
                  : {}),
              },
            },
            { headers: { 'Idempotency-Key': key.current } },
          )
          onSaved()
        }}
      >
        <Select
          label="Forma de incorporación"
          value={mode}
          onChange={(e) => {
            setMode(e.target.value)
            key.current = null
          }}
          options={[
            { value: 'append', label: 'Agregar al estudio' },
            { value: 'replace', label: 'Reemplazar una importación anterior' },
          ]}
        />
        {mode === 'replace' && (
          <>
            <p className="notice">
              Las respuestas de la importación anterior se excluirán
              lógicamente. El historial se conserva.
            </p>
            <Field
              label="Identificador de la importación que se reemplaza"
              value={replacement}
              onChange={(e) => {
                setReplacement(e.target.value)
                key.current = null
              }}
              required
            />
            <Link to="/importaciones" target="_blank" rel="noreferrer">
              Consultar importaciones en otra pestaña
            </Link>
          </>
        )}
        <label className="checkbox-row">
          <input type="checkbox" required />
          Revisé los datos y confirmo la incorporación al estudio.
        </label>
      </ActionForm>
    </section>
  )
}
