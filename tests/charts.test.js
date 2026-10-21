import test from 'node:test'
import assert from 'node:assert/strict'
import { chartOptions, scaleGroups, headlineMetrics } from '../src/utils/charts.js'

const entry = (id, items, type='scale') => ({field:{id,type},kind:'distribution',result:{denominator:10,items}})
test('una selección múltiple nunca se ofrece como torta', () => {
  const e = entry('E09',[{code:'a',label:'A'},{code:'b',label:'B'}],'multiselect')
  e.result.multiple_selection = true
  assert.deepEqual(chartOptions(e),['bars','columns'])
  e.result.multiple_selection = false
  assert.ok(chartOptions(e).includes('pie'))
})
test('solo agrupa preguntas con idénticas opciones y significado de escala', () => {
  const yes = [{code:'si',label:'Sí'},{code:'no',label:'No'}]
  const one=entry('P01',yes),two=entry('P02',yes),other=entry('P03',[{code:'si',label:'Otra escala'}])
  assert.deepEqual(scaleGroups([one,two,other,entry('E05',yes,'boolean')]),[[one,two]])
  assert.equal(one.result.denominator,10)
})
test('indicadores usan respuestas válidas y no convierten falta de datos en cero', () => {
  const contracted=entry('E05',[{code:'si',count:3},{code:'no',count:7}],'boolean')
  assert.deepEqual(headlineMetrics([contracted]),[{id:'E05',title:'Organizaciones que contrataron',count:3,base:10,percentage:30}])
  contracted.result.denominator=0
  assert.deepEqual(headlineMetrics([contracted]),[])
})
