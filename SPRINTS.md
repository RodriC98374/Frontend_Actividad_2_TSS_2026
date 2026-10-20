# Plan de entrega de ACREDI

Cada sprint termina con pruebas y una demostración del flujo. El orden expresa dependencias, no fechas comprometidas.

| Sprint | Objetivo | Criterios de aceptación | Estado |
|---|---|---|---|
| 1 | Fiabilidad del flujo actual | Cargas con tiempo límite y salida clara; acciones coherentes con permisos; sin formulario/estado vacío duplicados; archivos filtrados por estudio antes de paginar; pruebas de regresión | Completado |
| 2 | Continuidad y acceso | Sesión persistente acordada con backend, cierre y caducidad probados; protección de cambios sin guardar; permisos de importación separados de contactos; procedimiento de cuentas | Implementado; validación visual pendiente |
| 3 | Trabajo guiado y dashboard | Pendientes reales por estudio, bloqueos destacados, siguiente acción; progreso importar → mapear → validar → revisar → incorporar; confirmación clara de agregar/reemplazar | Pendiente |
| 4 | Formularios e invitaciones | Errores por campo; listado, estado y revocación de invitaciones; recuperación segura de captura interrumpida; estados vacío/error/carga revisados | Pendiente |
| 5 | Esquemas utilizables | Variables publicadas conectadas a importación, captura y estadísticas; versiones y compatibilidad comprobadas con backend | Pendiente |
| 6 | Validación y preparación de entrega | Recorrido con archivo representativo, errores y permisos; escritorio/móvil/teclado; rendimiento con volumen; consolidación de CSS y documentación; despliegue y respaldo verificados | Pendiente |

## Sprint 1: alcance

No concede permisos nuevos ni cambia credenciales. Expone correctamente las capacidades existentes. La separación de permisos requiere cambios de autorización y pertenece al sprint 2.

- [x] Limitar espera de consultas y operaciones; no reintentar escrituras automáticamente.
- [x] Conservar cancelación al salir de una pantalla.
- [x] Filtrar importaciones por dataset en la API y utilizar el filtro en resumen/listado.
- [x] Evitar mostrar acciones de carga a cuentas sin permiso y explicar cómo obtener acceso.
- [x] Ocultar el estado vacío redundante al crear el primer estudio.
- [x] Verificar contrato, pruebas y compilación.

## Demostración final del proyecto

Crear estudio → cargar archivo → mapear → revisar incidencias → revalidar → incorporar → consultar estadísticas → exportar. Verificar por separado invitación → respuesta → aparición en el estudio. Los datos de prueba se mantienen en `umss_testing`.

## Resultado del sprint 1

Consultas con límite de 30 s y escrituras de 120 s (configurables por petición), sin repetición automática. El timeout de una escritura informa que debe comprobarse su resultado. Se conserva cancelación externa. El resumen oculta las acciones de carga sin permiso y el alta ya no duplica el estado vacío. API y cliente filtran por estudio antes de paginar.

Validación: 15 pruebas frontend, build y lint correctos; prueba backend de filtrado aprobada (24 aserciones) en umss_testing. Contrato OpenAPI actualizado. El sprint no modifica permisos de cuentas ni persiste sesiones.

## Sprint 2: implementación

- Sesión Laravel/Sanctum con cookie HttpOnly y CSRF. Bootstrap con /auth/me, estado de carga y error recuperable; cierre confirmado por el servidor.
- Bearer conservado para integraciones y captura; las invitaciones no envían cookies ni CSRF administrativos.
- Permiso can_import_files separado de can_view_contacts. Migración aditiva aplicada. Valor null conserva la capacidad histórica, valores explícitos permiten separar funciones. Ninguna cuenta recibió acceso adicional.
- Protección de cambios en ActionForm: navegación interna, recarga/cierre, cierre del alta, cambio de hoja/pestaña de importación y cierre de sesión. La captura mantiene aviso entre pasos. No hay guardado automático ni persistencia de borradores.
- Procedimiento de cuentas y despliegue en SESIONES_Y_PERMISOS.md.

Verificado: pruebas específicas backend (sesión/logout, CSRF, permisos); recorrido HTTP real con cookie: 204 CSRF, 200 login, 200 recuperación, 204 logout, 401 posterior. La revisión interactiva del navegador quedó bloqueada por la política de acceso de la herramienta; falta comprobar visualmente los avisos y botones en una sesión del navegador.

Cierre de pruebas del sprint 2: 32 pruebas backend aprobadas (1816 aserciones) y 16 frontend; build/lint correctos. Verificación interactiva del navegador pendiente por bloqueo de la herramienta.
