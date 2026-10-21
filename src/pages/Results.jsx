import { useState } from 'react'
import { Link, useOutletContext, useSearchParams } from 'react-router-dom'
import useResource from '@/hooks/useResource.js'
import { api } from '@/services/api.js'
import { ActionForm, PageTitle, Resource, Select, Field, Empty } from '@/components/ui.jsx'
import { number, label } from '@/utils/format.js'
import { topics, topicFor, populationFilter } from '@/utils/workflow.js'
import VisualSummary from '@/components/VisualSummary.jsx'
import { shortTitle } from '@/utils/dashboard.js'
import CompareResults from '@/components/CompareResults.jsx'
import { DistributionChart, DataTable, ThemeChart } from '@/components/ResultCharts.jsx'
import { chartOptions, defaultChart, scaleGroups, headlineMetrics } from '@/utils/charts.js'

export default function Results() {
  const { dataset } = useOutletContext()
  const [params] = useSearchParams()
  const [survey, setSurvey] = useState(params.get('encuesta') === 'empleadores' ? 'empleadores' : 'titulados')
  const [topic, setTopic] = useState('all')
  const [population, setPopulation] = useState('')
  const [value, setValue] = useState('')
  const [filters, setFilters] = useState([])
  const [comparing, setComparing] = useState(false)
  const [comparison, setComparison] = useState(null)
  const [currentYear] = useState(() => new Date().getFullYear())
  const summary = useResource(`/datasets/${dataset.id}/analytics/overview`, { survey_type: survey, filters })
  const data = summary.data?.data
  const fields = (data?.results || []).map(r => r.field)
  const populationFields = fields.filter(f => ['X01', 'X02', 'X03', 'X04', 'T14', 'E02', 'E03', 'E04'].includes(f.id))
  const selected = populationFields.find(f => f.id === population)
  const availableTopics = new Set(fields.map(f => topicFor(f.id)))
  const visible = (data?.results || []).filter(r => topic === 'all' || topicFor(r.field.id) === topic)
  const metrics = headlineMetrics(data?.results || [])
  const groups = Object.entries(topics).filter(([id]) => id !== 'all').map(([id,title]) => ({id,title,entries:visible.filter(e => topicFor(e.field.id) === id)})).filter(g => g.entries.length)
  return <>
    <PageTitle title="Resultados" />
    <section className="panel padded">
      <div className="form-grid">
        <Select label="Encuesta" value={survey} onChange={e => { setSurvey(e.target.value); setTopic('all'); setFilters([]); setPopulation(''); setValue('') }} options={[{value:'titulados',label:'Titulados'},{value:'empleadores',label:'Empleadores'}]} />

      </div>
      <nav className="results-tabs" aria-label="Temas de resultados">{Object.entries(topics).filter(([id]) => id === 'all' || availableTopics.has(id)).map(([id,title]) => <button type="button" key={id} className={topic === id ? 'active' : ''} aria-pressed={topic === id} onClick={() => setTopic(id)}>{id === 'all' ? 'Resumen' : title}</button>)}</nav>
      <details className="guided-details">
        <summary>Filtrar participantes {filters.length ? '(selección aplicada)' : '(todas las respuestas)'}</summary>
        <ActionForm submit="Aplicar selección" protectChanges={false} onSubmit={async () => setFilters(populationFilter(selected, value))}>
          <div className="form-grid">
            <Select label="Limitar por información" value={population} onChange={e => {setPopulation(e.target.value); setValue('')}} options={[{value:'',label:'Todas las respuestas'}, ...populationFields.map(f => ({value:f.id,label:f.label}))]} />
            {selected && (selected.type === 'number'
              ? <Field label="Año" type="number" min="1900" max={currentYear} step="1" required value={value} onChange={e => setValue(e.target.value)} />
              : <Select label="Mostrar respuestas de" required value={value} onChange={e => setValue(e.target.value)} options={[{value:'',label:'Elige una opción'}, ...selected.options.map(o => ({value:o.code,label:o.label}))]} />)}
          </div>
        </ActionForm>
      </details>
      {filters.length > 0 && <div className="notice">Selección aplicada: {fields.find(f => f.id === filters[0].field_id)?.label} · {Array.isArray(filters[0].value) ? filters[0].value[0] : fields.find(f => f.id === filters[0].field_id)?.options.find(o => o.code === filters[0].value)?.label || String(filters[0].value)} <button className="button small" onClick={() => {setFilters([]);setPopulation('');setValue('')}}>Ver todas las respuestas</button></div>}
    </section>
    <Resource resource={summary}>
      {data && <>
        <div className="stat-strip" aria-live="polite"><div><span>Participantes seleccionados</span><strong>{number(data.filtered_responses)}</strong><small>de {number(data.total_responses)} incorporados</small></div>{metrics.map(m => <div key={m.id}><span>{m.title}</span><strong>{number(m.percentage)} %</strong><small>{number(m.count)} de {number(m.base)} respuestas válidas</small></div>)}</div>
        {data.total_responses > 0 && <div className="results-actions"><strong>{topic === 'all' ? 'Tu estudio de un vistazo' : topics[topic]}</strong><button className="button" aria-expanded={comparing} onClick={() => setComparing(!comparing)}>{comparing ? 'Cerrar comparación' : 'Relacionar preguntas'}</button></div>}
        {comparing && <CompareResults key={`${dataset.id}-${survey}`} datasetId={dataset.id} survey={survey} fields={fields} filters={filters} version={data.data_version} onRefresh={summary.reload} selection={comparison?.datasetId === dataset.id && comparison?.survey === survey ? comparison : null} onSelectionChange={spec => setComparison({...spec,datasetId:dataset.id,survey})} />}
        {!data.total_responses ? <Empty title="Todavía no hay respuestas incorporadas de esta encuesta" action={<Link className="button primary" to={`/estudios/${dataset.id}/importar`}>Subir un archivo</Link>}>Si ya subiste un Excel, abre su resumen y confirma la incorporación. También puedes elegir el otro tipo de encuesta.</Empty>
          : !visible.length ? <Empty title="No hay preguntas analizables para este tema">Los textos libres, contactos y números con unidad sin confirmar no generan gráficos automáticamente.</Empty>
          : topic === 'all' ? <VisualSummary entries={data.results} datasetId={dataset.id} survey={survey} filters={filters} version={data.data_version} onRefresh={summary.reload} />
          : groups.map(group => <section className="results-topic" key={group.id}><header><small className="eyebrow">{group.entries.length} preguntas</small><h2>{group.title}</h2></header>{scaleGroups(group.entries).map((entries,i) => <ThemeChart key={i} entries={entries} />)}<div className="results-grid">{group.entries.filter(e => !scaleGroups(group.entries).some(g => g.includes(e))).map(entry => <ResultCard key={`${entry.field.id}-${data.data_version}-${JSON.stringify(filters)}`} entry={entry} datasetId={dataset.id} survey={survey} filters={filters} />)}</div>{scaleGroups(group.entries).length > 0 && <details className="guided-details"><summary>Consultar preguntas individuales y descargar resultados</summary><div className="results-grid">{scaleGroups(group.entries).flat().map(entry => <ResultCard key={entry.field.id} entry={entry} datasetId={dataset.id} survey={survey} filters={filters} />)}</div></details>}</section>)}
      </>}
    </Resource>

  </>
}

export function ResultCard({ entry, datasetId, survey, filters }) {
  const { field, kind, result: data } = entry
  const [chart, setChart] = useState(kind === 'distribution' ? defaultChart(entry) : 'bars')
  return <section className="panel result-card">
    <div className="panel-heading"><div><small className="eyebrow">{topics[topicFor(field.id)]}</small><h2>{shortTitle(field)}</h2><p>{number(data.denominator)} respuestas válidas de {number(data.total_responses)} seleccionadas</p></div></div>
    {data.denominator === 0 ? <p className="panel-note">No hay respuestas válidas para esta pregunta en la selección actual.</p> : kind === 'distribution'
      ? <><details className="chart-controls"><summary>Cambiar gráfico</summary><Select label="Ver como" value={chartOptions(entry).includes(chart) ? chart : defaultChart(entry)} onChange={e => setChart(e.target.value)} options={chartOptions(entry).map(value => ({value,label:({bars:'Barras',columns:'Columnas',pie:'Torta'})[value]}))} /></details><DistributionChart data={data} type={chartOptions(entry).includes(chart) ? chart : defaultChart(entry)} title={field.label} /><details className="guided-details chart-data"><summary>Ver tabla de datos</summary><DataTable items={data.items} /></details></>
      : <dl className="metrics-grid">{[['mean','Promedio'],['min','Mínimo'],['max','Máximo']].map(([k,t]) => <div key={k}><dt>{t}</dt><dd>{number(data[k])}</dd></div>)}</dl>}
    {data.multiple_selection && <p className="panel-note">Se pueden elegir varias opciones: los porcentajes pueden sumar más de 100 %.</p>}
    <details className="guided-details"><summary>Ver detalle y descargar</summary><p>{field.label}</p>
      <ul>{Object.entries(data.states).filter(([,n]) => n > 0).map(([s,n]) => <li key={s}>{label(s)}: {number(n)}</li>)}</ul>
      <ActionForm submit="Descargar resultado" protectChanges={false} onSubmit={async form => {
        const format = form.get('format')
        const { data: exported } = await api.post(`/datasets/${datasetId}/exports`, {survey_type:survey,field_id:field.id,kind,filters,format,expected_data_version:data.data_version})
        const blob = await api.download(`/exports/${exported.id}/download`)
        const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `acredi-${field.id}.${format}`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
      }}><Select label="Formato" name="format" options={[{value:'xlsx',label:'Excel'},{value:'csv',label:'CSV'}]} /></ActionForm>
    </details>
  </section>
}
