import { Link, useLocation } from 'react-router-dom'
import type { Perfil } from '../types'
import { logo } from '../assets/fotos'

interface Props {
  isAdmin: boolean
  perfil: Perfil | null
  onLogout: () => void
}

export default function Navbar({ isAdmin, perfil, onLogout }: Props) {
  const location = useLocation()

  return (
    <>
      <nav className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-white text-base uppercase tracking-wider">
            <img src={logo} alt="logo" className="w-8 h-8 object-contain" />
            Spartan Padel
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Link
                to="/"
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === '/'
                    ? 'bg-yellow-400 text-black'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                Inicio
              </Link>
              <Link
                to="/reservas"
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === '/reservas'
                    ? 'bg-yellow-400 text-black'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                Reservas
              </Link>
            </div>

            {perfil ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40 hidden sm:block">{perfil.email}</span>
                <button
                  onClick={onLogout}
                  className="px-3 py-1.5 text-xs font-medium border border-white/20 rounded-lg text-white/60 hover:bg-white/10 transition-all"
                >
                  Salir
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-1.5 text-xs font-medium border border-white/20 rounded-lg text-white/60 hover:bg-white/10 transition-all"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      {isAdmin && (
        <div className="bg-yellow-400 text-black px-4 py-2 text-xs flex items-center gap-2 font-medium">
          🛡️ <span><strong>Modo admin activo</strong> — pulsa cualquier franja para bloquearla como clase o liberarla</span>
        </div>
      )}
    </>
  )
}