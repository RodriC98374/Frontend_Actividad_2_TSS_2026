import { useState } from 'react'
import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router-dom'
import useResource from '@/hooks/useResource.js'
import { api } from '@/services/api.js'
import { useAuth } from '@/context/auth.js'
import {
  ActionForm,
  Field,
  PageTitle,
  Resource,
  Empty,
  Status,
  Table,
  Pagination,
  Icon,
  ErrorNotice,
} from '@/components/ui.jsx'
import { date, number, surveyLabels } from '@/utils/format.js'

export default function Studies() {
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const resource = useResource('/datasets', { page, per_page: 15 })
  const navigate = useNavigate()
  return (
    <>
      <PageTitle
        title="Estudios"
        description="Cada estudio reúne sus archivos, respuestas y resultados."
        actions={
          <button
            className="button primary"
            onClick={() => setCreating(!creating)}
          >
            <Icon name="plus" />
            {creating ? 'Cerrar formulario' : 'Nuevo estudio'}
          </button>
        }
      />
      {creating && (
        <section className="panel form-panel">
          <h2>Crear un estudio</h2>
          <ActionForm
            submit="Crear estudio"
            onSubmit={async (form) => {
              const { data } = await api.post(
                '/datasets',
                Object.fromEntries(form),
              )
              navigate(`/estudios/${data.id}`)
            }}
          >
            <div className="form-grid">
              <Field
                label="Nombre del estudio"
                name="name"
                required
                maxLength={255}
                placeholder="Seguimiento a titulados 2026"
              />
              <Field
                label="Periodo de referencia"
                name="reference_period"
                maxLength={255}
                placeholder="Gestión 2026"
              />
            </div>
            <Field label="Descripción">
              {(id) => (
                <textarea
                  id={id}
                  name="description"
                  rows={3}
                  maxLength={5000}
                />
              )}
            </Field>
          </ActionForm>
        </section>
      )}
      <Resource resource={resource}>
        {resource.data?.data.length ? (
          <section className="panel">
            <div className="panel-heading">
              <h2>Todos los estudios</h2>
              <span className="muted">
                {number(resource.data.meta.total)} en total
              </span>
            </div>
            <Table headers={['Estudio', 'Periodo', 'Estado', 'Creado', '']}>
              {resource.data?.data.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link className="entity-link" to={`/estudios/${item.id}`}>
                      {item.name}
                    </Link>
                    <small className="cell-sub">
                      {item.description || 'Sin descripción'}
                    </small>
                  </td>
                  <td>{item.reference_period || '—'}</td>
                  <td>
                    <Status value={item.status} />
                  </td>
                  <td>{date(item.created_at)}</td>
                  <td>
                    <Link className="button small" to={`/estudios/${item.id}`}>
                      Abrir
                      <Icon name="arrow" size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </Table>
            <Pagination meta={resource.data?.meta} onPage={setPage} />
          </section>
        ) : (
          <Empty
            title="Tu primer estudio empieza aquí"
            action={
              <button
                className="button primary"
                onClick={() => setCreating(true)}
              >
                Crear un estudio
              </button>
            }
          >
            Crea un estudio para cargar archivos o recibir respuestas por
            formulario.
          </Empty>
        )}
      </Resource>
      <section className="workflow-strip" aria-label="Proceso de trabajo">
        <div>
          <span>01</span>
          <h3>Organiza el estudio</h3>
          <p>Define el nombre y el periodo de la encuesta.</p>
        </div>
        <div>
          <span>02</span>
          <h3>Revisa los datos</h3>
          <p>Configura las columnas y confirma qué filas incorporar.</p>
        </div>
        <div>
          <span>03</span>
          <h3>Consulta la evidencia</h3>
          <p>Analiza respuestas incluidas y exporta resultados.</p>
        </div>
      </section>
    </>
  )
}

export function StudyLayout() {
  const { datasetId } = useParams()
  const resource = useResource(`/datasets/${datasetId}`)
  const dataset = resource.data?.data
  return (
    <Resource resource={resource}>
      {dataset && (
        <>
          <div className="breadcrumb">
            <Link to="/estudios">Estudios</Link>
            <span>/</span>
            <span>{dataset.name}</span>
            <Status value={dataset.status} />
          </div>
          <nav className="tabs" aria-label="Secciones del estudio">
            {[
              ['', 'Resumen'],
              ['/importar', 'Importar archivo'],
              ['/respuestas', 'Respuestas'],
              ['/estadisticas', 'Estadísticas'],
              ['/invitaciones', 'Invitaciones'],
              ['/esquemas', 'Esquemas asociados'],
            ].map(([path, text]) => (
              <NavLink
                end={path === ''}
                key={path}
                to={`/estudios/${datasetId}${path}`}
              >
                {text}
              </NavLink>
            ))}
          </nav>
          <Outlet context={{ dataset, refreshDataset: resource.reload }} />
        </>
      )}
    </Resource>
  )
}

export function StudyOverview() {
  const { dataset } = useOutletContext()
  const summary = useResource(`/datasets/${dataset.id}/summary`)
  const imports = useResource('/imports', { per_page: 5 })
  const counts = summary.data?.data.counts || []
  const included = counts
    .filter((c) => c.included)
    .reduce((n, c) => n + Number(c.count), 0)
  const excluded = counts
    .filter((c) => !c.included)
    .reduce((n, c) => n + Number(c.count), 0)
  return (
    <>
      <PageTitle
        title={dataset.name}
        description={
          dataset.description ||
          `Estudio de encuestas${dataset.reference_period ? ` · ${dataset.reference_period}` : ''}`
        }
        actions={
          <Link className="button primary" to="importar">
            <Icon name="upload" />
            Importar archivo
          </Link>
        }
      />
      <Resource resource={summary}>
        <div className="stat-strip">
          <div>
            <span>Respuestas incluidas</span>
            <strong>{number(included)}</strong>
          </div>
          <div>
            <span>Respuestas excluidas</span>
            <strong>{number(excluded)}</strong>
          </div>
          <div>
            <span>Versión de datos</span>
            <strong>{number(summary.data?.data.data_version)}</strong>
          </div>
        </div>
        <div className="two-columns">
          <section className="panel">
            <div className="panel-heading">
              <h2>Origen de las respuestas</h2>
              <Link to="respuestas">Ver respuestas</Link>
            </div>
            {counts.length ? (
              <Table
                headers={[
                  'Encuesta',
                  'Origen',
                  'Incluidas',
                  { label: 'Respuestas', className: 'numeric' },
                ]}
              >
                {counts.map((c, i) => (
                  <tr key={i}>
                    <td>{surveyLabels[c.survey_type]}</td>
                    <td>
                      {c.source_kind === 'import' ? 'Archivo' : 'Formulario'}
                    </td>
                    <td>{c.included ? 'Sí' : 'No'}</td>
                    <td className="numeric">{number(c.count)}</td>
                  </tr>
                ))}
              </Table>
            ) : (
              <div className="panel-body">
                <p>Aún no hay respuestas incorporadas.</p>
                <p className="muted">
                  Puedes importar un archivo o crear una invitación individual.
                </p>
              </div>
            )}
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>Trabajo con este estudio</h2>
            </div>
            <div className="task-links">
              <Link to="importar">
                <Icon name="upload" />
                <div>
                  <strong>Cargar y revisar un archivo</strong>
                  <small>Excel o CSV, con configuración de columnas</small>
                </div>
                <Icon name="arrow" />
              </Link>
              <Link to="invitaciones">
                <Icon name="plus" />
                <div>
                  <strong>Recibir una nueva respuesta</strong>
                  <small>Invitación privada para un titulado</small>
                </div>
                <Icon name="arrow" />
              </Link>
              <Link to="estadisticas">
                <Icon name="chart" />
                <div>
                  <strong>Analizar y exportar</strong>
                  <small>Distribuciones, números y cruces</small>
                </div>
                <Icon name="arrow" />
              </Link>
            </div>
          </section>
        </div>
      </Resource>
      <Resource resource={imports}>
        {imports.data?.data.some((i) => i.dataset_id === dataset.id) && (
          <section className="panel">
            <div className="panel-heading">
              <h2>Archivos recientes</h2>
              <Link to="/importaciones">Ver todas las importaciones</Link>
            </div>
            <Table headers={['Archivo', 'Estado', 'Fecha']}>
              {imports.data.data
                .filter((i) => i.dataset_id === dataset.id)
                .map((i) => (
                  <tr key={i.id}>
                    <td>
                      <Link to={`/importaciones/${i.id}`}>
                        {i.original_name}
                      </Link>
                    </td>
                    <td>
                      <Status value={i.status} />
                    </td>
                    <td>{date(i.created_at)}</td>
                  </tr>
                ))}
            </Table>
          </section>
        )}
      </Resource>
    </>
  )
}

export function Invitations() {
  const { dataset } = useOutletContext()
  const [created, setCreated] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  async function revoke() {
    setBusy(true)
    setError(null)
    try {
      await api.delete(`/invitations/${created.invitation.id}`)
      setCreated(null)
      setMessage('La invitación fue revocada.')
    } catch (e) {
      setError(e)
    } finally {
      setBusy(false)
    }
  }
  const url = created
    ? `${window.location.origin}/formulario#token=${encodeURIComponent(created.token)}`
    : ''
  return (
    <>
      <PageTitle
        title="Invitaciones"
        description="Una invitación permite a un titulado enviar una respuesta a este estudio."
      />
      <div className="settings-row">
        <div>
          <h2>Crear un acceso individual</h2>
          <p>
            El enlace es privado, admite un único envío y vence en el plazo
            indicado. Guárdalo ahora: se muestra una sola vez.
          </p>
          <p className="muted">
            El formulario adicional es provisional y solicita consentimiento
            antes del envío.
          </p>
        </div>
        <section className="panel padded">
          <ActionForm
            submit="Generar enlace"
            onSubmit={async (form) => {
              const result = await api.post(
                `/datasets/${dataset.id}/invitations`,
                { expires_in_hours: Number(form.get('hours')) },
              )
              setCreated(result.data)
              setMessage('')
            }}
          >
            <Field
              label="Validez en horas"
              name="hours"
              type="number"
              min={1}
              max={720}
              defaultValue={48}
              required
            />
          </ActionForm>
        </section>
      </div>
      {created && (
        <section className="panel padded">
          <h2>Invitación creada</h2>
          <p>
            Vence el {date(created.invitation.expires_at)}. Comparte el enlace
            directamente con el titulado.
          </p>
          <Field label="Enlace privado" value={url} readOnly />
          <div className="actions">
            <button
              className="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(url)
                  setMessage('Enlace copiado.')
                } catch {
                  setMessage('Selecciona y copia el enlace del campo anterior.')
                }
              }}
            >
              Copiar enlace
            </button>
            <button className="button danger" disabled={busy} onClick={revoke}>
              {busy ? 'Revocando…' : 'Revocar invitación'}
            </button>
          </div>
        </section>
      )}
      <ErrorNotice error={error} />
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
    </>
  )
}

export function Help() {
  const resource = useResource('/capabilities')
  const me = useResource('/auth/me')
  const { user } = useAuth()
  const limits = resource.data?.data.limits
  return (
    <>
      <PageTitle
        title="Guía y capacidades"
        description="Cómo preparar, revisar y analizar las encuestas."
      />
      <div className="two-columns">
        <section className="panel padded">
          <h2>Del archivo a los resultados</h2>
          <ol className="guide-list">
            <li>
              <strong>Crea un estudio.</strong> Define qué encuesta y periodo
              reúne.
            </li>
            <li>
              <strong>Carga el archivo.</strong> Se conserva el original. La
              carga todavía no afecta las estadísticas.
            </li>
            <li>
              <strong>Configura cada hoja.</strong> Confirma encabezado, región
              de datos, preguntas y multiselecciones.
            </li>
            <li>
              <strong>Valida y revisa.</strong> Examina las incidencias. Cada
              cambio requiere otra validación.
            </li>
            <li>
              <strong>Incorpora.</strong> Confirma la revisión vigente. Solo las
              respuestas incluidas alimentan las estadísticas.
            </li>
            <li>
              <strong>Analiza y exporta.</strong> Consulta porcentajes con su
              denominador y versión de datos.
            </li>
          </ol>
        </section>
        <section className="panel padded">
          <h2>Tu acceso</h2>
          <Resource resource={me}>
            <p>{me.data?.data.name || user.name}</p>
            <p>
              {me.data?.data.can_view_contacts
                ? 'Puedes cargar archivos y consultar originales y contactos.'
                : 'Puedes revisar y analizar. La carga, el mapeo y los contactos requieren un permiso adicional.'}
            </p>
          </Resource>
          <h2>Límites del servidor</h2>
          <Resource resource={resource}>
            {limits && (
              <dl className="detail-list">
                <dt>Formatos</dt>
                <dd>{resource.data.data.formats.join(', ').toUpperCase()}</dd>
                <dt>Tamaño máximo</dt>
                <dd>{number(limits.max_bytes / 1024 / 1024)} MB</dd>
                <dt>Filas por archivo</dt>
                <dd>{number(limits.max_rows)}</dd>
                <dt>Columnas por hoja</dt>
                <dd>{number(limits.max_columns)}</dd>
                <dt>Hojas</dt>
                <dd>{number(limits.max_sheets)}</dd>
                <dt>Celdas</dt>
                <dd>{number(limits.max_cells)}</dd>
              </dl>
            )}
          </Resource>
        </section>
      </div>
      <div className="notice">
        <strong>Variables configurables</strong>
        <p>
          El registro de esquemas permite definir y publicar versiones. Su
          conexión con la importación, el formulario y las estadísticas sigue
          pendiente en el backend. Esos flujos usan los catálogos de titulados y
          empleadores.
        </p>
      </div>
    </>
  )
}
