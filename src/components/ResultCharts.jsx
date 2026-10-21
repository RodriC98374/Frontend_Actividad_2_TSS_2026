import { useId } from 'react'
import { number } from '@/utils/format.js'
import { shortTitle } from '@/utils/dashboard.js'
import { chartColor } from '@/utils/charts.js'
import { Table } from './ui.jsx'

export function DataTable({items}) {
  return <Table headers={['Respuesta','Personas','Porcentaje']}>{items.map(o => <tr key={o.code}><td>{o.label}</td><td>{number(o.count)}</td><td>{o.percentage == null ? '—' : `${number(o.percentage)} %`}</td></tr>)}</Table>
}

export function DistributionChart({data, type='bars', title}) {
  const id = useId()
  const items = data.items
  if (!data.denominator) return <p className="panel-note">No hay respuestas válidas en la selección actual.</p>
  if (type === 'pie' && !data.multiple_selection) {
    return <div className="pie-layout"><svg viewBox="0 0 220 220" role="img" aria-labelledby={id}><title id={id}>{`${title}: distribución sobre ${data.denominator} respuestas válidas`}</title>
      {items.map((o,i) => {
        const fraction = o.count / data.denominator
        const start = items.slice(0,i).reduce((sum,item) => sum + item.count,0) / data.denominator
        return <circle key={o.code} cx="110" cy="110" r="78" fill="none" stroke={chartColor(o.code,i)} strokeWidth="36" pathLength="100" strokeDasharray={`${fraction*100} ${100-fraction*100}`} strokeDashoffset={-start*100} transform="rotate(-90 110 110)"><title>{`${o.label}: ${o.count} (${number(o.percentage)} %)`}</title></circle>
      })}<text x="110" y="108" textAnchor="middle" className="pie-total">{number(data.denominator)}</text><text x="110" y="131" textAnchor="middle">respuestas</text></svg>
      <ul className="chart-legend">{items.map((o,i) => <li key={o.code}><span className="chart-dot" style={{background:chartColor(o.code,i)}} /><span>{o.label}<strong>{number(o.count)} · {number(o.percentage)} %</strong></span></li>)}</ul></div>
  }
  if (type === 'columns') return <div className="column-chart"><span className="chart-axis-label">Porcentaje de respuestas válidas · eje Y</span><div className="column-plot">{items.map((o,i) => <div className="column-item" key={o.code}><div className="column-space"><span className="column-fill" style={{height:`${Math.max(0,o.percentage || 0)}%`,background:chartColor(o.code,i)}} /><strong>{number(o.percentage)} %</strong></div><span>{o.label}</span><small>{number(o.count)} personas</small></div>)}</div><span className="chart-axis-label">Opciones de respuesta · eje X · escala 0–100 %</span></div>
  return <div className="horizontal-chart">{items.map((o,i) => <div key={o.code}><div className="chart-row-label"><span>{o.label}</span><strong>{number(o.count)} · {number(o.percentage)} %</strong></div><div className="chart-track"><span style={{width:`${o.percentage || 0}%`,background:chartColor(o.code,i)}} /></div></div>)}</div>
}

export function ThemeChart({entries, compact=false, title="Valoraciones del tema"}) {
  const items = entries[0].result.items
  return <section className="panel padded theme-chart"><h2>{title}</h2><small className="muted">{entries.length} preguntas · base válida por pregunta</small>
    <ul className="chart-legend inline">{items.map((o,i) => <li key={o.code}><span className="chart-dot" style={{background:chartColor(o.code,i)}} />{o.label}</li>)}</ul>
    {(compact ? entries.slice(0,5) : entries).map(entry => <div className="theme-chart-row" key={entry.field.id}><div><strong>{shortTitle(entry.field)}</strong><small>{number(entry.result.denominator)} respuestas válidas</small></div>
      {entry.result.denominator ? <><div className="stacked-track" aria-hidden="true">{entry.result.items.map((o,i) => <span key={o.code} style={{flexBasis:`${100*o.count/entry.result.denominator}%`,background:chartColor(o.code,i)}} title={`${o.label}: ${number(o.percentage)} %`}>{o.percentage >= 12 ? `${number(o.percentage)} %` : ''}</span>)}</div><details><summary>Ver detalle</summary><p>{entry.field.label}</p><DataTable items={entry.result.items} /></details></> : <p>Sin respuestas válidas</p>}
    </div>)}
    {compact && entries.length > 5 && <details className="guided-details"><summary>Ver las {entries.length - 5} preguntas restantes</summary><ThemeChart entries={entries.slice(5)} title="Más valoraciones" /></details>}
  </section>
}

export function RelationChart({data, rowLabel, columnLabel}) {
  if (!data.denominator) return <p className="notice">No hay participantes con respuestas válidas en ambas preguntas para esta selección.</p>
  const max = Math.max(1,...data.cells.map(c => c.count))
  return <><p>{number(data.denominator)} participantes con ambas respuestas válidas. Las celdas muestran personas, no una relación causal.</p>
    <p className="chart-axis-label">Filas: {rowLabel} · Columnas: {columnLabel}</p>
    <Table headers={[rowLabel,...data.columns.map(c => c.label)]}>{data.rows.map(row => <tr key={row.code}><th scope="row">{row.label}</th>{data.columns.map(column => {
      const cell = data.cells.find(c => c.row_code === row.code && c.column_code === column.code)
      const count = cell?.count || 0
      return <td key={column.code}><span className="heat-value" style={{background:`color-mix(in srgb, var(--chart-1) ${Math.round(count/max*75)}%, var(--surface))`,color:count/max > .6 ? 'var(--on-dark)' : 'var(--text)'}}>{number(count)}</span></td>
    })}</tr>)}</Table><p className="muted">Color más intenso = más participantes. La escala se ajusta al mayor conteo de esta comparación.</p></>
}
