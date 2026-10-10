# actividad_2_frontend

Base de proyecto frontend con Vite + React 19, React Router y Tailwind CSS v4.

## Requisitos

- Node.js 20.19+ (probado con 24.x)
- npm 10+

## Comandos

```bash
npm install      # instalar dependencias
npm run dev      # servidor de desarrollo en http://localhost:5173
npm run build    # build de producción en dist/
npm run preview  # servir el build de producción
npm run lint     # oxlint
```

## Estructura

```
public/                 Archivos estáticos servidos tal cual
src/
  assets/               Imágenes, fuentes y recursos importados por el bundler
  components/
    layout/Layout.jsx   Layout raíz (header / main / footer) con <Outlet />
  hooks/                Custom hooks
  pages/
    Home.jsx            Ruta "/"
    NotFound.jsx        Ruta "*"
  routes/
    AppRoutes.jsx       Definición de rutas
  services/
    api.js              Cliente HTTP sobre fetch (usa VITE_API_URL)
  utils/                Funciones auxiliares
  App.jsx               Componente raíz
  index.css             Entrada de Tailwind
  main.jsx              Punto de entrada (createRoot + BrowserRouter)
index.html
jsconfig.json           Alias "@/*" -> "src/*" para el editor
vite.config.js          Plugins (react, tailwind) y alias "@"
```

## Variables de entorno

Copiar `.env.example` a `.env.local` y ajustar. Solo las variables con prefijo
`VITE_` quedan expuestas al cliente.

## Alias de importación

`@` apunta a `src/`:

```js
import Home from '@/pages/Home.jsx'
```
