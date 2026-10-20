import { useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import useResource from '@/hooks/useResource.js'
import { api } from '@/services/api.js'
import { useAuth } from '@/context/auth.js'
import {
  ActionForm,
  Field,
  Select,
  PageTitle,
  Resource,
  Empty,
  Table,
  Pagination,
  Status,
} from '@/components/ui.jsx'
import { date, label } from '@/utils/format.js'
import { Filters, ValueInput } from '@/components/SurveyControls.jsx'
import { displayValue, editableStates } from '@/utils/survey.js'

export default function Responses() {
  const { dataset } = useOutletContext()
  const [survey, setSurvey] = useState('titulados')
  const [included, setIncluded] = useState('1')
  const [filters, setFilters] = useState([])
  const [page, setPage] = useState(1)
  const catalog = useResource('/catalog', { survey_type: survey })
  const rows = useResource(`/datasets/${dataset.id}/responses`, {
    survey_type: survey,
    included,
    filters,
    page,
    per_page: 15,
  })
  return (
    <>
      <PageTitle
        title="Respuestas"
        description="Consulta el origen y corrige respuestas conservando su historial."
      />
      <section className="panel padded">
        <div className="toolbar">
          <Select
            label="Encuesta"
            value={survey}
            onChange={(e) => {
              setSurvey(e.target.value)
              setPage(1)
              setFilters([])
            }}
            options={[
              { value: 'titulados', label: 'Titulados' },
              { value: 'empleadores', label: 'Empleadores' },
            ]}
          />
          <Select
            label="Incorporación"
            value={included}
            onChange={(e) => {
              setIncluded(e.target.value)
              setPage(1)
            }}
            options={[
              { value: '1', label: 'Incluidas' },
              { value: '0', label: 'Excluidas' },
            ]}
          />
        </div>
        <Resource resource={catalog}>
          <Filters
            fields={catalog.data?.data.fields || []}
            value={filters}
            onChange={(v) => {
              setFilters(v)
              setPage(1)
            }}
          />
        </Resource>
      </section>
      <Resource resource={rows}>
        {rows.data?.data.length ? (
          <section className="panel">
            <Table headers={['Respuesta', 'Origen', 'Estado', 'Fecha', '']}>
              {rows.data.data.map((r) => (
                <tr key={r.id}>
                  <td className="mono">
                    {r.id.slice(0, 8)}
                    <small className="cell-sub">
                      Revisión {r.response_revision}
                    </small>
                  </td>
                  <td>{label(r.source_kind)}</td>
                  <td>{r.included ? 'Incluida' : 'Excluida'}</td>
                  <td>{date(r.created_at)}</td>
                  <td>
                    <Link className="button small" to={`/respuestas/${r.id}`}>
                      Ver respuesta
                    </Link>
                  </td>
                </tr>
              ))}
            </Table>
            <Pagination meta={rows.data?.meta} onPage={setPage} />
          </section>
        ) : (
          <Empty title="No hay respuestas en esta selección">
            Prueba otros filtros o incorpora un archivo al estudio.
          </Empty>
        )}
      </Resource>
    </>
  )
}

export function ResponseDetail() {
  const { responseId } = useParams()
  const { user } = useAuth()
  const resource = useResource(`/responses/${responseId}`)
  const response = resource.data?.data
  const catalog = useResource(response ? '/catalog' : null, {
    survey_type: response?.survey_type,
    dictionary_version: response?.dictionary_version,
  })
  const [page, setPage] = useState(1)
  const history = useResource(`/responses/${responseId}/history`, {
    page,
    per_page: 10,
  })
  const [showContacts, setShowContacts] = useState(false)
  const contacts = useResource(
    showContacts ? `/responses/${responseId}/contacts` : null,
  )
  const [fieldId, setFieldId] = useState('')
  const [value, setValue] = useState(null)
  const [state, setState] = useState('respondida')
  const [message, setMessage] = useState('')
  const fields = catalog.data?.data.fields || []
  const field = fields.find((f) => f.id === fieldId)
  function refreshed() {
    resource.reload()
    history.reload()
    setMessage('Cambio guardado en el historial.')
    setFieldId('')
  }
  return (
    <Resource resource={resource}>
      {response && (
        <>
          <div className="breadcrumb">
            <Link to={`/estudios/${response.dataset_id}/respuestas`}>
              Respuestas del estudio
            </Link>
            <span>/</span>
            <span className="mono">{response.id.slice(0, 8)}</span>
          </div>
          <PageTitle
            title="Detalle de respuesta"
            description={`${label(response.source_kind)} · Revisión ${response.response_revision} · ${date(response.created_at)}`}
          />
          <div className="two-columns">
            <section className="panel">
              <div className="panel-heading">
                <h2>Respuestas del cuestionario</h2>
                <span className="status">
                  {response.included ? 'Incluida' : 'Excluida'}
                </span>
              </div>
              <Resource resource={catalog}>
                <Table headers={['Pregunta', 'Respuesta', 'Estado']}>
                  {response.answers.map((a) => {
                    const f = fields.find((f) => f.id === a.field_id)
                    return (
                      <tr key={a.field_id}>
                        <td>
                          <span className="mono">{a.field_id}</span>
                          <small className="cell-sub">{f?.label}</small>
                        </td>
                        <td>
                          {f?.type === 'contact'
                            ? 'Contacto separado'
                            : displayValue(a.value, f)}
                        </td>
                        <td>
                          <Status value={a.state} />
                        </td>
                      </tr>
                    )
                  })}
                </Table>
              </Resource>
            </section>
            <div className="stack">
              <section className="panel padded">
                <h2>Corregir una respuesta</h2>
                <p>
                  El cambio requiere un motivo y conserva el valor anterior.
                </p>
                <ActionForm
                  submit="Guardar corrección"
                  submitDisabled={!field}
                  onSubmit={async (form) => {
                    await api.patch(`/responses/${responseId}`, {
                      expected_response_revision: response.response_revision,
                      reason: form.get('reason'),
                      answers: [
                        {
                          field_id: field.id,
                          value: state === 'respondida' ? value : null,
                          state,
                        },
                      ],
                    })
                    refreshed()
                  }}
                >
                  <Select
                    label="Pregunta"
                    value={fieldId}
                    onChange={(e) => {
                      setFieldId(e.target.value)
                      const a = response.answers.find(
                        (a) => a.field_id === e.target.value,
                      )
                      setValue(a?.value ?? null)
                      setState(
                        editableStates.includes(a?.state)
                          ? a.state
                          : 'sin_respuesta',
                      )
                    }}
                    options={[
                      { value: '', label: 'Seleccionar pregunta' },
                      ...fields
                        .filter((f) => f.type !== 'contact')
                        .map((f) => ({
                          value: f.id,
                          label: `${f.id} · ${f.label}`,
                        })),
                    ]}
                  />
                  {field && (
                    <>
                      <Select
                        label="Estado de la respuesta"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        options={editableStates.map((s) => ({
                          value: s,
                          label: label(s),
                        }))}
                      />
                      {state === 'respondida' && (
                        <ValueInput
                          field={field}
                          value={value}
                          onChange={setValue}
                          required
                        />
                      )}
                    </>
                  )}
                  <Field
                    label="Motivo de la corrección"
                    name="reason"
                    required
                    minLength={3}
                    maxLength={1000}
                  />
                </ActionForm>
              </section>
              <section className="panel padded">
                <h2>
                  {response.included
                    ? 'Excluir de las estadísticas'
                    : 'Volver a incluir'}
                </h2>
                <p>El registro y su historial se conservan.</p>
                <ActionForm
                  submit={
                    response.included
                      ? 'Confirmar exclusión'
                      : 'Confirmar inclusión'
                  }
                  onSubmit={async (form) => {
                    await api.patch(`/responses/${responseId}`, {
                      expected_response_revision: response.response_revision,
                      reason: form.get('reason'),
                      included: !response.included,
                    })
                    refreshed()
                  }}
                >
                  <Field
                    label="Motivo"
                    name="reason"
                    required
                    minLength={3}
                    maxLength={1000}
                  />
                  <label className="checkbox-row">
                    <input type="checkbox" required />
                    Confirmo el cambio de inclusión.
                  </label>
                </ActionForm>
              </section>
              {user.can_view_contacts && (
                <section className="panel padded">
                  <h2>Contactos</h2>
                  <button
                    className="button"
                    onClick={() => setShowContacts(!showContacts)}
                  >
                    {showContacts
                      ? 'Ocultar contactos'
                      : 'Consultar contactos autorizados'}
                  </button>
                  {showContacts && (
                    <Resource resource={contacts}>
                      {contacts.data?.data ? (
                        <dl className="detail-list">
                          {['email', 'phone', 'linkedin'].map((key) => (
                            <div key={key}>
                              <dt>
                                {key === 'email'
                                  ? 'Correo'
                                  : key === 'phone'
                                    ? 'Teléfono'
                                    : 'LinkedIn'}
                              </dt>
                              <dd>{contacts.data.data[key] || '—'}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <p>No hay contactos registrados.</p>
                      )}
                    </Resource>
                  )}
                </section>
              )}
            </div>
          </div>
          {message && (
            <p role="status" className="notice">
              {message}
            </p>
          )}
          <section className="panel">
            <div className="panel-heading">
              <h2>Historial de cambios</h2>
            </div>
            <Resource resource={history}>
              <Table
                headers={['Fecha', 'Pregunta', 'Antes', 'Después', 'Motivo']}
              >
                {history.data?.data.map((h) => (
                  <tr key={h.id}>
                    <td>{date(h.created_at)}</td>
                    <td>{h.field_id || 'Inclusión'}</td>
                    <td>
                      {h.field_id
                        ? `${displayValue(h.before?.value)} (${label(h.before?.state)})`
                        : h.before?.included
                          ? 'Incluida'
                          : 'Excluida'}
                    </td>
                    <td>
                      {h.field_id
                        ? `${displayValue(h.after?.value)} (${label(h.after?.state)})`
                        : h.after?.included
                          ? 'Incluida'
                          : 'Excluida'}
                    </td>
                    <td>{h.reason}</td>
                  </tr>
                ))}
              </Table>
              <Pagination meta={history.data?.meta} onPage={setPage} />
            </Resource>
          </section>
        </>
      )}
    </Resource>
  )
}
