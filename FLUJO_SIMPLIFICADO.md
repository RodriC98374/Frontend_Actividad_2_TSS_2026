# Flujo de encuestas simplificado

## Recorrido implementado

1. Subir Excel/CSV desde un estudio. Los ajustes CSV están plegados.
2. Seleccionar encuesta y, si corresponde, una hoja entre varias. Se omiten hojas sin filas de datos.
3. Proponer encabezado solo con coincidencias exactas y una puntuación superior al segundo candidato. Si hay empate o no hay coincidencias, pedir la fila.
4. Mostrar preguntas reconocidas. Preguntar únicamente por columnas desconocidas, ambiguas o repetidas; permitir corregir una interpretación concreta desde el resumen.
5. Confirmar separadores de multiselección o las opciones de cada columna y las marcas de selección. Nunca inferir unidades ni combinar columnas escalares repetidas.
6. Guardar y validar con «Revisar respuestas del archivo». Presentar incluidas, excluidas y observaciones. Los cambios y fallos no incorporan automáticamente datos.
7. Confirmar e incorporar con revisión vigente e idempotencia. Si hay observaciones o exclusiones, solicitar aceptación explícita. Las decisiones por fila/grupo siguen disponibles en un apartado plegado.
8. Abrir estadísticas de la encuesta incorporada. Los archivos ya incorporados ofrecen acceso directo a resultados.

Los ajustes avanzados permiten corregir encabezado, límite final e interpretación. No se muestra el catálogo completo como formulario de configuración: las preguntas conocidas son un resumen de lectura, y los selectores de significado aparecen solo para columnas por aclarar o seleccionadas para corrección.

## Estadísticas

La ruta habitual muestra `Results.jsx`. «Todos los temas» es el valor inicial. Cada pregunta analizable presente en respuestas incluidas produce una distribución o resumen numérico. Textos libres, contactos y unidad desconocida no generan gráficos. Los temas agrupan por el significado del catálogo: T08 es interés en posgrado, no situación laboral.

Cambiar tema no realiza una consulta ni cambia la población. El filtro opcional permite seleccionar una información disponible (año, situación laboral, sector o características de organización). Se aplica explícitamente, mantiene visible la selección y permite restablecer todas las respuestas. Los filtros personalizados y cruces continúan en «Explorar más».

`GET /datasets/{dataset}/analytics/overview` entrega todos los resultados en una petición y una transacción con bloqueo compartido del estudio. Mantiene denominadores, estados y una misma versión. La disponibilidad de gráficos no depende de los filtros, por lo que una selección vacía muestra ausencia en vez de esconder preguntas. Cada descarga conserva filtros y versión; los contactos no se exponen.

## Verificación y límites

Pruebas de reconocimiento conservador, significado de temas, filtros exactos y renderizado de ausencia de datos. Prueba backend del resumen con filtros, población vacía, aislamiento entre estudios y versión coherente. Contrato OpenAPI actualizado.

Resultado de la revisión: 19 pruebas frontend, lint y build correctos; suite backend con 35 pruebas y 1.893 aserciones aprobadas. Las preguntas completamente vacías no generan tarjetas iniciales; las preguntas disponibles se conservan cuando un filtro deja cero respuestas.

El reconocimiento usa códigos, nombres, etiquetas y alias exactos normalizados; no adivina encabezados desconocidos. El asistente nuevo prepara una hoja por vez. Los archivos previamente configurados conservan todas sus hojas seleccionadas. No se alteran datos ya incorporados.

Falta la comprobación interactiva con el Excel institucional del usuario y en móvil. La compilación y las pruebas automatizadas no sustituyen esa revisión de uso. No se afirma que el problema previo de rendimiento local esté resuelto.
