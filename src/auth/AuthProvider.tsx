import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Perfil } from '../types'
import { AuthContext, type AuthState } from './useAuth'

export default function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null)
    const [perfil, setPerfil] = useState<Perfil | null>(null)
    const [cargando, setCargando] = useState(true)

    const cargarPerfil = useCallback(async (userId: string) => {
        const { data } = await supabase
            .from('perfiles')
            .select('id, email, nombre, apellidos, telefono, es_admin')
            .eq('id', userId)
            .maybeSingle()
        setPerfil(data ?? null)
    }, [])

    useEffect(() => {
        // onAuthStateChange emite INITIAL_SESSION al suscribirse, así que no hace falta getSession().
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
            setSession(nuevaSesion)
            // Supabase recomienda no llamar a otros métodos del cliente dentro de este callback
            // (puede bloquear el login), así que la carga del perfil se difiere.
            setTimeout(async () => {
                if (nuevaSesion?.user) await cargarPerfil(nuevaSesion.user.id)
                else setPerfil(null)
                setCargando(false)
            }, 0)
        })
        return () => subscription.unsubscribe()
    }, [cargarPerfil])

    const recargarPerfil = useCallback(async () => {
        if (session?.user) await cargarPerfil(session.user.id)
    }, [session, cargarPerfil])

    const cerrarSesion = useCallback(async () => {
        await supabase.auth.signOut()
    }, [])

    const valor = useMemo<AuthState>(() => ({
        session,
        perfil,
        cargando,
        isAdmin: perfil?.es_admin === true,
        recargarPerfil,
        cerrarSesion,
    }), [session, perfil, cargando, recargarPerfil, cerrarSesion])

    return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
