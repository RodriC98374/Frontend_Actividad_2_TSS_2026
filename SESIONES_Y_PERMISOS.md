# Sesiones, permisos y continuidad

## Sesión web

El frontend solicita GET /sanctum/csrf-cookie y luego POST /api/v1/auth/login con browser_session=true. Laravel regenera la sesión y devuelve el usuario, sin un token Bearer. La cookie de sesión es HttpOnly; XSRF-TOKEN contiene únicamente el valor de protección CSRF. Cada escritura envía X-XSRF-TOKEN. /auth/me recupera el usuario después de recargar. Un fallo de red al cerrar sesión conserva la interfaz autenticada y muestra el error para reintentar.

El modo Bearer anterior sigue disponible sin browser_session para integraciones. Las solicitudes con Bearer no usan middleware de sesión. El formulario por invitación envía su token independiente y credentials=omit.

Desarrollo: Vite redirige /api y /sanctum al backend. Producción: servir ambos bajo el mismo origen, o configurar explícitamente dominios propios compartidos. SANCTUM_STATEFUL_DOMAINS incluye host y puerto del frontend; FRONTEND_URL enumera orígenes CORS exactos. Usar HTTPS y SESSION_SECURE_COOKIE=true en producción. SESSION_LIFETIME controla la caducidad por inactividad. No usar comodines de origen con credenciales. Para subdominios, configurar SESSION_DOMAIN coherentemente; dominios no relacionados no son el despliegue soportado por esta sesión SPA.

## Permisos

- is_admin: acceso al área administrativa.
- can_import_files: carga, vista previa, evaluación, configuración de originales y creación de perfiles. Los archivos originales pueden contener datos personales: concederlo solo a operadores autorizados.
- can_view_contacts: consulta explícita de contactos de respuestas.

La migración añade can_import_files nullable. Un valor null mantiene la regla histórica de can_view_contacts; true/false explícito permite separar permisos. El comando de creación siempre fija ambos valores explícitos; no existe alta pública.

Desde la carpeta del backend:

```sh
php artisan app:create-admin operador@example.org --name="Operador" --imports
php artisan app:create-admin analista@example.org --name="Analista"
```

La contraseña se solicita oculta. Añadir --contacts solamente si la persona debe consultar contactos. No incluir contraseñas en comandos, archivos versionados ni documentación. Las cuentas existentes se actualizan por administración autorizada; este sprint no concede nuevos permisos a la cuenta local.

## Trabajo sin guardar

ActionForm marca cambios, avisa al abandonar y limpia la marca tras guardar. Al fallar un envío conserva la protección. Los cambios no se almacenan en disco ni se guardan automáticamente. El navegador puede presentar su propio texto al recargar/cerrar. Se requieren pruebas interactivas pendientes para confirmar los avisos con la política del navegador habilitada.
