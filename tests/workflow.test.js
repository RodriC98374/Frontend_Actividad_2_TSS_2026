import test from 'node:test'
import assert from 'node:assert/strict'
import { suggestMapping, simpleReviewColumns, topicFor, populationFilter } from '../src/utils/workflow.js'

test('revisión simple deja pendientes metadatos, múltiples y asignaciones duplicadas', () => {
  const columns = Array.from({length:6}, (_,column_index) => ({column_index}))
  const fields = [{id:'P01',type:'scale'}, {id:'E09',type:'multiselect'}, {id:'E02',type:'category'}]
  assert.deepEqual(simpleReviewColumns(columns, fields, {1:'P01',2:'E09',3:'E02',4:'E02',5:'ignore'}), [
    {column_index:0,role:'ignore'}, {column_index:1,role:'field',field_id:'P01'},
    {column_index:2,role:'ignore'}, {column_index:3,role:'ignore'},
    {column_index:4,role:'ignore'}, {column_index:5,role:'ignore'},
  ])
})

test('el reconocimiento no adivina columnas ambiguas ni duplica preguntas', () => {
  assert.deepEqual(suggestMapping([
    {column_index:0,field_candidates:['T03']},
    {column_index:1,field_candidates:['T08']},
    {column_index:2,field_candidates:['T08']},
    {column_index:3,field_candidates:['T01','T02']},
    {column_index:4,field_candidates:[]},
  ]), {0:'T03'})
})
test('los temas respetan los significados del catálogo y no crean filtros', () => {
  assert.equal(topicFor('T08'), 'education')
  assert.equal(topicFor('T14'), 'employment')
  assert.equal(topicFor('T17'), 'business')
  assert.equal(topicFor('X07'), 'education')
  assert.equal(topicFor('E04'), 'organization')
  assert.equal(topicFor('P01'), 'training')
  assert.equal(topicFor('V01'), 'connection')
})
test('la selección de población conserva años exactos y códigos sin filtros al ver todos', () => {
  assert.deepEqual(populationFilter({id:'X01',type:'number'}, '2024'), [{field_id:'X01',operator:'between',value:[2024,2024]}])
  assert.deepEqual(populationFilter({id:'T14',type:'category'}, 'sin_trabajo'), [{field_id:'T14',operator:'eq',value:'sin_trabajo'}])
  assert.deepEqual(populationFilter(undefined, ''), [])
  assert.throws(() => populationFilter({id:'X01',type:'number'}, 'foo'))
})
