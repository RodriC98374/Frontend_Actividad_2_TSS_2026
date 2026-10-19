import { useEffect, useId, useRef, useState } from 'react'

import { label, number } from '@/utils/format.js'

export function Status({ value }) {
  return <span className={`status status-${value}`}>{label(value)}</span>
}
export function PageTitle({ title, description, actions }) {
  return (
    <header className="page-title">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </header>
  )
}
export function ErrorNotice({ error, retry }) {
  if (!error) return null
  return (
    <div className="notice error" role="alert">
      <strong>{error.message || String(error)}</strong>
      {error.status === 409 && (
        <p>
          El estado cambió. Actualiza los datos antes de volver a confirmar.
        </p>
      )}
      {Object.entries(error.errors || {}).map(([field, messages]) => (
        <p key={field}>
          {field}:{' '}
          {Array.isArray(messages) ? messages.join(' ') : String(messages)}
        </p>
      ))}
      {retry && (
        <button className="button small" onClick={retry}>
          Volver a cargar
        </button>
      )}
    </div>
  )
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <span className="spinner" />
      Cargando datos…
    </div>
  )
}
export function Empty({ title, children, action }) {
  return (
    <div className="empty">
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  )
}
export function Resource({ resource, children }) {
  return resource.loading ? (
    <Loading />
  ) : resource.error ? (
    <ErrorNotice error={resource.error} retry={resource.reload} />
  ) : (
    children
  )
}
export function Field({ label: text, hint, children, ...props }) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>{text}</label>
      {children ? children(id) : <input id={id} {...props} />}
      {hint && <small>{hint}</small>}
    </div>
  )
}
export function Select({ label: text, options, ...props }) {
  return (
    <Field label={text}>
      {(id) => (
        <select id={id} {...props}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  )
}
export function Pagination({ meta, onPage }) {
  if (!meta || meta.total === 0) return null
  const pages = Math.ceil(meta.total / meta.per_page)
  return (
    <nav className="pagination" aria-label="Paginación">
      <span>
        {number((meta.page - 1) * meta.per_page + 1)}–
        {number(Math.min(meta.total, meta.page * meta.per_page))} de{' '}
        {number(meta.total)}
      </span>
      <div className="actions">
        <button
          className="button small"
          disabled={meta.page <= 1}
          onClick={() => onPage(meta.page - 1)}
        >
          Anterior
        </button>
        <span>
          {meta.page} / {pages}
        </span>
        <button
          className="button small"
          disabled={meta.page >= pages}
          onClick={() => onPage(meta.page + 1)}
        >
          Siguiente
        </button>
      </div>
    </nav>
  )
}
export function Table({ headers, children }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                scope="col"
                className={typeof h === 'object' ? h.className : ''}
              >
                {typeof h === 'object' ? h.label : h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
export function ActionForm({
  onSubmit,
  submit = 'Guardar',
  children,
  className = '',
  disabled = false,
  submitDisabled = false,
  onSuccess,
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const errorRef = useRef(null)
  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])
  async function run(event) {
    event.preventDefault()
    if (busy) return
    const form = event.currentTarget
    setBusy(true)
    setError(null)
    try {
      await onSubmit(new FormData(form), form)
      onSuccess?.()
    } catch (e) {
      setError(e)
    } finally {
      setBusy(false)
    }
  }
  return (
    <form className={`form ${className}`} onSubmit={run}>
      <fieldset disabled={busy || disabled}>
        {children}
        {error && (
          <div ref={errorRef} tabIndex={-1}>
            <ErrorNotice error={error} />
          </div>
        )}
        <div className="actions form-actions">
          <button
            className="button primary"
            type="submit"
            disabled={busy || disabled || submitDisabled}
          >
            {busy ? 'Procesando…' : submit}
          </button>
        </div>
      </fieldset>
    </form>
  )
}
export function Icon({ name, size = 18 }) {
  const paths = {
    studies: 'M3 5h7l2 2h9v13H3z',
    upload: 'M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6',
    chart: 'M4 3v18h17M8 16v-4m5 4V7m5 9v-6',
    grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
    arrow: 'M5 12h14m-6-6 6 6-6 6',
    plus: 'M12 5v14M5 12h14',
    logout: 'M9 4H4v16h5m5-13 5 5-5 5m-6-5h11',
    menu: 'M4 6h16M4 12h16M4 18h16',
    check: 'm5 12 4 4L19 6',
    file: 'M5 3h9l5 5v13H5zm9 0v5h5M8 12h8M8 16h6',
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.grid} />
    </svg>
  )
}
export function Brand() {
  return (
    <div className="brand">
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M5 25V8m7 17V15m7 10V4m7 21V12"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path d="M3 29h26" stroke="currentColor" />
      </svg>
      <span>
        Encuestas <strong>UMSS</strong>
        <small>Seguimiento académico</small>
      </span>
    </div>
  )
}
