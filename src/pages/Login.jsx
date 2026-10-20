import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/auth.js'
import { ActionForm, Brand, Field, Icon, Loading } from '@/components/ui.jsx'

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const { user, expired, loading, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const target = location.state?.from || '/estudios'
  if (loading) return <Loading />
  if (user) return <Navigate to={target} replace />
  return (
    <main className="login-shell">
      <section className="login-story">
        <Brand />
        <div>
          <p className="login-eyebrow">Seguimiento que construye confianza</p>
          <h1>
            De las respuestas <br />a la evidencia.
          </h1>
          <p>
            Un espacio para organizar encuestas, revisar su calidad y comprender
            la trayectoria de nuestros titulados.
          </p>
          <ol className="login-journey" aria-label="Flujo de trabajo">
            <li><span>01</span><div><strong>Reúne las respuestas</strong><small>Archivos y formularios en un mismo estudio.</small></div></li>
            <li><span>02</span><div><strong>Revisa con criterio</strong><small>Identifica incidencias antes de incorporar datos.</small></div></li>
            <li><span>03</span><div><strong>Convierte datos en evidencia</strong><small>Consulta resultados con trazabilidad.</small></div></li>
          </ol>
        </div>
        <small>
          Universidad Mayor de San Simón
          <br />
          Taller de Simulación de Sistemas
        </small>
      </section>
      <section className="login-panel">
        <div className="login-form">
          <div className="login-access"><Icon name="studies" /><span>Área de trabajo</span></div>
          <h2>Bienvenido a ACREDI</h2>
          <p>Inicia sesión para continuar con tus estudios y respuestas.</p>
          {expired && (
            <div className="notice" role="status">
              Tu sesión venció. Inicia sesión nuevamente.
            </div>
          )}
          <ActionForm
            protectChanges={false}
            submit="Iniciar sesión"
            onSubmit={async (form) => {
              await login(form.get('email').trim(), form.get('password'))
              navigate(target, { replace: true })
            }}
          >
            <Field
              label="Correo electrónico"
              name="email"
              type="email"
              autoComplete="username"
              required
              placeholder="nombre@umss.edu.bo"
            />
            <Field label="Contraseña">
              {(id) => <div className="password-control">
                <input id={id} name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required placeholder="Tu contraseña" />
                <button type="button" aria-controls={id} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Ocultar' : 'Mostrar'}</button>
              </div>}
            </Field>
            <p className="field-note">
              Si necesitas una cuenta o recuperar el acceso, comunícate con
              quien administra el sistema.
            </p>
          </ActionForm>
          <p className="session-note">
            Tu sesión se conserva al recargar. Cierra sesión al terminar si usas un equipo compartido.
          </p>
        </div>
      </section>
    </main>
  )
}
