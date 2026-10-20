# Encuestas UMSS · dirección de interfaz

Sistema global aplicado: consultar [ESTILOS.md](ESTILOS.md) y `src/styles/tokens.css`. Se incorporan sombras suaves por petición del usuario, iconos Lucide, campos de 16 px y controles de 44 px. Los puntos de corte se unifican en 768 y 1200 px. Esta actualización prevalece sobre la preferencia inicial de superficies sin sombra.

Taste: `framed-sheet`, semilla `20261019`, elegida para jornadas de revisión y análisis. El marco gris azulado reúne navegación y cuenta; una hoja blanca contiene el trabajo. IBM Plex Sans para interfaz; IBM Plex Mono para códigos e identificadores. El símbolo de cuatro series representa encuestas y su análisis; no pretende ser el escudo oficial de la universidad.

Datos de trabajo: estudios con periodo y versión; archivos con hojas y posiciones; revisiones con conteos; incidencias por pregunta/gravedad; respuestas con origen, inclusión e historial; catálogos con tipos y opciones; resultados con denominador y versión; invitaciones de un solo uso; esquemas con borradores y publicaciones inmutables. Todos los datos de la aplicación se consultan a la API, sin métricas de ejemplo.

Preguntas por pantalla:

- Estudios: ¿qué estudio voy a trabajar?
- Resumen: ¿qué respuestas están incorporadas y de dónde vienen?
- Configuración: ¿qué región y qué preguntas representa cada columna?
- Revisión: ¿qué filas e incidencias necesitan una decisión?
- Incorporación: ¿qué revisión y cuántas filas voy a publicar?
- Respuestas: ¿qué se respondió y qué fue corregido?
- Estadísticas: ¿cómo se distribuyen las respuestas válidas después de los filtros?
- Invitaciones: ¿qué acceso privado puedo entregar a un titulado?
- Esquemas: ¿qué definiciones contiene una versión y está publicada?

Elemento propio del producto: el flujo original → preparación → incorporación, con revisión y conteos verificables. Los porcentajes proceden del backend; el cero no se sustituye por ausencia. Las variables configurables se identifican como registro disponible con integración aún pendiente en el backend.

UI UX Pro Max: se verificó el resultado de búsqueda `data-dense-dashboard` para `research analytics dashboard`. La consulta inicial de sistema propuso una estructura de página de presentación que no correspondía a una herramienta administrativa; se acotó a estilo de dashboard y se conservó la composición de Taste. Fondos planos, navegación discreta, tablas sin franjas alternadas, figuras alineadas, foco visible y controles ampliados en móvil.

Los archivos en `tests/` son exclusivamente datos de verificación sintéticos; no son datos institucionales.
