import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/auth.js'
import { ActionForm, Brand, Field, Icon } from '@/components/ui.jsx'

export default function Login() {
  const { user, expired, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const target = location.state?.from || '/estudios'
  if (user) return <Navigate to={target} replace />
  return (
    <main className="login-shell">
      <section className="login-story">
        <Brand />
        <div>
          <span className="login-rule" />
          <h1>
            De las respuestas <br />a la evidencia.
          </h1>
          <p>
            Un espacio para organizar encuestas, revisar su calidad y comprender
            la trayectoria de nuestros titulados.
          </p>
          <div className="login-process">
            <span>Importar</span>
            <Icon name="arrow" />
            <span>Revisar</span>
            <Icon name="arrow" />
            <span>Analizar</span>
          </div>
        </div>
        <small>
          Universidad Mayor de San Simón
          <br />
          Taller de Simulación de Sistemas
        </small>
      </section>
      <section className="login-panel">
        <div className="login-form">
          <p className="muted">Acceso administrativo</p>
          <h2>Iniciar sesión</h2>
          <p>Ingresa con la cuenta habilitada para administrar los estudios.</p>
          {expired && (
            <div className="notice" role="status">
              Tu sesión venció. Inicia sesión nuevamente.
            </div>
          )}
          <ActionForm
            submit="Entrar al área de trabajo"
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
            <Field
              label="Contraseña"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
            <p className="field-note">
              Si necesitas una cuenta o recuperar el acceso, comunícate con
              quien administra el sistema.
            </p>
          </ActionForm>
          <p className="session-note">
            La sesión se mantiene durante esta visita. Al recargar la página
            debes volver a ingresar.
          </p>
        </div>
      </section>
    </main>
  )
}
