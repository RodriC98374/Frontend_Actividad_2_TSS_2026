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
