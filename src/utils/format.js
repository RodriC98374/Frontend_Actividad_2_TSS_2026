export const surveyLabels = {
  titulados: 'Titulados',
  empleadores: 'Empleadores',
}
const states = {
  active: 'Activo',
  awaiting_configuration: 'Por configurar',
  configured: 'Configurado',
  needs_review: 'Requiere revisión',
  ready_to_commit: 'Listo para incorporar',
  committed: 'Incorporado',
  failed: 'Falló la lectura',
  reading: 'Leyendo',
  draft: 'Borrador',
  published: 'Publicado',
  completed: 'Finalizado',
  ready: 'Listo',
  respondida: 'Respondida',
  sin_respuesta: 'Sin respuesta',
  no_aplica: 'No aplica',
  indeterminada: 'Indeterminada',
  invalida: 'Inválida',
  no_disponible: 'No disponible',
  import: 'Archivo',
  direct: 'Formulario',
  warning: 'Advertencia',
  blocking: 'Bloqueante',
}
export const label = (value) => states[value] || value || '—'
export const number = (value) =>
  value == null
    ? '—'
    : new Intl.NumberFormat('es-BO', { maximumFractionDigits: 2 }).format(value)
export const date = (value) =>
  value
    ? new Intl.DateTimeFormat('es-BO', {
        dateStyle: 'medium',
        timeZone: 'America/La_Paz',
      }).format(new Date(value))
    : '—'
