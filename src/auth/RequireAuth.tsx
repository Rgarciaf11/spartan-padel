import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

/** Protege una ruta: sin sesión manda a /acceso y, tras entrar, vuelve aquí. */
export default function RequireAuth({ children }: { children: ReactNode }) {
    const { session, cargando } = useAuth()
    const location = useLocation()

    if (cargando) {
        return <div className="text-center py-24 text-gray-400 text-sm">Cargando...</div>
    }
    if (!session) {
        return <Navigate to="/acceso" replace state={{ from: location.pathname + location.search }} />
    }
    return <>{children}</>
}
