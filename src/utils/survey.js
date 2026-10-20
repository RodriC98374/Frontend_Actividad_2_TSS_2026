export const answerStates = [
  'respondida',
  'sin_respuesta',
  'no_aplica',
  'indeterminada',
  'invalida',
  'no_disponible',
]
export const editableStates = answerStates.slice(0, 4)
export function displayValue(value, field) {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (Array.isArray(value))
    return value.map((v) => displayValue(v, field)).join(', ')
  return field?.options?.find((o) => o.code === value)?.label || String(value)
}
export function buildMapping(columns, mapping, firstColumn, lastColumn) {
  return columns
    .filter(
      (c) => c.column_index >= firstColumn && c.column_index <= lastColumn,
    )
    .map((c) => {
      const field = mapping[c.column_index]
      return field
        ? { column_index: c.column_index, role: 'field', field_id: field }
        : { column_index: c.column_index, role: 'ignore' }
    })
}
export function isCaptureFieldVisible(id, answers) {
  const conditions = {
    T04: 'T03',
    T05: 'T03',
    T06: 'T03',
    T07: 'T03',
    T09: 'T08',
    T10: 'T08',
    T11: 'T08',
    T32: 'T31',
    T33: 'T31',
    T34: 'T31',
  }
  if (conditions[id] && answers[conditions[id]] !== true) return false
  if (
    ['T15', 'T16', 'T17', 'T18', 'T19'].includes(id) &&
    answers.T14 !== 'emprendimiento_tiempo_completo'
  )
    return false
  if (
    id === 'X04' &&
    !['empleado', 'independiente', 'emprendimiento'].includes(answers.X03)
  )
    return false
  return true
}
export function captureAnswers(fields, values) {
  const answers = Object.fromEntries(
    fields.map((f) => [
      f.id,
      values[f.id] === '' ||
      values[f.id] === undefined ||
      (Array.isArray(values[f.id]) && !values[f.id].length)
        ? null
        : values[f.id],
    ]),
  )
  for (const field of fields)
    if (!isCaptureFieldVisible(field.id, answers)) answers[field.id] = null
  return answers
}
