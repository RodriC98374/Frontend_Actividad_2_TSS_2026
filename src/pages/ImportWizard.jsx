import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/context/auth.js'
import useResource from '@/hooks/useResource.js'
import { api } from '@/services/api.js'
import { PageTitle, Resource, Select, Field, ActionForm, Empty, Table } from '@/components/ui.jsx'
import { suggestMapping, simpleReviewColumns } from '@/utils/workflow.js'
import { number } from '@/utils/format.js'
import { ImportReview } from './Imports.jsx'

export default function ImportWizard() {
  const { importId } = useParams()
  const resource = useResource(`/imports/${importId}`)
  const item = resource.data?.data
  return <Resource resource={resource}>{item && <>
    <div className="breadcrumb"><Link to="/importaciones">Mis archivos</Link><span>/</span><Link to={`/estudios/${item.dataset_id}`}>Abrir estudio</Link></div>
    <PageTitle title={item.original_name} description="Revisa lo reconocido y confirma para ver tus resultados." />
    <ol className="workflow-steps" aria-label="Recorrido"><li>1. Archivo cargado</li><li aria-current={item.status !== 'committed' ? 'step' : undefined}>2. Revisar interpretación</li><li aria-current={item.status === 'committed' ? 'step' : undefined}>3. Confirmar y ver resultados</li></ol>
    {item.status !== 'committed' && item.duplicate_import_ids?.length > 0 && <div className="notice">Este archivo coincide con otra carga. Puedes abrirla para revisar su estado antes de volver a incorporar: {item.duplicate_import_ids.map((id,n) => <Link key={id} className="button small" to={`/importaciones/${id}`}>Abrir carga {n+1}</Link>)}</div>}
    {item.status === 'committed' ? <Empty title="Tu archivo ya está incorporado" action={<Link className="button primary" to={`/estudios/${item.dataset_id}/estadisticas?encuesta=${item.sheets.find(s => s.selected)?.survey_type || 'titulados'}`}>Ver todos los resultados</Link>}>No necesitas volver a configurarlo.</Empty>
      : item.status === 'failed' ? <Empty title="No se pudo leer el archivo">{item.last_error?.message || 'Comprueba el formato y vuelve a cargarlo.'}</Empty>
      : <Wizard key={`${item.id}-${item.configuration_revision}`} item={item} reload={resource.reload} />}
  </>}</Resource>
}

function Wizard({ item, reload }) {
  const { user } = useAuth()
  const sheets = item.sheets.filter(s => s.row_count > 1 && s.column_count > 0)
  const [sheetId, setSheetId] = useState(sheets.length === 1 ? sheets[0].id : '')
  const selectedSheets = item.sheets.filter(s => s.selected)
  const [editing, setEditing] = useState(false)
  const configured = selectedSheets.length > 0 && !editing
  const sheet = sheets.find(s => s.id === sheetId)
  const [survey, setSurvey] = useState(/\.pdf$/i.test(item.original_name) ? 'empleadores' : 'titulados')
  const noUsefulRows = configured && item.latest_validation_run_id && item.counts?.included_rows === 0
  return <>
    {/\.pdf$/i.test(item.original_name) && <section className="notice"><h2>Respuestas reconstruidas desde PDF</h2><p>Unimos las páginas que dividen la tabla en columnas. Revisa los textos: el PDF puede recortar respuestas y no podemos recuperar lo que falta. Los valores no reconocidos se señalarán en la validación; no se completan por suposición.</p><p>Las páginas originales quedan referenciadas en cada celda. Confirma la interpretación antes de incorporar las respuestas a las estadísticas.</p></section>}
    {noUsefulRows && <section className="notice error" role="alert"><h2>No se reconocieron respuestas válidas</h2><p>Se leyeron {item.counts.read_rows} filas, pero ninguna aporta respuestas interpretables. Repetir la validación no corrige el significado de las columnas.</p><p>Comprueba el tipo de encuesta y el encabezado. Una fecha de envío no es un año de egreso; un correo no es una respuesta de posgrado.</p>{user.can_import_files && <button className="button primary" onClick={() => {setSheetId(selectedSheets[0].id);setSurvey(selectedSheets[0].survey_type);setEditing(true)}}>Corregir tipo de encuesta e interpretación</button>}</section>}
    {!configured && <section className="panel padded"><h2>¿Qué respuestas contiene?</h2><div className="form-grid">
      <Select label="Tipo de encuesta" value={survey} onChange={e => setSurvey(e.target.value)} options={[{value:'titulados',label:'Titulados'},{value:'empleadores',label:'Empleadores'}]} />
      {sheets.length > 1 && <Select label="Hoja con las respuestas" value={sheetId} onChange={e => setSheetId(e.target.value)} options={[{value:'',label:'Elige la hoja que deseas analizar'},...sheets.map(s => ({value:s.id,label:`${s.name} · ${s.row_count} filas`} ))]} />}
    </div><p>Solo se analizará la hoja seleccionada. El original completo se conserva.</p></section>}
    {!configured && !user.can_import_files ? <Empty title="Necesitas permiso de importación para revisar el original" />
      : configured ? <><section className="panel padded"><h2>Interpretación guardada</h2><p>{selectedSheets.map(s => s.name).join(', ')} · {selectedSheets.reduce((n,s) => n + (s.mapping || []).filter(m => m.role === 'field').length, 0)} columnas identificadas.</p><p>Se conserva la interpretación que ya confirmaste para este archivo.</p>{user.can_import_files && <details className="guided-details"><summary>Configuración avanzada: corregir interpretación</summary><p>Volverás a revisar el significado de las columnas de una hoja. Se requerirá una nueva validación antes de incorporar.</p><button className="button" onClick={() => {setSheetId(selectedSheets[0].id);setSurvey(selectedSheets[0].survey_type);setEditing(true)}}>Revisar interpretación de una hoja</button></details>}</section><Confirmation item={item} reload={reload} /></>
      : sheet ? <Recognition key={`${sheet.id}-${survey}`} item={item} sheet={sheet} survey={survey} onSurveyChange={setSurvey} reload={reload} />
      : <Empty title={sheets.length ? 'Elige la hoja de respuestas para continuar' : 'No encontramos una hoja con encabezados y respuestas'} />}
    {item.latest_validation_run_id && <details className="panel padded guided-details"><summary>Revisar observaciones y decidir sobre filas</summary><ImportReview item={item} editable reload={reload} onSaved={reload} /></details>}
  </>
}

function Recognition({ item, sheet, survey, onSurveyChange, reload }) {
  const [headerChoice, setHeaderChoice] = useState('')
  const candidates = useResource(`/imports/${item.id}/sheets/${sheet.id}/assessment`, {survey_type:survey,header_row:1})
  const rows = candidates.data?.data.header_candidates || []
  const surveySuggestions = candidates.data?.data.survey_suggestions || []
  const alternative = surveySuggestions.find(s => s.survey_type !== survey && s.matched_columns > (surveySuggestions.find(x => x.survey_type === survey)?.matched_columns || 0))
  const unique = rows[0]?.matched_columns > 0 && (!rows[1] || rows[0].matched_columns > rows[1].matched_columns)
  const header = Number(headerChoice || (unique ? rows[0].row_number : 0))
  return <Resource resource={candidates}>
    <section className="panel padded"><h2>Lectura del archivo</h2><p>Hoja «{sheet.name}» · {number(sheet.row_count)} filas en el original.</p>
      {alternative && <div className="notice"><p>Los encabezados de la primera fila coinciden mejor con {alternative.survey_type}.</p><button className="button" onClick={() => onSurveyChange(alternative.survey_type)}>Revisar como {alternative.survey_type}</button></div>}
      {!header ? <p className="notice">No podemos identificar un encabezado único. Confirma la fila que contiene las preguntas.</p> : <p>Preguntas en la fila {header}; respuestas desde la fila {header + 1}.</p>}
      <details className="guided-details" open={!unique || undefined}><summary>Ajustar dónde empiezan las respuestas</summary>
        <Field label="Fila de encabezados" type="number" min="1" max={sheet.row_count - 1} value={headerChoice || header || ''} onChange={e => setHeaderChoice(e.target.value)} />
        <p>Opciones detectadas: {rows.map(r => `fila ${r.row_number} (${r.matched_columns} coincidencias)`).join('; ') || 'sin coincidencias exactas'}.</p>
      </details>
    </section>
    {header >= 1 && header < sheet.row_count && <Mapping key={header} item={item} sheet={sheet} survey={survey} onSurveyChange={onSurveyChange} header={header} reload={reload} />}
  </Resource>
}

function Mapping({ item, sheet, survey, onSurveyChange, header, reload }) {
  const assessment = useResource(`/imports/${item.id}/sheets/${sheet.id}/assessment`, {survey_type:survey,header_row:header})
  const catalog = useResource('/catalog', {survey_type:survey,dictionary_version:item.dictionary_version})
  const fields = catalog.data?.data.fields || []
  const columns = assessment.data?.data.columns || []
  const suggestions = assessment.data?.data.survey_suggestions || []
  const betterSurvey = suggestions.find(s => s.survey_type !== survey && s.matched_columns > (suggestions.find(x => x.survey_type === survey)?.matched_columns || 0))
  const [choices, setChoices] = useState({})
  const [delimiters, setDelimiters] = useState({})
  const [options, setOptions] = useState({})
  const [correcting, setCorrecting] = useState(null)
  const [lastRow, setLastRow] = useState(sheet.row_count)
  const proposed = suggestMapping(columns)
  const mapping = {...proposed, ...choices}
  const unresolved = columns.filter(c => !proposed[c.column_index] && c.nonempty_count > 0)
  const mapped = columns.filter(c => mapping[c.column_index] && mapping[c.column_index] !== 'ignore')
  const multiple = fields.filter(f => f.type === 'multiselect' && mapped.some(c => mapping[c.column_index] === f.id))
  const duplicates = mapped.filter(c => fields.find(f => f.id === mapping[c.column_index])?.type !== 'multiselect' && mapped.some(other => other.column_index !== c.column_index && mapping[other.column_index] === mapping[c.column_index]))
  const indexesFor = id => mapped.filter(c => mapping[c.column_index] === id)
  const missing = Object.values(choices).some(v => !v) || unresolved.some(c => !choices[c.column_index]) || multiple.some(f => indexesFor(f.id).length > 1 ? indexesFor(f.id).some(c => !options[c.column_index]) : !delimiters[f.id])
  const simpleColumns = simpleReviewColumns(columns, fields, mapping)
  const simpleCount = simpleColumns.filter(c => c.role === 'field').length
  const pendingColumns = columns.filter(c => c.nonempty_count > 0 && simpleColumns.find(m => m.column_index === c.column_index)?.role === 'ignore')
  const review = async (columnMapping, rules) => {
    const saved = await api.put(`/imports/${item.id}/sheets/${sheet.id}`, {
      expected_configuration_revision:item.configuration_revision, selected:true,survey_type:survey,dictionary_version:item.dictionary_version,header_row:header,
      data_region:{first_data_row:header+1,last_data_row:Number(lastRow),first_column_index:0,last_column_index:sheet.column_count-1},
      columns:columnMapping, multiselect_rules:rules,
    })
    try { await api.post(`/imports/${item.id}/validate`, {expected_configuration_revision:saved.data.configuration_revision}) }
    finally { reload() }
  }
  return <Resource resource={assessment}><Resource resource={catalog}><section className="panel padded">
    <h2>Esto encontramos en tu archivo</h2>
    {betterSurvey && <div className="notice"><p>El encabezado tiene más coincidencias con la encuesta de {betterSurvey.survey_type}. No asignes columnas a preguntas distintas solo para continuar.</p><button type="button" className="button" onClick={() => onSurveyChange(betterSurvey.survey_type)}>Revisar como {betterSurvey.survey_type}</button></div>}
    <div className="stat-strip"><div><span>Preguntas reconocidas</span><strong>{Object.keys(proposed).length}</strong></div><div><span>Columnas por aclarar</span><strong>{unresolved.length}</strong></div><div><span>Filas a revisar</span><strong>{Math.max(0,lastRow-header)}</strong></div></div>
    <div className="notice"><h3>Continúa con lo que ya está claro</h3><p>Podemos revisar {simpleCount} preguntas sin pedirte separadores ni asignaciones adicionales. Después verás cuántas respuestas válidas aportan y podrás confirmar su incorporación.</p>
      {pendingColumns.length > 0 && <><p>Estas {pendingColumns.length} columnas quedarán fuera de esta incorporación:</p><ul>{pendingColumns.map(c => <li key={c.column_index}>{fields.find(f => f.id === mapping[c.column_index])?.label || c.header || `Columna ${c.column_index+1}`}</li>)}</ul><p>El original se conserva. Para incluirlas ahora, abre «Ajustar interpretación» antes de continuar.</p></>}
    </div>
    <ActionForm submit={`Continuar con ${simpleCount} preguntas reconocidas`} submitDisabled={!simpleCount || !!betterSurvey} onSubmit={() => review(simpleColumns, [])} />
    <details className="guided-details" open={!simpleCount || undefined}><summary>Ajustar interpretación: incluir preguntas pendientes</summary>
    <details className="guided-details"><summary>Ver preguntas reconocidas y ejemplos</summary><Table headers={['Columna del Excel','Interpretación']}>{columns.filter(c => proposed[c.column_index]).map(c => <tr key={c.column_index}><td>{c.header}<small className="cell-sub">{(c.sample_values || []).map(String).join(' · ')}</small></td><td>{mapping[c.column_index] === 'ignore' ? 'No analizar' : fields.find(f => f.id === mapping[c.column_index])?.label}<button className="button small" onClick={() => setCorrecting(c.column_index)}>Corregir significado</button></td></tr>)}</Table></details>
    <ActionForm submit="Revisar respuestas del archivo" submitDisabled={missing || !mapped.length || !!duplicates.length} onSubmit={async () => {
      await review(
        columns.map(c => mapping[c.column_index] && mapping[c.column_index] !== 'ignore' ? {column_index:c.column_index,role:'field',field_id:mapping[c.column_index]} : {column_index:c.column_index,role:'ignore'}),
        multiple.map(f => indexesFor(f.id).length > 1
          ? {field_id:f.id,representation:'option_columns',options:indexesFor(f.id).map(c => ({column_index:c.column_index,option_code:options[c.column_index]})),selected_values:[1,'1',true,'Sí','Si','si'],unselected_values:[0,'0',false,null,'','No','no']}
          : {field_id:f.id,representation:'delimited_cell',column_index:indexesFor(f.id)[0].column_index,delimiter:delimiters[f.id]})
      )
    }}>
      {(missing || !mapped.length || duplicates.length > 0) && <div className="notice" role="status"><strong>Para continuar:</strong><ul>{!mapped.length && <li>Identifica al menos una pregunta real del archivo.</li>}{unresolved.filter(c => !choices[c.column_index]).length > 0 && <li>Quedan {unresolved.filter(c => !choices[c.column_index]).length} columnas por aclarar. Puedes indicar «No analizar» si son metadatos o información fuera del cuestionario.</li>}{multiple.some(f => indexesFor(f.id).length > 1 ? indexesFor(f.id).some(c => !options[c.column_index]) : !delimiters[f.id]) && <li>Confirma cómo se interpretan las respuestas múltiples.</li>}{duplicates.length > 0 && <li>Resuelve las preguntas de respuesta única asignadas a varias columnas.</li>}</ul></div>}
      {!!unresolved.length && <div className="notice">Aclara únicamente estas columnas. «No analizar» conserva el original y deja esa información fuera de las estadísticas.</div>}
      {columns.filter(c => unresolved.includes(c) || c.column_index === correcting).map(c => <div key={c.column_index}><Select label={`Columna ${c.column_index+1}: ${c.header || 'sin encabezado'} (${c.nonempty_count} valores)`} value={mapping[c.column_index] || ''} onChange={e => setChoices({...choices,[c.column_index]:e.target.value})} options={[{value:'',label:'Indica qué significa'},{value:'ignore',label:'No analizar esta columna'},...fields.map(f => ({value:f.id,label:f.label}))]} /><small>Ejemplos del archivo: {(c.sample_values || []).map(String).join(' · ') || 'sin valores'}</small></div>)}
      {multiple.map(f => indexesFor(f.id).length > 1 ? <section key={f.id}><h3>Una columna por opción: {f.label}</h3>{indexesFor(f.id).map(c => <Select key={c.column_index} label={`¿Qué opción representa «${c.header}»?`} value={options[c.column_index] || ''} onChange={e => setOptions({...options,[c.column_index]:e.target.value})} options={[{value:'',label:'Elige la opción'},...f.options.map(o => ({value:o.code,label:o.label}))]} />)}<label className="checkbox-row"><input type="checkbox" required />Confirmo que 1 / Sí marca selección y 0 / No / vacío indica que no se eligió. Otras marcas se mostrarán como observaciones.</label></section>
        : <div key={f.id}><Select label={`¿Cómo se separan las respuestas de «${f.label}»?`} value={delimiters[f.id] || ''} onChange={e => setDelimiters({...delimiters,[f.id]:e.target.value})} options={[{value:'',label:'Confirma el separador'},{value:';',label:'Punto y coma (;)'},{value:',',label:'Coma (,)'},{value:'|',label:'Barra (|)'},{value:'\n',label:'Salto de línea'}]} /><small>Ejemplos: {(indexesFor(f.id)[0].sample_values || []).map(String).join(' · ')}</small></div>)}
      {!!duplicates.length && <p className="notice">Varias columnas representan la misma pregunta de respuesta única. Aclara cuál debe analizarse. No las combinaremos automáticamente.</p>}
      <details className="guided-details"><summary>Configuración avanzada: límites e interpretación</summary>
        <Field label="Última fila de respuestas (excluye notas o totales al final)" type="number" min={header+1} max={sheet.row_count} value={lastRow} onChange={e => setLastRow(e.target.value)} required />
        <p>Los campos con unidad desconocida se conservan, pero no generan promedios. Las respuestas vacías no se convierten en «No».</p>
      </details>
    </ActionForm>
    </details>
  </section></Resource></Resource>
}

function Confirmation({ item, reload }) {
  const navigate = useNavigate()
  const key = useRef(null)
  const [stage, setStage] = useState('')
  const previous = useResource('/imports', {dataset_id:item.dataset_id,per_page:100})
  const prior = (previous.data?.data || []).filter(i => i.id !== item.id && i.status === 'committed')
  const [mode, setMode] = useState('append')
  const [replacement, setReplacement] = useState('')
  const ready = item.status === 'ready_to_commit'
  const counts = item.counts || {}
  const observations = (counts.warning_issues || 0) + (counts.excluded_rows || 0)
  return <section className="panel padded">
    <h2>{ready ? 'Revisa el resumen y abre tus resultados' : 'Comprobar las respuestas'}</h2>
    <div className="stat-strip"><div><span>Respuestas que se incorporarán</span><strong>{number(counts.included_rows)}</strong></div><div><span>Filas fuera de estadísticas</span><strong>{number(counts.excluded_rows)}</strong></div><div><span>Observaciones</span><strong>{number(counts.warning_issues)}</strong></div></div>
    {observations > 0 && <p className="notice">Hay información que no pudo interpretarse o filas excluidas. Revisa las observaciones al pie. Las respuestas inválidas no cuentan en los porcentajes; una fila puede aportar otras respuestas válidas.</p>}
    <ActionForm submit={ready ? 'Confirmar y ver estadísticas' : 'Revisar respuestas'} submitDisabled={ready && (previous.loading || !!previous.error)} onSubmit={async form => {
      if (!ready) {setStage('Comprobando respuestas…'); try {await api.post(`/imports/${item.id}/validate`, {expected_configuration_revision:item.configuration_revision})} finally {reload();setStage('')} return}
      if (observations && !form.get('accept_observations')) throw new Error('Confirma que revisaste las observaciones.')
      setStage('Incorporando respuestas…')
      key.current ||= crypto.randomUUID()
      try {await api.post(`/imports/${item.id}/commit`, {configuration_revision:item.configuration_revision,validation_run_id:item.latest_validation_run_id,policy:{mode,...(mode === 'replace' ? {replace_import_id:replacement} : {})}}, {headers:{'Idempotency-Key':key.current}})
        navigate(`/estudios/${item.dataset_id}/estadisticas?encuesta=${item.sheets.find(s => s.selected)?.survey_type || 'titulados'}`)
      } finally {setStage('')}
    }}>
      <Resource resource={previous}>{prior.length > 0 && <><p>Este estudio ya tiene archivos incorporados.</p><Select label="¿Qué debe hacer este archivo?" value={mode} onChange={e => {setMode(e.target.value);key.current=null}} options={[{value:'append',label:'Agregar estas respuestas'},{value:'replace',label:'Reemplazar una carga anterior'}]} />{mode === 'replace' && <><Select label="Archivo que será reemplazado" required value={replacement} onChange={e => {setReplacement(e.target.value);key.current=null}} options={[{value:'',label:'Selecciona un archivo'},...prior.map(i => ({value:i.id,label:i.original_name}))]} /><p className="notice">Sus respuestas dejarán de contar en las estadísticas. El historial se conservará.</p></>}</>}</Resource>
      {ready && observations > 0 && <label className="checkbox-row"><input name="accept_observations" type="checkbox" required />Revisé las observaciones y acepto incorporar las respuestas válidas.</label>}
      {ready && <label className="checkbox-row"><input type="checkbox" required />Confirmo la interpretación y las respuestas indicadas en este resumen.</label>}
      {stage && <p role="status">{stage}</p>}
    </ActionForm>
  </section>
}
