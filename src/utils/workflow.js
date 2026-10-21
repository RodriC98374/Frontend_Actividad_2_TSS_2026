export const topics = {
  all: 'Todos los temas', profile: 'Perfil de participantes', education: 'Formación y posgrado',
  employment: 'Empleo', business: 'Emprendimiento', training: 'Evaluación de la formación',
  organization: 'Perfil de organizaciones', hiring: 'Contratación y demanda', market: 'Necesidades del mercado', connection: 'Vinculación', other: 'Otros resultados',
}
export function topicFor(id) {
  if (/^P\d/.test(id)) return 'training'
  if (/^V\d/.test(id) || id === 'T31') return 'connection'
  if (/^E0[5-9]$/.test(id)) return 'hiring'
  if (/^E1[0-2]$/.test(id)) return 'market'
  if (/^E\d/.test(id)) return 'organization'
  if (['T01', 'T02', 'X01', 'X02'].includes(id)) return 'profile'
  if (['X03', 'X04'].includes(id)) return 'employment'
  if (['X05', 'X06', 'X07'].includes(id)) return 'education'
  const n = /^T\d+$/.test(id) ? Number(id.slice(1)) : -1
  if (n >= 3 && n <= 11) return 'education'
  if ((n >= 12 && n <= 14) || (n >= 20 && n <= 22)) return 'employment'
  if (n >= 15 && n <= 19) return 'business'
  if (n >= 23 && n <= 30) return 'training'
  return 'other'
}

// Never infer a scalar mapping when two columns claim the same question.
export function suggestMapping(columns) {
  const counts = new Map()
  for (const c of columns) if (c.field_candidates.length === 1)
    counts.set(c.field_candidates[0], (counts.get(c.field_candidates[0]) || 0) + 1)
  return Object.fromEntries(columns.filter(c => c.field_candidates.length === 1 && counts.get(c.field_candidates[0]) === 1)
    .map(c => [c.column_index, c.field_candidates[0]]))
}

// A partial review must never guess delimiters or resolve competing meanings.
export function simpleReviewColumns(columns, fields, mapping) {
  const counts = new Map()
  for (const c of columns) {
    const id = mapping[c.column_index]
    if (id && id !== 'ignore') counts.set(id, (counts.get(id) || 0) + 1)
  }
  return columns.map(c => {
    const id = mapping[c.column_index]
    const field = fields.find(f => f.id === id)
    return field && field.type !== 'multiselect' && counts.get(id) === 1
      ? {column_index:c.column_index, role:'field', field_id:id}
      : {column_index:c.column_index, role:'ignore'}
  })
}

export function populationFilter(field, value) {
  if (!field || value === '') return []
  if (field.type === 'number') {
    const n = Number(value)
    if (!Number.isFinite(n)) throw new Error('Escribe un año válido.')
    return [{ field_id: field.id, operator: 'between', value: [n, n] }]
  }
  return [{ field_id: field.id, operator: 'eq', value: field.type === 'boolean' ? value === 'true' : value }]
}
