# Panel de resultados por temas

El administrador elige la encuesta y el tema. Opcionalmente limita la población con un filtro. No configura ejes, colores, fórmulas ni denominadores.

- Tarjetas: participantes seleccionados y, cuando existen datos válidos, contratación anterior, alta probabilidad de contratación o estudios de posgrado. Cada porcentaje indica numerador y base; ausencia de datos no equivale a cero.
- Preguntas individuales: barras, columnas y torta de anillo. La torta solo se ofrece para selección única con hasta cinco opciones. Se conserva la tabla accesible y la descarga individual CSV/Excel.
- Temas: las preguntas de escala con las mismas opciones y etiquetas se muestran juntas en barras apiladas al 100 %. Cada pregunta conserva su denominador; no se suman participantes ni se calcula un índice combinado.
- Relaciones: seleccionar dos preguntas categóricas compatibles y pulsar «Mostrar comparación». El mapa de calor representa cantidades de participantes con ambas respuestas válidas. Se reutiliza el cruce del backend con los filtros del panel. Si cambia la versión de datos, se pide actualizar antes de mostrar el cruce.
- Hasta seis comparaciones pueden guardarse en este navegador por estudio y encuesta. Solo se guardan identificadores de preguntas; los resultados se consultan nuevamente con los filtros vigentes. No hay sincronización entre usuarios o equipos.

Los contactos y textos abiertos no generan gráficos. La dispersión numérica y los indicadores que combinan varias preguntas requieren una definición adicional; no se inventan puntuaciones a partir de respuestas categóricas.

Validación: compilación Vite, lint, pruebas de selección de gráficos, agrupaciones compatibles, denominadores y renderizado de estados vacíos. La revisión visual en navegador queda pendiente.

## Resumen visual

La pestaña Resumen selecciona hasta cuatro gráficos a partir de preguntas con respuestas válidas. Prioriza tamaño × intención de contratación, valoraciones de formación, tipo de organización y contratación anterior × intención futura. Solo solicita cruces compatibles con el API; las preguntas ausentes no se inventan. Los cruces usan pares del mismo participante y conservan los filtros activos. Las columnas agrupadas muestran cantidades; las apiladas de contratación usan porcentajes dentro de cada grupo, con su base visible.

Las pestañas temáticas conservan la exploración completa. Las escalas en el resumen muestran cinco preguntas y permiten desplegar las restantes. Títulos cortos y detalles plegados reducen el texto sin eliminar el cuestionario original.
