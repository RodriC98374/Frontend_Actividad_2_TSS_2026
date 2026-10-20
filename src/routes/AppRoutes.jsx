import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'

import { Loading, ErrorNotice } from '@/components/ui.jsx'
import Layout from '@/components/layout/Layout.jsx'
import NotFound from '@/pages/NotFound.jsx'
import Login from '@/pages/Login.jsx'
import { useAuth } from '@/context/auth.js'
import Studies, {
  StudyLayout,
  StudyOverview,
  Invitations,
  Help,
} from '@/pages/Studies.jsx'
import Imports, { Upload, ImportDetail } from '@/pages/Imports.jsx'
import Analytics from '@/pages/Analytics.jsx'
import Responses, { ResponseDetail } from '@/pages/Responses.jsx'
import Schemas, {
  SchemaDetail,
  VersionDetail,
  StudyBindings,
  Profiles,
} from '@/pages/Schemas.jsx'
import Capture from '@/pages/Capture.jsx'

function Protected() {
  const { user, loading, sessionError } = useAuth()
  const location = useLocation()
  if (loading) return <Loading />
  if (sessionError) return <ErrorNotice error={sessionError} retry={() => window.location.reload()} />
  return user ? (
    <Outlet />
  ) : (
    <Navigate
      to="/ingresar"
      state={{ from: location.pathname + location.search }}
      replace
    />
  )
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="ingresar" element={<Login />} />
      <Route path="formulario" element={<Capture />} />
      <Route element={<Protected />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/estudios" replace />} />
          <Route path="estudios" element={<Studies />} />
          <Route path="estudios/:datasetId" element={<StudyLayout />}>
            <Route index element={<StudyOverview />} />
            <Route path="importar" element={<Upload />} />
            <Route path="respuestas" element={<Responses />} />
            <Route path="estadisticas" element={<Analytics />} />
            <Route path="invitaciones" element={<Invitations />} />
            <Route path="esquemas" element={<StudyBindings />} />
          </Route>
          <Route path="importaciones" element={<Imports />} />
          <Route path="importaciones/:importId" element={<ImportDetail />} />
          <Route path="respuestas/:responseId" element={<ResponseDetail />} />
          <Route path="esquemas" element={<Schemas />} />
          <Route path="esquemas/:schemaId" element={<SchemaDetail />} />
          <Route path="versiones/:versionId" element={<VersionDetail />} />
          <Route path="perfiles" element={<Profiles />} />
          <Route path="ayuda" element={<Help />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  )
}
