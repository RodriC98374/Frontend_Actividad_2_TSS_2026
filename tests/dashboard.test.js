import test from 'node:test'
import assert from 'node:assert/strict'
import { dashboardCards, shortTitle } from '../src/utils/dashboard.js'

const entry = (id, type='category', denominator=8, analytics=['distribution','crosstab']) => ({field:{id,type,label:id,analytics},kind:'distribution',result:{denominator,items:[{code:'si',label:'Sí',count:8,percentage:100}]}})
test('resumen limita a cuatro gráficos y prioriza cruces compatibles y escalas', () => {
  const cards = dashboardCards(['E02','E03','E05','E06'].map(id => entry(id)).concat([entry('P01','scale'),entry('P02','scale')]))
  assert.equal(cards.length,4)
  assert.equal(cards[0].kind,'relation')
  assert.deepEqual(cards[0].pair.slice(0,2),['E03','E06'])
  assert.equal(cards[1].kind,'scale')
  assert.equal(cards[2].entry.field.id,'E02')
  assert.equal(cards[3].pair[3],'stacked')
})
test('no propone cruces con campos ausentes, sin datos o incompatibles', () => {
  const cards = dashboardCards([entry('E03'),entry('E06','category',0),entry('E04'),entry('E07','multiselect',8,['distribution'])])
  assert.ok(cards.every(c => c.kind !== 'relation'))
  assert.deepEqual(dashboardCards([]),[])
  assert.equal(shortTitle({id:'custom',label:'Pregunta propia'}),'Pregunta propia')
})
