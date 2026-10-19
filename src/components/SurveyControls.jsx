import { useId, useState } from 'react'
import { Field, Select } from './ui.jsx'
import { label } from '@/utils/format.js'
import { answerStates } from '@/utils/survey.js'

export function ValueInput({ field, value, onChange, required = false }) {
  const id = useId()
  if (field.type === 'multiselect')
    return (
      <fieldset className="choices">
        <legend>
          {field.label}
          {required ? ' *' : ''}
        </legend>
        {field.options.map((o) => (
          <label key={o.code} className="checkbox-row">
            <input
              type="checkbox"
              checked={Array.isArray(value) && value.includes(o.code)}
              onChange={(e) =>
                onChange(
                  e.target.checked
                    ? [...(value || []), o.code]
                    : (value || []).filter((v) => v !== o.code),
                )
              }
            />
            {o.label}
          </label>
        ))}
      </fieldset>
    )
  if (field.type === 'boolean')
    return (
      <Select
        label={`${field.label}${required ? ' *' : ''}`}
        value={value === true ? 'true' : value === false ? 'false' : ''}
        onChange={(e) =>
          onChange(e.target.value === '' ? null : e.target.value === 'true')
        }
        required={required}
        options={[
          { value: '', label: 'Sin respuesta' },
          { value: 'true', label: 'Sí' },
          { value: 'false', label: 'No' },
        ]}
      />
    )
  if (field.options?.length)
    return (
      <Select
        label={`${field.label}${required ? ' *' : ''}`}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        required={required}
        options={[
          { value: '', label: 'Seleccionar una respuesta' },
          ...field.options.map((o) => ({ value: o.code, label: o.label })),
        ]}
      />
    )
  const type =
    field.type === 'number'
      ? 'number'
      : field.type === 'date'
        ? 'date'
        : ['T32', 'E00'].includes(field.id)
          ? 'email'
          : field.id === 'T34'
            ? 'url'
            : 'text'
  return (
    <div className="field">
      <label htmlFor={id}>
        {field.label}
        {required ? ' *' : ''}
      </label>
      <input
        id={id}
        type={type}
        value={value ?? ''}
        min={type === 'number' ? 0 : undefined}
        step={type === 'number' ? 'any' : undefined}
        maxLength={type === 'text' ? 5000 : undefined}
        required={required}
        onChange={(e) =>
          onChange(
            e.target.value === ''
              ? null
              : type === 'number'
                ? Number(e.target.value)
                : e.target.value,
          )
        }
      />
      {field.unit && <small>Unidad: {field.unit}</small>}
    </div>
  )
}

const operators = {
  eq: 'Es igual a',
  in: 'Es uno de',
  gte: 'Mayor o igual que',
  lte: 'Menor o igual que',
  between: 'Está entre',
  contains_any: 'Incluye alguna',
  contains_all: 'Incluye todas',
  state_is: 'Estado de respuesta',
}
export function Filters({ fields, value, onChange }) {
  const [adding, setAdding] = useState(false)
  const [fieldId, setFieldId] = useState('')
  const [operator, setOperator] = useState('')
  const [input, setInput] = useState(null)
  const [second, setSecond] = useState('')
  const field = fields.find((f) => f.id === fieldId)
  const op = operator || field?.allowed_filter_operators?.[0]
  const many = ['in', 'contains_any', 'contains_all'].includes(op)
  const filterField = field && {
    ...field,
    type: many
      ? 'multiselect'
      : field.type === 'multiselect'
        ? 'category'
        : field.type,
  }
  if (many && field?.type === 'boolean')
    filterField.options = [
      { code: 'true', label: 'Sí' },
      { code: 'false', label: 'No' },
    ]
  const valid =
    field &&
    op &&
    input !== null &&
    input !== '' &&
    (!Array.isArray(input) || input.length > 0) &&
    (op !== 'between' || (second !== '' && Number(input) <= Number(second)))
  function add() {
    const next =
      op === 'between'
        ? [Number(input), Number(second)]
        : many && field.type === 'boolean'
          ? input.map((v) => v === 'true')
          : input
    onChange([...value, { field_id: fieldId, operator: op, value: next }])
    setAdding(false)
    setInput(null)
    setSecond('')
  }
  return (
    <div className="filter-block">
      <div className="filter-chips">
        {value.map((f, i) => (
          <span className="filter-chip" key={i}>
            {f.field_id} {operators[f.operator]}{' '}
            {Array.isArray(f.value)
              ? f.value.join(', ')
              : typeof f.value === 'boolean'
                ? f.value
                  ? 'Sí'
                  : 'No'
                : String(f.value)}
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              aria-label={`Quitar filtro ${i + 1}`}
            >
              ×
            </button>
          </span>
        ))}
        <button
          className="button small"
          type="button"
          disabled={value.length >= 20}
          onClick={() => setAdding(!adding)}
        >
          {adding ? 'Cerrar filtro' : '+ Agregar filtro'}
        </button>
        {value.length > 0 && <small>Se cumplen todas las condiciones.</small>}
      </div>
      {adding && (
        <div className="filter-editor">
          <Select
            label="Variable"
            value={fieldId}
            onChange={(e) => {
              setFieldId(e.target.value)
              setOperator('')
              setInput(null)
              setSecond('')
            }}
            options={[
              { value: '', label: 'Seleccionar variable' },
              ...fields.map((f) => ({
                value: f.id,
                label: `${f.id} · ${f.label}`,
              })),
            ]}
          />
          {field && (
            <>
              <Select
                label="Condición"
                value={op}
                onChange={(e) => {
                  setOperator(e.target.value)
                  setInput(null)
                  setSecond('')
                }}
                options={field.allowed_filter_operators.map((o) => ({
                  value: o,
                  label: operators[o],
                }))}
              />
              {op === 'state_is' ? (
                <Select
                  label="Estado"
                  value={input || ''}
                  onChange={(e) => setInput(e.target.value)}
                  options={[
                    { value: '', label: 'Seleccionar estado' },
                    ...answerStates.map((s) => ({ value: s, label: label(s) })),
                  ]}
                />
              ) : (
                <ValueInput
                  field={{
                    ...filterField,
                    label: op === 'between' ? 'Desde' : 'Valor',
                  }}
                  value={input}
                  onChange={setInput}
                />
              )}
              {op === 'between' && (
                <Field
                  label="Hasta"
                  type="number"
                  step="any"
                  value={second}
                  onChange={(e) => setSecond(e.target.value)}
                />
              )}
              <button
                type="button"
                className="button"
                disabled={!valid}
                onClick={add}
              >
                Aplicar filtro
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
