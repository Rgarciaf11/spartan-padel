import { Link, useLocation, useNavigate } from 'react-router-dom'
import { logo } from '../assets/fotos'
import { useAuth } from '../auth/useAuth'

const linkClass = (activo: boolean) =>
  `px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activo ? 'bg-yellow-400 text-black' : 'text-white/60 hover:text-white hover:bg-white/10'
  }`

export default function Navbar() {
  const { session, perfil, isAdmin, cargando, cerrarSesion } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  async function salir() {
    await cerrarSesion()
    navigate('/')
  }

  return (
    <>
      <nav className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 font-bold text-white text-base uppercase tracking-wider shrink-0">
            <img src={logo} alt="" className="w-8 h-8 object-contain" />
            <span className="hidden sm:inline">Spartan Padel</span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link to="/" className={linkClass(location.pathname === '/')}>Inicio</Link>
            <Link to="/reservas" className={linkClass(location.pathname === '/reservas')}>Reservas</Link>

            {!cargando && (session ? (
              <>
                {!isAdmin && (
                  <Link to="/mi-cuenta" className={linkClass(location.pathname === '/mi-cuenta')}>
                    Mi cuenta
                  </Link>
                )}
                <span className="text-xs text-white/40 hidden md:block ml-1">
                  {isAdmin ? 'Admin' : perfil?.nombre || session.user.email}
                </span>
                <button
                  onClick={salir}
                  className="px-3 py-1.5 text-xs font-medium border border-white/20 rounded-lg text-white/60 hover:bg-white/10 transition-all"
                >
                  Salir
                </button>
              </>
            ) : (
              <Link
                to="/acceso"
                state={{ from: location.pathname + location.search }}
                className="px-3 py-1.5 text-xs font-medium border border-white/20 rounded-lg text-white/60 hover:bg-white/10 transition-all whitespace-nowrap"
              >
                Área clientes
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {isAdmin && location.pathname === '/reservas' && (
        <div className="bg-yellow-400 text-black px-4 py-2 text-xs flex items-center gap-2 font-medium">
          🛡️ <span><strong>Modo admin</strong> — pulsa una franja libre para bloquearla como clase, una clase para liberarla o una reserva para ver los datos del cliente</span>
        </div>
      )}
    </>
  )
}
