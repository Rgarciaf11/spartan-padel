import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Perfil } from '../types'

export type AuthState = {
    session: Session | null
    perfil: Perfil | null
    /** true hasta saber si hay sesión al cargar la app */
    cargando: boolean
    isAdmin: boolean
    recargarPerfil: () => Promise<void>
    cerrarSesion: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
    return ctx
}

/** Nombre a mostrar: "Nombre Apellidos" o, si no hay, el email. */
export function nombreVisible(perfil: Perfil | null, emailFallback = ''): string {
    const nombre = [perfil?.nombre, perfil?.apellidos].filter(Boolean).join(' ').trim()
    return nombre || perfil?.email || emailFallback
}
