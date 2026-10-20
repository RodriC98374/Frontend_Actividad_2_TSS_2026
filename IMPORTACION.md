# Importar y utilizar respuestas en ACREDI

La cuenta utilizada necesita el permiso de importación y originales (`can_import_files`). El acceso a contactos de respuestas se controla por separado (`can_view_contacts`).

1. Recargar ACREDI para actualizar los permisos de la sesión. Si solicita acceso, iniciar sesión con la cuenta habilitada.
2. Crear o abrir un estudio. Elegir **Importar archivo**.
3. Cargar un XLSX o CSV. Para CSV, confirmar delimitador y codificación. Mantener una fila por registro.
4. En cada hoja, confirmar encuesta, encabezado y región de datos. Asociar cada columna a su pregunta; revisar las sugerencias antes de aceptarlas.
5. Definir las multiselecciones como valores delimitados o columnas de opciones, según el archivo.
6. Guardar configuración y validar. Resolver los bloqueos, revisar advertencias y justificar exclusiones. Revalidar después de cambios.
7. Incorporar. Usar **Agregar** para sumar respuestas. **Reemplazar** sustituye el alcance indicado: revisar cuidadosamente la confirmación.
8. Abrir **Respuestas** para comprobar los datos y **Estadísticas** para analizarlos y exportar CSV/XLSX.

## Archivo sintético de ejemplo

`tests/encuesta-ejemplo.csv` contiene dos registros ficticios para practicar en un estudio de prueba. X07 usa valores delimitados; hay que confirmar su regla. No es información institucional.

## Límites actuales

Usar las preguntas de los catálogos existentes de titulados y empleadores. Las variables nuevas del registro de esquemas todavía no alimentan esta importación. La aplicación no incorpora archivos solo por cargarlos: es obligatorio configurar, validar e incorporar.

Si una operación excede el tiempo límite, consultar su estado antes de repetirla. El backend local puede responder lentamente durante la primera ejecución.
