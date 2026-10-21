import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

test('renderiza tablas paginadas, estados y controles con valores reales', async () => {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
  })
  try {
    const ui = await server.ssrLoadModule('/src/components/ui.jsx')
    const controls = await server.ssrLoadModule(
      '/src/components/SurveyControls.jsx',
    )
    const { ResultCard } = await server.ssrLoadModule('/src/pages/Results.jsx')
    const emptyResult = renderToStaticMarkup(createElement(ResultCard, {
      entry: { field: {id:'T14', label:'Situación laboral'}, kind:'distribution', result: {
        denominator:0,total_responses:3,states:{sin_respuesta:3},items:[],data_version:1,
      } }, datasetId:'test',survey:'titulados',filters:[],
    }))
    assert.match(emptyResult, /No hay respuestas válidas/)
    assert.match(emptyResult, /0 respuestas válidas de 3 seleccionadas/)
    assert.doesNotMatch(emptyResult, /0 %/)
    const charts = await server.ssrLoadModule('/src/components/ResultCharts.jsx')
    const chartData = {denominator:4,items:[{code:'si',label:'Sí',count:3,percentage:75},{code:'no',label:'No',count:1,percentage:25}]}
    for (const type of ['pie','columns','bars']) {
      const html = renderToStaticMarkup(createElement(charts.DistributionChart,{data:chartData,type,title:'Contratación'}))
      assert.match(html,/75/)
      assert.match(html,/25/)
      assert.match(html,/Sí/)
      assert.doesNotMatch(html,/NaN|Infinity/)
    }
    const emptyRelation = renderToStaticMarkup(createElement(charts.RelationChart,{data:{denominator:0}}))
    assert.match(emptyRelation,/ambas preguntas/)
    const { PairChart } = await server.ssrLoadModule('/src/components/VisualSummary.jsx')
    const pairData = {rows:[{code:'si',label:'Contrató'},{code:'no',label:'No contrató'}],columns:[{code:'si',label:'Contrataría'},{code:'no',label:'No contrataría'}],cells:[{row_code:'si',column_code:'si',count:3},{row_code:'si',column_code:'no',count:1},{row_code:'no',column_code:'si',count:0},{row_code:'no',column_code:'no',count:0}]}
    for (const type of ['grouped','stacked']) {
      const html = renderToStaticMarkup(createElement(PairChart,{data:pairData,type}))
      assert.match(html,/Contrataría/)
      assert.doesNotMatch(html,/NaN|Infinity/)
      if (type === 'stacked') { assert.match(html,/75 %/); assert.match(html,/Sin pares válidos/) }
    }
    const page = renderToStaticMarkup(
      createElement(ui.Pagination, {
        meta: { total: 101, page: 2, per_page: 20 },
        onPage() {},
      }),
    )
    assert.match(page, /21–40 de 101/)
    assert.match(page, /2 \/ 6/)
    assert.match(
      renderToStaticMarkup(
        createElement(ui.Status, { value: 'ready_to_commit' }),
      ),
      /Listo para incorporar/,
    )
    assert.match(
      renderToStaticMarkup(
        createElement(controls.ValueInput, {
          field: { id: 'T08', label: '¿Trabaja?', type: 'boolean' },
          value: false,
          onChange() {},
        }),
      ),
      /value="false" selected/,
    )
    assert.match(
      renderToStaticMarkup(
        createElement(controls.ValueInput, {
          field: { id: 'T12', label: 'Años', type: 'number' },
          value: 0,
          onChange() {},
        }),
      ),
      /value="0"/,
    )
    for (const module of [
      'Analytics',
      'Results',
      'ImportWizard',
      'Capture',
      'Imports',
      'Login',
      'Responses',
      'Schemas',
      'Studies',
    ]) {
      const pageModule = await server.ssrLoadModule(`/src/pages/${module}.jsx`)
      assert.equal(typeof pageModule.default, 'function')
    }
  } finally {
    await server.close()
  }
})
