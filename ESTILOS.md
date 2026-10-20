# Sistema visual compartido

La fuente de verdad es `src/styles/tokens.css`, importada una vez por `src/index.css`. Todos los módulos, incluido el acceso y la encuesta pública, heredan sus valores. Las clases compartidas están en `src/index.css` y los componentes en `src/components/ui.jsx`.

## Colores

Usar roles, nunca nuevos hexadecimales en componentes: `--accent` (azul petróleo #17677B), `--accent-hover`, `--on-accent`, `--ground`, `--surface`, `--raised`, `--active`, `--text`, `--muted`, `--border` y `--control`. El borde de controles es más oscuro que los separadores para identificar los campos.

Estados: `--positive`, `--warning` y `--negative`, con sus variantes `-soft`. Mostrar siempre una etiqueta textual; el color por sí solo no comunica el estado. Una serie estadística utiliza `--accent`.

## Tipografía y controles

IBM Plex Sans en pesos 400, 500 y 600; IBM Plex Mono para identificadores. Las fuentes se cargan desde Google Fonts en `index.html`, con alternativas del sistema. Texto y campos: 16 px; tablas y navegación: 14 px; ayudas: 13 px; título: 28 px (24 en móvil). Usar `--font-sans`, `--font-mono` y `--text-*`.

Controles de 44 px como mínimo. Botones: `.button`, `.primary`, `.quiet`, `.danger`, `.small`; formularios: `.field`, `.form-grid`, `.form-actions`. Conservar el foco visible y las etiquetas de los campos.

## Sombras y espaciado

Sombras suaves solicitadas por el usuario, como excepción deliberada a la preferencia plana de Taste:

- `--shadow-panel`: paneles y estados vacíos, 2 px / 8 px / 5 %.
- `--shadow-sheet`: hoja de trabajo, 4 px / 20 px / 6 %; se elimina en móvil.
- `--shadow-menu`: navegación desplegada, 8 px / 24 px / 10 %.

No acumular sombras en elementos anidados. Usar `.panel` para una sección elevada. Radios: `--radius-control` (6 px), `--radius` (8 px), `--radius-sheet` (16 px). Espaciado compartido: `--space-1/2/3/4/6/8` (4, 8, 12, 16, 24, 32 px), `--gap` (24 px). Transiciones de color: `--motion-fast`; respetar movimiento reducido.

## Iconos

Una sola colección: `lucide-react`. Usar `<Icon name="upload" />`, importado desde `@/components/ui.jsx`; tamaño habitual 20 px y trazo 2 px. El mapa central incluye studies, upload, chart, grid, arrow, plus, logout, menu, check, file, help, responses, invitation, download y settings. Los iconos decorativos están ocultos a lectores de pantalla. Un botón sin texto necesita `aria-label`. El símbolo de marca propio se conserva.

## Responsive

- Menos de 768 px: márgenes de 16 px, formularios de una columna, acciones principales al ancho disponible, filtros apilados y navegación plegable.
- De 768 a 1199 px: márgenes de 24 px, navegación plegable, rejillas según contenido.
- Desde 1200 px: navegación lateral de 240 px y hoja con 32 px de margen interior.

Los puntos de corte se declaran en las media queries de `src/index.css` (CSS nativo no permite `var()` en esas condiciones). Las tablas extensas usan `.table-scroll`; el desplazamiento horizontal debe quedar dentro de ese contenedor. No ocultar datos para hacerlos caber. Comprobar 390, 768 y 1440 px, foco y menús antes de incorporar nuevas pantallas.

## Ejemplo de reutilización

```jsx
<section className="panel padded">
  <h2>Importar respuestas</h2>
  <button className="button primary">
    <Icon name="upload" /> Importar archivo
  </button>
</section>
```

```css
.nuevo-componente {
  color: var(--text);
  background: var(--surface);
  padding: var(--space-6);
  border-radius: var(--radius);
  box-shadow: var(--shadow-panel);
}
```

## Contraste oscuro y marca

La navegación, cabecera móvil y panel introductorio del acceso usan `--ink-deep` (#102C36). Hover y selección usan `--ink-raised` y `--ink-selected`. Texto claro: `--on-dark`; secundario: `--muted-on-dark`; acento menta: `--brand-light`. Los tokens se reasignan dentro de esas regiones; las tablas y formularios mantienen superficies claras.

Logo vectorial reutilizable: `public/brand/encuestas-umss.svg`. Combina una U abierta (universidad) y una marca de verificación (respuesta revisada). Es la marca de la aplicación, no el escudo institucional. Mantener proporciones y un margen libre mínimo de 8 px. El componente Brand lo comparte entre acceso, navegación y formulario público; el mismo SVG sirve como favicon.

## Identidad vigente: acredi

Esta sección sustituye las decisiones de marca y paleta anteriores. Nombre visible: **acredi**, en minúsculas. El logo original aportado por el usuario se conserva sin modificaciones en `public/brand/acredi.png`, con transparencia y respaldo blanco en la interfaz para mantener legibles sus trazos azules. Es también el favicon.

Paleta: marino estructural `--ink-deep` #082442; marino de marca `--brand-navy` #002957; turquesa de acción `--accent` #00798A; turquesa sobre oscuro `--brand-light` #63D1DC; rojo de marca `--brand-red` #CF0030. El rojo se usa solo en un borde de identidad; los estados de error conservan su token semántico independiente. Fondo #EDF2F8, paneles blancos, texto #152C45. Se mantienen IBM Plex, Lucide, sombras y puntos de corte existentes.

Wordmark actualizado: **ACREDI** en mayúsculas, IBM Plex Sans 600, 24 px (22 px en móvil), espaciado 0.045 em. ACRE usa el color de texto de la superficie y DI su acento turquesa, con contraste claro sobre navegación oscura. El nombre textual del producto sigue siendo acredi.

## Formularios y dashboard

Superficie de trabajo gris azulada con paneles blancos. Los encabezados usan marino; los formularios agrupan campos y separan las acciones con un borde. `.form-intro` explica el propósito antes de completar campos. El primer indicador de `.stat-strip` usa fondo marino, conservando los valores reales. Tabs con selección blanca, tablas con hover suave, estados textuales, pasos de captura y filtros comparten los tokens. En móvil se apilan formularios y se mantienen dos columnas de indicadores sin desbordamiento.
