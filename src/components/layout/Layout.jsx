import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/auth.js'
import { Brand, Icon, ErrorNotice } from '@/components/ui.jsx'

export default function Layout() {
  const { user, logout } = useAuth()
  const [menu, setMenu] = useState(false)
  const [error, setError] = useState(null)
  const [leaving, setLeaving] = useState(false)
  const navigate = useNavigate()
  async function leave() {
    setLeaving(true)
    try {
      await logout()
      navigate('/ingresar')
    } catch (e) {
      setError(e)
    } finally {
      setLeaving(false)
    }
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <header className="mobile-header">
        <Brand />
        <button
          className="button"
          aria-expanded={menu}
          aria-controls="navigation"
          onClick={() => setMenu(!menu)}
        >
          <Icon name="menu" />
          Menú
        </button>
      </header>
      <aside id="navigation" className={`sidebar ${menu ? 'is-open' : ''}`}>
        <Brand />
        <div className="workspace">
          Universidad Mayor de San Simón
          <small>Encuestas de titulados y empleadores</small>
        </div>
        <nav aria-label="Navegación principal" onClick={() => setMenu(false)}>
          <p className="nav-label">Área de trabajo</p>
          <NavLink to="/estudios">
            <Icon name="studies" />
            Estudios
          </NavLink>
          <NavLink to="/importaciones">
            <Icon name="upload" />
            Importaciones
          </NavLink>
          <NavLink to="/esquemas">
            <Icon name="grid" />
            Variables y esquemas
          </NavLink>
          <NavLink to="/perfiles">
            <Icon name="file" />
            Perfiles de importación
          </NavLink>
          <p className="nav-label">Sistema</p>
          <NavLink to="/ayuda">
            <Icon name="file" />
            Guía y capacidades
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="user-line">
            <span className="avatar">{user.name?.[0] || 'A'}</span>
            <div>
              <strong>{user.name}</strong>
              <small>
                {user.can_view_contacts
                  ? 'Administración con contactos'
                  : 'Administración'}
              </small>
            </div>
          </div>
          <button className="button quiet" onClick={leave} disabled={leaving}>
            <Icon name="logout" />
            {leaving ? 'Cerrando…' : 'Cerrar sesión'}
          </button>
        </div>
      </aside>
      <div className="app-body">
        <div className="topbar">
          <span>Taller de Simulación de Sistemas</span>
          <span>
            Plataforma de encuestas <span className="version-mark">v1</span>
          </span>
        </div>
        <main id="contenido" className="sheet">
          <ErrorNotice error={error} />
          <Outlet />
        </main>
        <footer className="app-footer">
          Datos originales, revisión e incorporación con trazabilidad.
        </footer>
      </div>
    </div>
  )
}
