> Registro histórico de la revisión inicial. Configuración actual: web 5174, API habitual 8001 y API desechable de pruebas 8002. Los resultados de pruebas actualizados se documentan en el PR.

# Verificación funcional — 21 de octubre de 2026

## Versiones revisadas

- Frontend: `RodriC98374/Frontend_Actividad_2_TSS_2026`, rama `codex/frontend-integracion`, base `5c386bae00401c08903cadffcfb7bea11e029d35` más cambios locales de esta revisión.
- Backend: `RodriC98374/Backend_Actividad_2_TSS_2026`, rama `backend-v1`, base `7490f9ad3fd89f5279d041c3e68dbc0f106aad5c` más cambios locales de sesiones, permisos y la corrección del teléfono.
- Estos commits por sí solos no reproducen el estado local: los cambios pendientes deben incorporarse antes de entregar o desplegar.

## Corrección realizada

La expresión de teléfono de `app/Domain/Surveys/Normalizer.php` contenía un salto de línea obligatorio y rechazaba números normales. Se corrigió y se añadieron dos pruebas de regresión: números locales/internacionales válidos y rechazo de letras, saltos internos y números demasiado cortos. No se reprocesaron registros existentes: una carga anterior afectada necesita revalidación.

## Comprobaciones

- Frontend: 16 pruebas aprobadas; lint y compilación correctos.
- Backend: 34 pruebas aprobadas, 1.828 aserciones, exclusivamente en PostgreSQL `umss_testing`.
- Recorrido HTTP con cookies/CSRF: aprobado, proceso finalizado con código 0. Incluye seis descargas (CSV y XLSX para distribución, resumen numérico y cruce), rechazo de versión antigua y respuesta 401 después del cierre de sesión.

La prueba `node tests/integration-smoke.mjs --session` comprueba sesión sin token administrativo, rechazo de escritura sin CSRF, carga CSV, mapeo, validación, exclusión motivada, bloqueo de incorporación sin revalidar, revalidación, incorporación idempotente, corrección e historial, distribución 50/50, filtros, tres tipos de análisis, rechazo de exportación con versión antigua, archivos CSV/XLSX, invitación, captura, revocación, esquemas y cierre de sesión.

## Límites y siguiente paso

- Datos sintéticos; no equivale a validar encuestas institucionales ni resultados académicos reales.
- El adaptador HTTP de Node no comprueba renderizado, navegación, accesibilidad, móvil ni las políticas de cookies del navegador. Queda pendiente el recorrido interactivo y los avisos de cambios sin guardar.
- Docker estaba apagado al comenzar; se iniciaron los servicios existentes. La API aislada usa el puerto 8001 y `umss_testing`. La instancia habitual usa el puerto 8000.
- Al terminar se detuvo la API temporal del puerto 8001. Backend/PostgreSQL habituales y frontend en `http://127.0.0.1:5173/` quedaron iniciados.
- Se observaron varios segundos por petición en Docker sobre el sistema de archivos de Windows. No se realizó una prueba de carga ni se atribuye esa latencia a producción.
- Prioridad siguiente: revisión interactiva del recorrido y consolidación de ambos repositorios para una instalación reproducible. Después, guiar al operador con el siguiente paso y los bloqueos de cada carga.
