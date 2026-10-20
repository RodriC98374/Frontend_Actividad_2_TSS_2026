# Verificación del frontend

Realizada el 19 de octubre de 2026, contra el backend local `7490f9a` (contrato OpenAPI 1.2.0). La rama remota `backend-v1` coincidía con esa revisión; el frontend remoto seguía en `4f19709`.

## Resultados

- `npm test`: 13 pruebas aprobadas, incluidas renderización de paginación y controles, multipart, autorización, errores, descargas, filtros, mapeo y limpieza de campos condicionales.
- `npm run lint`: sin advertencias ni errores.
- `npm run build`: compilación de producción aprobada. Sin nuevas dependencias de ejecución.
- `git diff --check`: sin errores de espacios.
- Backend: 28 pruebas aprobadas, 1770 aserciones, sobre PostgreSQL `umss_testing`. No se modificaron fuentes del backend.
- `node tests/integration-smoke.mjs`: recorrido HTTP aprobado con el cliente del frontend contra la API temporal en `127.0.0.1:8001`, usando exclusivamente la cuenta y la base de pruebas. Verifica acceso, estudios, carga/lectura/mapeo, perfiles, revisión agrupada e individual, revalidación, incorporación idempotente, respuestas, corrección e historial, las tres estadísticas, filtros, generación y descarga, captura/revocación y registro de esquemas/publicación/asociación.

## Verificación en navegador

Con datos sintéticos y la instancia temporal del frontend en el puerto 5174:

1. Acceso administrativo y creación de estudio.
2. Carga de `tests/encuesta-ejemplo.csv`, encabezado en fila 1, mapeo posicional de 10 columnas y regla explícita para X07.
3. Validación: dos filas incluidas, cero excluidas, cero advertencias y cero bloqueos.
4. Incorporación y consulta de distribución: dos respuestas válidas, versión de datos 1, denominador y porcentajes de la API.
5. Generación y descarga autenticada de CSV desde la interfaz.
6. Invitación generada desde el estudio; formulario en tres pasos, campos obligatorios y consentimiento; confirmación «Tu respuesta fue recibida».
7. Acceso y estadísticas revisados en escritorio y a 390 px. En la prueba móvil, el ancho del contenido coincidió con el ancho disponible (375 px más la barra de desplazamiento); sin desbordamiento horizontal de la página. Tablas y pestañas tienen desplazamiento propio. Navegación plegada a un menú.

Las capturas locales de QA se guardan en `test-results/` y no se versionan. La captura de estadísticas corresponde al momento anterior al envío del formulario de prueba.

## Diseño

Taste `framed-sheet`, semilla `20261019`, con marco gris azulado, IBM Plex Sans y códigos en IBM Plex Mono. La pregunta central es qué datos están incorporados y qué queda por revisar; el elemento propio es el flujo original → preparación → incorporación.

El escaneo estático de Taste en modo app no encontró fallos. Sus advertencias corresponden a usos previstos por las reglas de app: monoespaciado para identificadores, números para una secuencia real de tres pasos y «—» para valores ausentes. La inspección visual se realizó con el navegador de Codex; no se ejecutó el inspector CDP de Taste.

## Límites

No se probó un despliegue público ni carga concurrente masiva. La ejecución local depende de Docker para Laravel/PostgreSQL y de una cuenta administrativa real para la base de trabajo. Las variables de esquemas nuevos siguen sin conexión a importación/captura/estadísticas porque esa parte está pendiente en el backend; la interfaz lo informa explícitamente. Los perfiles aplicables desde el configurador se muestran en una primera página de hasta 100 y las invitaciones existentes no tienen endpoint de listado.

## Actualización sprint 2

El diseño y las dependencias evolucionaron a ACREDI con Lucide. Las notas iniciales anteriores son evidencia histórica. Se añadieron sesiones Laravel con cookies, CSRF y permiso independiente de importación; los cambios de backend y la migración sí forman parte de este sprint. Frontend: 16 pruebas aprobadas, build/lint correctos. Pruebas específicas backend: sesión/logout, CSRF y separación de permisos aprobadas. Prueba HTTP local real por el proxy: CSRF 204, login 200, recuperación 200, logout 204 y petición posterior 401. La prueba interactiva de avisos de cambios pendientes está pendiente porque la herramienta del navegador rechazó el acceso a localhost.

Cierre de pruebas del sprint 2: 32 pruebas backend aprobadas (1816 aserciones) y 16 frontend; build/lint correctos. Verificación interactiva del navegador pendiente por bloqueo de la herramienta.

## Prioridad: importación habilitada

La cuenta local admin@example.test tiene can_import_files=true y can_view_contacts=false, por autorización del usuario. Se comprobó de nuevo el flujo HTTP en umss_testing: carga CSV, vista previa, evaluación, mapeo, perfiles, validación, incidencias, decisiones, revalidación, incorporación idempotente, consulta de respuestas, estadísticas y descargas. Ningún registro sintético se incorporó a la base umss. Guía operativa: IMPORTACION.md. La inspección interactiva del navegador continúa pendiente por la política de acceso de la herramienta.
