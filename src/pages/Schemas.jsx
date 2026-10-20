import { useState } from 'react'
import {
  Link,
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router-dom'
import useResource from '@/hooks/useResource.js'
import { api } from '@/services/api.js'
import {
  ActionForm,
  Empty,
  Field,
  PageTitle,
  Resource,
  Select,
  Status,
  Table,
  Pagination,
} from '@/components/ui.jsx'
import { date } from '@/utils/format.js'

const types = {
  boolean: 'Sí / No',
  number: 'Número',
  category: 'Categoría',
  ordered_category: 'Categoría ordenada',
  multiselect: 'Selección múltiple',
  date: 'Fecha',
  text: 'Texto',
}
const registryNote = (
  <div className="notice">
    Los esquemas nuevos pueden definirse y publicarse. Su uso en importación,
    captura y estadísticas todavía está pendiente en el backend. Esos flujos
    usan los catálogos actuales.
  </div>
)
export default function Schemas() {
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const resource = useResource('/schemas', { page, per_page: 20 })
  return (
    <>
      <PageTitle
        title="Variables y esquemas"
        description="Definiciones versionadas de los cuestionarios."
        actions={
          <button
            className="button primary"
            onClick={() => setCreating(!creating)}
          >
            {creating ? 'Cerrar formulario' : 'Nuevo esquema'}
          </button>
        }
      />
      {registryNote}
      {creating && (
        <section className="panel padded">
          <h2>Crear esquema</h2>
          <ActionForm
            submit="Crear esquema"
            onSubmit={async (form) => {
              await api.post('/schemas', Object.fromEntries(form))
              setCreating(false)
              resource.reload()
            }}
          >
            <Field label="Nombre" name="name" required maxLength={255} />
            <Field label="Descripción" name="description" maxLength={5000} />
          </ActionForm>
        </section>
      )}
      <Resource resource={resource}>
        <section className="panel">
          <Table headers={['Esquema', 'Origen', 'Creado', '']}>
            {resource.data?.data.map((s) => (
              <tr key={s.id}>
                <td>
                  <Link className="entity-link" to={`/esquemas/${s.id}`}>
                    {s.name}
                  </Link>
                  <small className="cell-sub">{s.description}</small>
                </td>
                <td>
                  {s.legacy_survey_type ? 'Catálogo inicial' : 'Configurable'}
                </td>
                <td>{date(s.created_at)}</td>
                <td>
                  <Link className="button small" to={`/esquemas/${s.id}`}>
                    Ver versiones
                  </Link>
                </td>
              </tr>
            ))}
          </Table>
          <Pagination meta={resource.data?.meta} onPage={setPage} />
        </section>
      </Resource>
    </>
  )
}

export function SchemaDetail() {
  const { schemaId } = useParams()
  const [page, setPage] = useState(1)
  const resource = useResource(`/schemas/${schemaId}/versions`, {
    page,
    per_page: 20,
  })
  const navigate = useNavigate()
  return (
    <>
      <div className="breadcrumb">
        <Link to="/esquemas">Esquemas</Link>
        <span>/</span>
        <span>Versiones</span>
      </div>
      <PageTitle
        title="Versiones del esquema"
        description="Las versiones publicadas son inmutables. Crea un borrador para hacer cambios."
      />
      {registryNote}
      <section className="panel padded">
        <ActionForm
          submit="Crear borrador vacío"
          onSubmit={async () => {
            const { data } = await api.post(`/schemas/${schemaId}/versions`, {})
            navigate(`/versiones/${data.id}`)
          }}
        />
      </section>
      <Resource resource={resource}>
        <section className="panel">
          <Table
            headers={[
              'Versión',
              'Estado',
              'Revisión',
              'Publicación',
              'Acciones',
            ]}
          >
            {resource.data?.data.map((v) => (
              <tr key={v.id}>
                <td>{v.version_number}</td>
                <td>
                  <Status value={v.status} />
                </td>
                <td>{v.revision}</td>
                <td>{date(v.published_at)}</td>
                <td>
                  <div className="actions">
                    <Link className="button small" to={`/versiones/${v.id}`}>
                      Abrir
                    </Link>
                    {v.status === 'published' && (
                      <ActionForm
                        submit="Copiar a borrador"
                        onSubmit={async () => {
                          const { data } = await api.post(
                            `/schemas/${schemaId}/versions`,
                            { base_version_id: v.id },
                          )
                          navigate(`/versiones/${data.id}`)
                        }}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
          <Pagination meta={resource.data?.meta} onPage={setPage} />
        </section>
      </Resource>
    </>
  )
}

export function VersionDetail() {
  const { versionId } = useParams()
  const versionResource = useResource(`/schema-versions/${versionId}`)
  const version = versionResource.data?.data
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [message, setMessage] = useState('')
  const fields = useResource(`/schema-versions/${versionId}/fields`, {
    page,
    per_page: 20,
    search,
  })
  function refresh() {
    setEditing(null)
    setMessage('Cambio guardado.')
    versionResource.reload()
    fields.reload()
  }
  const editable = version?.status === 'draft'
  return (
    <Resource resource={versionResource}>
      {version && (
        <>
          <div className="breadcrumb">
            <Link to="/esquemas">Esquemas</Link>
            <span>/</span>
            <Link to={`/esquemas/${version.schema_id}`}>Versiones</Link>
          </div>
          <PageTitle
            title={`Versión ${version.version_number}`}
            description={`${version.field_count} variables · Revisión ${version.revision}`}
            actions={
              <>
                <Status value={version.status} />
                <button
                  className="button"
                  onClick={() => {
                    versionResource.reload()
                    fields.reload()
                  }}
                >
                  Actualizar
                </button>
              </>
            }
          />
          {registryNote}
          <Field
            label="Identificador de esta versión"
            value={version.id}
            readOnly
          />
          <div className="toolbar">
            <Field
              label="Buscar código o etiqueta"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
            {editable && (
              <button className="button primary" onClick={() => setEditing({})}>
                Agregar variable
              </button>
            )}
          </div>
          <Resource resource={fields}>
            <section className="panel">
              <Table
                headers={[
                  'Código y etiqueta',
                  'Tipo',
                  'Unidad',
                  'Obligatoria',
                  'Sensible',
                  '',
                ]}
              >
                {fields.data?.data.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <span className="mono">{f.code}</span>
                      <small className="cell-sub">{f.label}</small>
                    </td>
                    <td>{types[f.type]}</td>
                    <td>{f.unit || '—'}</td>
                    <td>{f.required ? 'Sí' : 'No'}</td>
                    <td>{f.sensitive ? 'Sí' : 'No'}</td>
                    <td>
                      <button
                        className="button small"
                        onClick={() => setEditing(f)}
                      >
                        {editable ? 'Editar' : 'Ver opciones'}
                      </button>
                    </td>
                  </tr>
                ))}
              </Table>
              <Pagination meta={fields.data?.meta} onPage={setPage} />
            </section>
          </Resource>
          {editing && (
            <VariableEditor
              key={editing.id || 'new'}
              field={editing}
              version={version}
              editable={editable}
              onSaved={refresh}
              onCancel={() => setEditing(null)}
            />
          )}
          {message && (
            <p className="notice" role="status">
              {message}
            </p>
          )}
          {editable && (
            <section className="panel padded narrow">
              <h2>Publicar la versión</h2>
              <p>
                La versión publicada no se podrá modificar. Para cambios
                posteriores, crea una nueva versión.
              </p>
              <ActionForm
                submit="Publicar versión"
                disabled={!version.field_count}
                onSubmit={async () => {
                  await api.post(`/schema-versions/${versionId}/publish`, {
                    expected_revision: version.revision,
                  })
                  refresh()
                }}
              >
                <label className="checkbox-row">
                  <input type="checkbox" required />
                  Revisé las variables y confirmo la publicación.
                </label>
              </ActionForm>
            </section>
          )}
        </>
      )}
    </Resource>
  )
}

function VariableEditor({ field, version, editable, onSaved, onCancel }) {
  const [type, setType] = useState(field.type || 'text')
  const [options, setOptions] = useState(
    (field.options || []).map((o) => ({ code: o.code, label: o.label })),
  )
  const categorical = ['category', 'ordered_category', 'multiselect'].includes(
    type,
  )
  return (
    <section className="panel padded">
      <div className="panel-heading plain">
        <h2>{field.id ? `Variable ${field.code}` : 'Nueva variable'}</h2>
        <button className="button" onClick={onCancel}>
          Cerrar
        </button>
      </div>
      <ActionForm
        submit="Guardar variable"
        disabled={!editable}
        onSubmit={async (form) => {
          await api.put(`/schema-versions/${version.id}/fields`, {
            expected_revision: version.revision,
            fields: [
              {
                code: form.get('code'),
                label: form.get('label'),
                type,
                unit: type === 'number' ? form.get('unit') : null,
                required: form.get('required') === 'on',
                sensitive: form.get('sensitive') === 'on',
                options: categorical ? options : [],
              },
            ],
          })
          onSaved()
        }}
      >
        <div className="form-grid">
          <Field
            label="Código estable"
            name="code"
            defaultValue={field.code}
            pattern="[A-Za-z][A-Za-z0-9_]*"
            maxLength={64}
            required
            readOnly={!!field.id}
            hint="Empieza con una letra; usa letras, números o guion bajo."
          />
          <Field
            label="Etiqueta"
            name="label"
            defaultValue={field.label}
            maxLength={2000}
            required
          />
          <Select
            label="Tipo"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={Object.entries(types).map(([value, label]) => ({
              value,
              label,
            }))}
          />
          {type === 'number' && (
            <Field
              label="Unidad"
              name="unit"
              defaultValue={field.unit || 'none'}
              required
              maxLength={64}
              hint="Por ejemplo: años, meses o none si no tiene unidad."
            />
          )}
        </div>
        <div className="actions">
          <label className="checkbox-row">
            <input
              type="checkbox"
              name="required"
              defaultChecked={field.required}
            />
            Obligatoria
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              name="sensitive"
              defaultChecked={field.sensitive}
            />
            Dato sensible
          </label>
        </div>
        {categorical && (
          <div className="options-editor">
            <h3>Opciones de respuesta</h3>
            {options.map((option, index) => (
              <div className="option-row" key={index}>
                <Field
                  label={`Código de opción ${index + 1}`}
                  value={option.code}
                  required
                  maxLength={128}
                  onChange={(e) =>
                    setOptions((old) =>
                      old.map((o, i) =>
                        i === index ? { ...o, code: e.target.value } : o,
                      ),
                    )
                  }
                />
                <Field
                  label={`Etiqueta de opción ${index + 1}`}
                  value={option.label}
                  required
                  maxLength={2000}
                  onChange={(e) =>
                    setOptions((old) =>
                      old.map((o, i) =>
                        i === index ? { ...o, label: e.target.value } : o,
                      ),
                    )
                  }
                />
                <button
                  type="button"
                  className="button danger"
                  onClick={() =>
                    setOptions((old) => old.filter((_, i) => i !== index))
                  }
                >
                  Quitar
                </button>
              </div>
            ))}
            <button
              type="button"
              className="button"
              disabled={options.length >= 500}
              onClick={() => setOptions([...options, { code: '', label: '' }])}
            >
              Agregar opción
            </button>
            <p className="field-note">
              Los códigos deben ser únicos. Las categorías requieren al menos
              una opción.
            </p>
          </div>
        )}
      </ActionForm>
      {!editable && field.options?.length > 0 && (
        <Table headers={['Código', 'Opción']}>
          {field.options.map((o) => (
            <tr key={o.code}>
              <td>{o.code}</td>
              <td>{o.label}</td>
            </tr>
          ))}
        </Table>
      )}
      {editable && field.id && (
        <ActionForm
          submit="Eliminar variable del borrador"
          className="secondary-actions"
          onSubmit={async (form) => {
            if (form.get('code_confirm') !== field.code)
              throw new Error('El código escrito no coincide.')
            await api.delete(
              `/schema-versions/${version.id}/fields/${field.id}`,
              { query: { expected_revision: version.revision } },
            )
            onSaved()
          }}
        >
          <Field
            label={`Escribe ${field.code} para eliminarla de este borrador`}
            name="code_confirm"
            required
          />
        </ActionForm>
      )}
    </section>
  )
}

export function StudyBindings() {
  const { dataset } = useOutletContext()
  const [page, setPage] = useState(1)
  const [message, setMessage] = useState('')
  const bindings = useResource(`/datasets/${dataset.id}/schema-bindings`, {
    page,
    per_page: 20,
  })
  return (
    <>
      <PageTitle
        title="Esquemas asociados"
        description="Versiones publicadas admitidas explícitamente por el estudio."
      />
      {registryNote}
      <section className="panel padded">
        <h2>Asociar una versión publicada</h2>
        <p>
          Busca el esquema y copia el identificador de su versión. Asociarlo no
          incorpora datos ni cambia las estadísticas.
        </p>
        <Link to="/esquemas" target="_blank" rel="noreferrer">
          Consultar esquemas en otra pestaña
        </Link>
        <ActionForm
          submit="Asociar versión"
          onSubmit={async (form) => {
            await api.post(`/datasets/${dataset.id}/schema-bindings`, {
              schema_version_id: form.get('version').trim(),
            })
            bindings.reload()
            setMessage('Versión asociada al estudio.')
          }}
        >
          <Field
            label="Identificador de la versión publicada"
            name="version"
            required
          />
        </ActionForm>
        {message && <p role="status">{message}</p>}
      </section>
      <Resource resource={bindings}>
        <section className="panel">
          <Table headers={['Versión asociada', 'Fecha', '']}>
            {bindings.data?.data.map((b) => (
              <tr key={b.schema_version_id}>
                <td className="mono">{b.schema_version_id}</td>
                <td>{date(b.created_at)}</td>
                <td>
                  <Link to={`/versiones/${b.schema_version_id}`}>
                    Abrir versión
                  </Link>
                </td>
              </tr>
            ))}
          </Table>
          <Pagination meta={bindings.data?.meta} onPage={setPage} />
        </section>
      </Resource>
    </>
  )
}

export function Profiles() {
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const profiles = useResource('/import-profiles', { page, per_page: 20 })
  const detail = useResource(selected ? `/import-profiles/${selected}` : null)
  return (
    <>
      <PageTitle
        title="Perfiles de importación"
        description="Configuraciones guardadas después de confirmar el mapeo de una hoja."
      />
      <Resource resource={profiles}>
        {profiles.data?.data.length ? (
          <section className="panel">
            <Table headers={['Nombre', 'Encuesta', 'Versión', '']}>
              {profiles.data.data.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.survey_type}</td>
                  <td>{p.profile_version}</td>
                  <td>
                    <button
                      className="button small"
                      onClick={() => setSelected(p.id)}
                    >
                      Consultar
                    </button>
                  </td>
                </tr>
              ))}
            </Table>
            <Pagination meta={profiles.data?.meta} onPage={setPage} />
          </section>
        ) : (
          <Empty title="No hay perfiles guardados">
            Después de configurar una hoja puedes guardar su correspondencia de
            columnas como perfil.
          </Empty>
        )}
      </Resource>
      {selected && (
        <Resource resource={detail}>
          {detail.data && (
            <section className="panel padded">
              <h2>{detail.data.data.name}</h2>
              <p>
                Encabezado en fila {detail.data.data.settings.header_row}.
                Catálogo {detail.data.data.dictionary_version}.
              </p>
              <Table headers={['Columna', 'Correspondencia']}>
                {detail.data.data.settings.columns.map((c) => (
                  <tr key={c.column_index}>
                    <td>{c.column_index}</td>
                    <td>{c.role === 'ignore' ? 'Ignorar' : c.field_id}</td>
                  </tr>
                ))}
              </Table>
              <p className="muted">
                El perfil es inmutable. Al usarlo en otro archivo debes revisar
                y confirmar la región y las posiciones.
              </p>
            </section>
          )}
        </Resource>
      )}
    </>
  )
}
