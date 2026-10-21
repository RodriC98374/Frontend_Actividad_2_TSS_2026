import { scaleGroups } from './charts.js'
import { topicFor } from './workflow.js'

const titles = {
  E02:'Tipo de organización', E03:'Tamaño de organización', E04:'Sector', E05:'Contratación anterior', E06:'Intención de contratar', E07:'Formación requerida', E08:'Canales de convocatoria', E09:'Cargos requeridos',
  P01:'Confianza en la carrera', P02:'Título y competencias', P03:'Consulta a empleadores', P04:'Conocimiento del perfil', P05:'Perfil y desempeño', P06:'Preparación profesional', P07:'Participación en la formación', P08:'Competencias laborales', P09:'Valores profesionales', P10:'Retroalimentación',
  V01:'Vínculos laborales', V02:'Actividades con el entorno', V03:'Difusión de oportunidades', V04:'Intercambio profesional', V05:'Consulta sobre desempeño', V06:'Pertinencia de la formación', V07:'Búsqueda de talento', V08:'Participación en autoevaluación',
}
export const shortTitle = field => titles[field.id] || field.label

export function dashboardCards(entries) {
  const valid = entries.filter(e => e.result.denominator > 0)
  const byId = new Map(valid.map(e => [e.field.id,e]))
  const pairs = [
    ['E03','E06','¿Quiénes contratarían?','grouped'],
    ['E05','E06','Experiencia e intención de contratar','stacked'],
    ['E04','E07','¿Qué formación pide cada sector?','heat'],
  ].filter(([a,b]) => [a,b].every(id => byId.get(id)?.field.analytics?.includes('crosstab')))
  const scales = ['training','connection'].flatMap(topic => scaleGroups(valid.filter(e => topicFor(e.field.id) === topic)).map(entries => ({kind:'scale',title:topic === 'training' ? '¿Cómo valoran la formación?' : 'Vinculación con la universidad',entries})))
  const cards = []
  if (pairs[0]) cards.push({kind:'relation',pair:pairs[0]})
  if (scales[0]) cards.push(scales[0])
  const profile = byId.get('E02') || byId.get('E03')
  if (profile) cards.push({kind:'single',entry:profile})
  if (pairs[1]) cards.push({kind:'relation',pair:pairs[1]})
  for (const card of [...scales.slice(1),...pairs.slice(2).map(pair => ({kind:'relation',pair})),...valid.map(entry => ({kind:'single',entry}))]) {
    if (cards.length >= 4) break
    if (card.kind === 'single' && cards.some(c => c.entry === card.entry || c.entries?.includes(card.entry))) continue
    cards.push(card)
  }
  return cards.slice(0,4)
}
