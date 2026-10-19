# Encuestas UMSS — Frontend

Interfaz React 19 + Vite + React Router para el contrato OpenAPI 1.2.0 del backend Laravel. Mantiene el stack original y no agrega dependencias de ejecución.

## Ejecutar con el backend existente

Desde la carpeta del frontend:

```powershell
npm ci
npm run dev
```

Abrir la URL que imprime Vite (puerto 5173). El cliente usa `/api/v1` y Vite redirige `/api` al backend local `http://127.0.0.1:8000`. Iniciar antes el backend y PostgreSQL siguiendo el README del repositorio de backend.

No hay credenciales administrativas predeterminadas para la aplicación. Usar la cuenta creada mediante `php artisan app:create-admin` del backend. El token administrativo se mantiene solo en memoria: al recargar o abrir otra pestaña hay que iniciar sesión nuevamente.

Opcionalmente copiar `.env.example` a `.env.local`. Para una API remota configurar `VITE_API_URL=https://servidor/api/v1` y autorizar el origen del frontend mediante `FRONTEND_URL` en el backend. Las variables `VITE_*` son públicas: nunca colocar contraseñas o secretos. Una URL que solo contiene el origen, por ejemplo `http://localhost:8000`, se normaliza agregando `/api/v1`.

Para apuntar el proxy de desarrollo a otro backend:

```powershell
$env:BACKEND_PROXY_URL = 'http://127.0.0.1:8001'
npm run dev
```

## Flujos implementados

- Acceso administrativo, cierre de sesión y tratamiento de sesión vencida; consulta de permisos.
- Listado paginado, creación y resumen de estudios; conteos por encuesta, inclusión y origen.
- Carga XLSX/CSV con límite de tamaño y formato, delimitador y codificación explícitos.
- Configuración por hoja: vista previa paginada, candidatos de encabezado, región y correspondencia de columnas por posición. Coincidencias exactas como propuesta que el usuario confirma.
- Multiselección por celda delimitada o por columnas de opciones. Para columnas se usan las marcas indicadas en pantalla; otras marcas quedan como incidencia y necesitan adaptación del archivo.
- Consulta y guardado de perfiles inmutables. Aplicación manual de un perfil compatible de la primera página (hasta 100) con revisión explícita de la región.
- Validación, incidencias agrupadas/individuales y filas preparadas paginadas; inclusión/exclusión individual y exclusión de una selección con motivo y confirmación del conteo.
- Incorporación append/replace con revisión y validación vigentes, confirmación y clave UUID de idempotencia conservada durante reintentos en la misma vista.
- Respuestas incluidas/excluidas con filtros tipados; detalle, corrección por pregunta, historial y consulta explícita de contactos según permiso.
- Distribuciones, resúmenes numéricos y cruces habilitados por el catálogo; filtros AND; denominadores, estados de ausencia y versión. Descarga autenticada CSV/XLSX y detección de cambios de versión.
- Invitaciones de un uso: generación y revocación del acceso recién generado. El backend no ofrece listado de invitaciones; guardar cada enlace antes de salir. Token en fragmento, retirado de la dirección al abrir el formulario y enviado solo por Bearer.
- Formulario por invitación en tres pasos, tipos y opciones del catálogo, condiciones, campos obligatorios, consentimiento y confirmación de recepción.
- Esquemas: creación, versiones, borradores vacíos o copiados, búsqueda y paginación de variables, edición por variable, opciones, eliminación de borrador, publicación inmutable y asociación de versiones publicadas a estudios.

## Límites del backend que conserva la interfaz

Los esquemas configurables se registran y publican, pero **las nuevas variables todavía no se conectan con importación, captura ni estadísticas**. Esos flujos usan los catálogos de titulados y empleadores. La interfaz lo informa y no simula esa integración. También siguen fuera del backend la gestión visual de cuentas, la recuperación de contraseñas, la edición de contactos, la conciliación de personas repetidas y la exportación de microdatos.

La vista de resumen muestra archivos del estudio entre las cinco cargas más recientes del sistema; el listado completo está en Importaciones. Todas las cifras operativas proceden de la API. Los ejemplos en `tests/` son sintéticos.

## Validación

```powershell
npm test
npm run lint
npm run build
```

`npm test` cubre transporte multipart/JSON, autenticación independiente de captura, caducidad de sesión, errores, descargas, filtros, idempotencia, mapeo posicional y limpieza de campos condicionales. No requiere el backend.

### Integración con datos sintéticos en una base aislada

Primero ejecutar las pruebas del backend desde su carpeta:

```powershell
docker compose exec -T app php artisan test
```

Las pruebas del backend usan exclusivamente `umss_testing`. No ejecutarlas contra una base de trabajo. Después, todavía desde el backend:

```powershell
Get-Content -Raw '..\Frontend_Actividad_2_TSS_2026\tests\backend-fixture.php' | docker compose exec -T -e APP_ENV=testing -e DB_DATABASE=umss_testing app php
docker compose run --rm --no-deps --name umss-frontend-smoke-api -p 127.0.0.1:8001:8000 -e APP_ENV=testing -e DB_DATABASE=umss_testing app php artisan serve --host=0.0.0.0 --port=8000 --no-reload
```

`--no-reload` conserva las variables de entorno del contenedor en el proceso PHP del servidor. El fixture rechaza cualquier entorno distinto de `testing` o base distinta de `umss_testing`.

Desde el frontend, en otra terminal:

```powershell
node tests/integration-smoke.mjs
$env:BACKEND_PROXY_URL = 'http://127.0.0.1:8001'
npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

Cuenta **solo de prueba aislada**: `frontend-ui@example.test`, contraseña desechable `FrontendIntegration2026!`. No se crea en la aplicación de trabajo. `integration-smoke.mjs` usa exclusivamente el puerto 8001; crea estudios, cargas y demás registros sintéticos en esa base.

Detener la instancia temporal del frontend con Ctrl+C y el contenedor con `docker stop umss-frontend-smoke-api`. No borrar el volumen de PostgreSQL. Para volver al backend habitual, quitar `BACKEND_PROXY_URL` de esa terminal o abrir otra terminal.

## Producción

`npm run build` genera `dist/`. Configurar el servidor para devolver `index.html` en rutas del frontend (incluida `/formulario`), y servir o redirigir `/api` al backend. Si se usa otra URL de API, definir `VITE_API_URL` antes de compilar. `vite preview` sirve el build y necesita una API absoluta en el build o su propio proxy; no es un servidor de producción.

La tipografía IBM Plex se carga desde Google Fonts; si el entorno no tiene red usa la fuente del sistema. No se incluyen analítica ni servicios de IA. Dirección visual y decisiones en `DISENO.md`.
