import useResource from '@/hooks/useResource.js'
import { Resource } from './ui.jsx'
import { DistributionChart, ThemeChart, RelationChart } from './ResultCharts.jsx'
import { chartColor, defaultChart } from '@/utils/charts.js'
import { dashboardCards, shortTitle } from '@/utils/dashboard.js'
import { number } from '@/utils/format.js'

export function PairChart({data, type}) {
  const max = Math.max(1,...data.cells.map(c => c.count))
  return <div className="pair-chart"><ul className="chart-legend inline">{data.columns.map((c,i) => <li key={c.code}><span className="chart-dot" style={{background:chartColor(c.code,i)}} />{c.label}</li>)}</ul>
    {type === 'stacked' ? data.rows.map(row => {
      const cells = data.columns.map(column => data.cells.find(c => c.row_code === row.code && c.column_code === column.code))
      const total = cells.reduce((n,c) => n + (c?.count || 0),0)
      return <div className="pair-stack" key={row.code}><strong>{row.label} <small>· {number(total)} personas</small></strong>{total ? <div className="stacked-track">{cells.map((cell,i) => <span key={data.columns[i].code} style={{flexBasis:`${100*(cell?.count || 0)/total}%`,background:chartColor(data.columns[i].code,i)}} title={`${data.columns[i].label}: ${cell?.count || 0}`}>{100*(cell?.count || 0)/total >= 12 ? `${Math.round(100*cell.count/total)} %` : ''}</span>)}</div> : <p>Sin pares válidos</p>}</div>
    }) : <><div className="pair-columns">{data.rows.map(row => <div className="pair-group" key={row.code}><div className="pair-bars">{data.columns.map((column,i) => {
      const count = data.cells.find(c => c.row_code === row.code && c.column_code === column.code)?.count || 0
      return <div className="pair-bar" key={column.code}><span style={{height:`${100*count/max}%`,background:chartColor(column.code,i)}} title={`${row.label} · ${column.label}: ${count}`} /><strong>{count}</strong></div>
    })}</div><span>{row.label}</span></div>)}</div><small className="chart-axis-label">Personas · escala de 0 a {max}</small></>}
  </div>
}

function SuggestedRelation({pair,entries,datasetId,survey,filters,version,onRefresh}) {
  const [first,second,title,type] = pair
  const resource = useResource(`/datasets/${datasetId}/analytics/crosstab`,{survey_type:survey,field_id:first,column_field_id:second,filters})
  const data = resource.data?.data
  const a = entries.find(e => e.field.id === first).field
  const b = entries.find(e => e.field.id === second).field
  return <section className="panel padded visual-card"><h2>{title}</h2><small className="muted">{shortTitle(a)} × {shortTitle(b)}</small><Resource resource={resource}>{data && (data.data_version !== version ? <button className="button" onClick={onRefresh}>Actualizar resultados</button> : !data.denominator ? <p className="notice">Sin respuestas válidas en ambas preguntas.</p> : <><p className="chart-base">{number(data.denominator)} respuestas válidas</p>{type === 'heat' ? <RelationChart data={data} rowLabel={shortTitle(a)} columnLabel={shortTitle(b)} /> : <PairChart data={data} type={type} />}<details className="guided-details"><summary>Ver detalle</summary><p>{a.label}</p><p>{b.label}</p>{type === 'stacked' && <p>Porcentaje dentro de cada grupo de contratación anterior.</p>}<RelationChart data={data} rowLabel={shortTitle(a)} columnLabel={shortTitle(b)} /></details></>)}</Resource></section>
}

export default function VisualSummary(props) {
  const cards = dashboardCards(props.entries)
  return cards.length ? <div className="visual-summary">{cards.map((card,i) => card.kind === 'relation' ? <SuggestedRelation key={card.pair.join('-')} {...props} pair={card.pair} /> : card.kind === 'scale' ? <ThemeChart key={`scale-${i}`} entries={card.entries} compact title={card.title} /> : <section className="panel padded visual-card" key={card.entry.field.id}><h2>{shortTitle(card.entry.field)}</h2><p className="chart-base">{number(card.entry.result.denominator)} respuestas válidas</p>{card.entry.kind === 'distribution' ? <DistributionChart data={card.entry.result} type={card.entry.field.id === 'E02' && card.entry.result.items.length <= 5 ? 'pie' : defaultChart(card.entry)} title={shortTitle(card.entry.field)} /> : <strong className="summary-number">{number(card.entry.result.mean)}<small> promedio</small></strong>}<details className="guided-details"><summary>Ver detalle</summary><p>{card.entry.field.label}</p><p>Base: {number(card.entry.result.denominator)} de {number(card.entry.result.total_responses)} participantes.</p></details></section>)}</div> : <p className="notice">No hay respuestas válidas para dibujar gráficos en esta selección.</p>
}
