export function chartColor(code, index = 0) {
  const semantic = {si:0, no:3, totalmente_de_acuerdo:0, parcialmente_de_acuerdo:1, totalmente_desacuerdo:3, no_sabe:5}
  return `var(--chart-${(semantic[String(code)] ?? index % 8) + 1})`
}

export function chartOptions(entry) {
  const options = ['bars', 'columns']
  if (!entry.result.multiple_selection && entry.result.items.length <= 5) options.push('pie')
  return options
}

export function defaultChart(entry) {
  return entry.field.type === 'boolean' ? 'pie' : entry.result.items.length <= 4 ? 'columns' : 'bars'
}

export function scaleGroups(entries) {
  const groups = new Map()
  for (const entry of entries) {
    if (entry.field.type !== 'scale' || entry.kind !== 'distribution' || entry.result.multiple_selection) continue
    const signature = JSON.stringify(entry.result.items.map(o => [o.code,o.label]))
    if (!groups.has(signature)) groups.set(signature, [])
    groups.get(signature).push(entry)
  }
  return [...groups.values()].filter(group => group.length > 1)
}

export function headlineMetrics(entries) {
  const definitions = [
    ['E05','Organizaciones que contrataron',['si']],
    ['E06','Alta probabilidad de contratar',['si_existe_una_alta_probabilidad_de_contratacion']],
    ['T03','Participantes con posgrado',['si']],
  ]
  return definitions.flatMap(([id,title,codes]) => {
    const data = entries.find(e => e.field.id === id)?.result
    if (!data?.denominator) return []
    const count = data.items.filter(i => codes.includes(String(i.code))).reduce((sum,i) => sum + i.count, 0)
    return [{id,title,count,base:data.denominator,percentage:100*count/data.denominator}]
  }).slice(0,2)
}
