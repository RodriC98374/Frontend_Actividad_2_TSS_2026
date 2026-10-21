import { useState } from 'react'
import useResource from '@/hooks/useResource.js'
import { ActionForm, Select, Resource } from './ui.jsx'
import { RelationChart } from './ResultCharts.jsx'

export default function CompareResults({datasetId, survey, fields, filters, version, onRefresh, selection, onSelectionChange}) {
  const eligible = fields.filter(f => f.analytics?.includes('crosstab'))
  const [first, setFirst] = useState(selection?.first || '')
  const [second, setSecond] = useState(selection?.second || '')
  const spec = selection
  const setSpec = onSelectionChange
  const storageKey = `acredi:comparisons:${datasetId}:${survey}`
  const [saved, setSaved] = useState(() => {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || '[]')
      return Array.isArray(value) ? value.filter(s => typeof s?.first === 'string' && typeof s?.second === 'string').slice(0,6) : []
    } catch { return [] }
  })
  const [message,setMessage] = useState('')
  const result = useResource(spec ? `/datasets/${datasetId}/analytics/crosstab` : null, spec ? {survey_type:survey,field_id:spec.first,column_field_id:spec.second,filters} : {})
  const data = result.data?.data
  const dirty = spec && (spec.first !== first || spec.second !== second)
  const firstField = fields.find(f => f.id === spec?.first)
  const secondField = fields.find(f => f.id === spec?.second)
  function store(next) {
    try { localStorage.setItem(storageKey,JSON.stringify(next));setSaved(next);setMessage('Comparaciones guardadas en este navegador. No se guardan respuestas personales.') }
    catch { setMessage('El navegador no permite guardar la comparación. Puedes seguir consultándola aquí.') }
  }
  if (eligible.length < 2) return <p className="notice">Para relacionar preguntas necesitamos al menos dos preguntas categóricas compatibles con respuestas incorporadas.</p>
  return <section className="panel padded comparison-panel"><h2>Relacionar dos preguntas</h2><p>Elige qué comparar. Se aplicarán los mismos filtros del panel y solo se contarán participantes con ambas respuestas válidas.</p>
    {saved.length > 0 && <div className="saved-comparisons"><h3>Mis comparaciones en este navegador</h3>{saved.map((s,i) => <div key={`${s.first}-${s.second}`}><button className="button small" disabled={!eligible.some(f => f.id === s.first) || !eligible.some(f => f.id === s.second)} onClick={() => {setFirst(s.first);setSecond(s.second);setSpec(s)}}>{fields.find(f => f.id === s.first)?.label || s.first} / {fields.find(f => f.id === s.second)?.label || s.second}</button><button className="button small" aria-label={`Quitar comparación ${i+1}`} onClick={() => store(saved.filter((_,n) => n !== i))}>Quitar</button></div>)}</div>}
    <ActionForm submit="Mostrar comparación" protectChanges={false} submitDisabled={!first || !second || first === second} onSubmit={async () => {setSpec({first,second});result.reload()}}>
      <div className="form-grid"><Select label="Primera pregunta" value={first} onChange={e => {setFirst(e.target.value);setSecond('')}} options={[{value:'',label:'Elige qué quieres comparar'},...eligible.map(f => ({value:f.id,label:f.label}))]} />
      <Select label="Relacionar con" value={second} onChange={e => setSecond(e.target.value)} options={[{value:'',label:'Elige otra pregunta'},...eligible.filter(f => f.id !== first).map(f => ({value:f.id,label:f.label}))]} /></div>
    </ActionForm>
    {dirty && <p className="notice">Pulsa «Mostrar comparación» para aplicar las preguntas que acabas de elegir.</p>}
    {spec && !dirty && <Resource resource={result}>{data && (data.data_version !== version ? <p className="notice">Los datos del estudio cambiaron. <button className="button" onClick={onRefresh}>Actualizar panel</button></p> : <>
      <h3>{firstField?.label} / {secondField?.label}</h3><RelationChart data={data} rowLabel={firstField?.label} columnLabel={secondField?.label} />
      <button className="button" disabled={saved.length >= 6 || saved.some(s => s.first === spec.first && s.second === spec.second)} onClick={() => store([...saved,spec])}>Guardar comparación en este navegador</button>
    </>)}</Resource>}
    {message && <p role="status">{message}</p>}
  </section>
}
