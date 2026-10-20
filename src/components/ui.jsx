import { useUnsavedChanges } from '@/context/unsaved.js'
import { Folder, FileUp, ChartColumn, Layers, ArrowRight, Plus, LogOut, Menu, Check, FileText, BookOpen, ClipboardList, Link, Download, Settings } from 'lucide-react'
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
  protectChanges = true,
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const errorRef = useRef(null)
  const markDirty = useUnsavedChanges()
  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])
  async function run(event) {
    event.preventDefault()
    if (busy) return
    const form = event.currentTarget
    markDirty(false)
    setBusy(true)
    setError(null)
    try {
      await onSubmit(new FormData(form), form)
      onSuccess?.()
    } catch (e) {
      markDirty(protectChanges)
      setError(e)
    } finally {
      setBusy(false)
    }
  }
  return (
    <form className={`form ${className}`} onSubmit={run} onChange={() => markDirty(protectChanges)}>
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
const icons = {
  studies: Folder, upload: FileUp, chart: ChartColumn, grid: Layers,
  arrow: ArrowRight, plus: Plus, logout: LogOut, menu: Menu,
  check: Check, file: FileText, help: BookOpen, responses: ClipboardList,
  invitation: Link, download: Download, settings: Settings,
}

// Decorative icons accompany text. Icon-only buttons must provide their own label.
export function Icon({ name, size = 20 }) {
  const Symbol = icons[name] || Layers
  return <Symbol size={size} strokeWidth={2} aria-hidden="true" focusable="false" />
}
export function Brand() {
  return (
    <div className="brand">
      <img className="brand-mark" src="/brand/acredi.png" alt="" width="40" height="40" />
      <span>
        <strong className="brand-name">ACRE<span>DI</span></strong>
        <small>Seguimiento académico</small>
      </span>
    </div>
  )
}
