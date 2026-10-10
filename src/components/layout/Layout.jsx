import { Link, Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <header className="border-b border-slate-200">
        <nav className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-4">
          <Link to="/" className="font-semibold">
            Actividad 2
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200">
        <div className="mx-auto max-w-5xl px-6 py-4 text-sm text-slate-500">
          Taller de Simulación de Sistemas
        </div>
      </footer>
    </div>
  )
}
