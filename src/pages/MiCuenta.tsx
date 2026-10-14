import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth, nombreVisible } from '../auth/useAuth'
import { formatearFecha, formatearHora, franjaTerminada } from '../lib/fechas'
import type { Pista, Reserva } from '../types'

type Pestana = 'reservas' | 'perfil'

export default function MiCuenta() {
    const { perfil, session } = useAuth()
    const [params, setParams] = useSearchParams()
    const pestana: Pestana = params.get('tab') === 'perfil' ? 'perfil' : 'reservas'

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-semibold text-gray-900">
                Hola, {perfil?.nombre || nombreVisible(perfil, session?.user.email)}
            </h1>
            <p className="text-sm text-gray-500 mb-6">Gestiona tus reservas y tus datos.</p>

            <div className="flex gap-1 border-b border-gray-200 mb-6">
                {([
                    ['reservas', 'Mis reservas'],
                    ['perfil', 'Mi perfil'],
                ] as const).map(([id, texto]) => (
                    <button
                        key={id}
                        onClick={() => setParams(id === 'reservas' ? {} : { tab: id }, { replace: true })}
                        className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-all ${pestana === id
                                ? 'border-emerald-500 text-emerald-700'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {texto}
                    </button>
                ))}
            </div>

            {/* key: si el perfil llega después de montar, el formulario se reinicia con sus datos */}
            {pestana === 'reservas' ? <MisReservas /> : <MiPerfil key={perfil ? 'con-perfil' : 'sin-perfil'} />}
        </div>
    )
}

/* ─────────────────────────── Mis reservas ─────────────────────────── */

function MisReservas() {
    const { session } = useAuth()
    const userId = session?.user.id
    const [reservas, setReservas] = useState<Reserva[] | null>(null)
    const [pistas, setPistas] = useState<Pista[]>([])
    const [vista, setVista] = useState<'proximas' | 'pasadas'>('proximas')
    const [confirmando, setConfirmando] = useState<string | null>(null)
    const [error, setError] = useState('')
    const [recarga, setRecarga] = useState(0)

    useEffect(() => {
        supabase.from('pistas').select('*').order('id').then(({ data }) => setPistas(data || []))
    }, [])

    useEffect(() => {
        if (!userId) return
        supabase
            .from('reservas')
            .select('id, pista_id, fecha, slot_inicio, slot_fin, es_clase, user_id')
            .eq('user_id', userId)
            .eq('es_clase', false)
            .order('fecha', { ascending: true })
            .order('slot_inicio', { ascending: true })
            .then(({ data }) => setReservas(data || []))
    }, [userId, recarga])

    async function cancelar(id: string) {
        setError('')
        const { error, count } = await supabase.from('reservas').delete({ count: 'exact' }).eq('id', id)
        setConfirmando(null)
        if (error || count === 0) {
            setError('No se ha podido cancelar la reserva.')
            return
        }
        setRecarga(r => r + 1)
    }

    if (!reservas) return <p className="text-gray-400 text-sm py-10 text-center">Cargando...</p>

    const proximas = reservas.filter(r => !franjaTerminada(r.fecha, r.slot_fin))
    const pasadas = reservas.filter(r => franjaTerminada(r.fecha, r.slot_fin)).reverse()
    const lista = vista === 'proximas' ? proximas : pasadas
    const nombrePista = (id: number) => pistas.find(p => p.id === id)?.nombre ?? `Pista ${id}`

    return (
        <div>
            <div className="inline-flex bg-gray-100 rounded-lg p-1 mb-5">
                {([
                    ['proximas', `Próximas (${proximas.length})`],
                    ['pasadas', `Pasadas (${pasadas.length})`],
                ] as const).map(([id, texto]) => (
                    <button
                        key={id}
                        onClick={() => setVista(id)}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${vista === id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {texto}
                    </button>
                ))}
            </div>

            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

            {lista.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
                    <p className="text-gray-500 text-sm mb-4">
                        {vista === 'proximas' ? 'No tienes reservas próximas.' : 'Todavía no tienes reservas pasadas.'}
                    </p>
                    {vista === 'proximas' && (
                        <Link
                            to="/reservas"
                            className="inline-block bg-emerald-500 text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-emerald-600 transition-all"
                        >
                            Reservar pista
                        </Link>
                    )}
                </div>
            ) : (
                <ul className="space-y-3">
                    {lista.map(r => (
                        <li
                            key={r.id}
                            className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
                        >
                            <div>
                                <p className="font-semibold text-gray-900">{formatearFecha(r.fecha)}</p>
                                <p className="text-sm text-gray-500">
                                    {formatearHora(r.slot_inicio)}–{formatearHora(r.slot_fin)} · {nombrePista(r.pista_id)}
                                </p>
                            </div>

                            {vista === 'proximas' && (
                                confirmando === r.id ? (
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-xs text-gray-500 hidden sm:inline">¿Cancelar?</span>
                                        <button
                                            onClick={() => setConfirmando(null)}
                                            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50"
                                        >
                                            No
                                        </button>
                                        <button
                                            onClick={() => cancelar(r.id)}
                                            className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600"
                                        >
                                            Sí, cancelar
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setConfirmando(r.id)}
                                        className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 shrink-0"
                                    >
                                        Cancelar
                                    </button>
                                )
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

/* ─────────────────────────── Mi perfil ─────────────────────────── */

function MiPerfil() {
    const { perfil, session, recargarPerfil } = useAuth()
    const [form, setForm] = useState({
        nombre: perfil?.nombre ?? '',
        apellidos: perfil?.apellidos ?? '',
        telefono: perfil?.telefono ?? '',
    })
    const [estado, setEstado] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
    const [guardando, setGuardando] = useState(false)

    async function guardar(e: FormEvent) {
        e.preventDefault()
        const telefono = form.telefono.replace(/\s+/g, '')
        if (!form.nombre.trim() || !form.apellidos.trim()) {
            return setEstado({ tipo: 'error', texto: 'Indica tu nombre y apellidos' })
        }
        if (!/^\+?\d{9,15}$/.test(telefono)) {
            return setEstado({ tipo: 'error', texto: 'El teléfono no es válido' })
        }
        if (!session) return
        setGuardando(true)
        const { error } = await supabase
            .from('perfiles')
            .update({ nombre: form.nombre.trim(), apellidos: form.apellidos.trim(), telefono })
            .eq('id', session.user.id)
        setGuardando(false)
        if (error) return setEstado({ tipo: 'error', texto: 'No se han podido guardar los cambios' })
        await recargarPerfil()
        setEstado({ tipo: 'ok', texto: 'Datos guardados' })
    }

    const input = (nombre: keyof typeof form) => ({
        value: form[nombre],
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            setForm(f => ({ ...f, [nombre]: e.target.value }))
            setEstado(null)
        },
        className: 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500',
    })

    return (
        <form onSubmit={guardar} className="bg-white border border-gray-200 rounded-2xl p-6 max-w-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor="p-nombre">Nombre</label>
                    <input id="p-nombre" autoComplete="given-name" {...input('nombre')} />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor="p-apellidos">Apellidos</label>
                    <input id="p-apellidos" autoComplete="family-name" {...input('apellidos')} />
                </div>
            </div>
            <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor="p-telefono">Teléfono</label>
                <input id="p-telefono" type="tel" autoComplete="tel" {...input('telefono')} />
            </div>
            <div className="mb-5">
                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                <p className="text-sm text-gray-700 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    {session?.user.email}
                </p>
            </div>

            {estado && (
                <p className={`text-xs mb-3 ${estado.tipo === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>{estado.texto}</p>
            )}
            <button
                type="submit"
                disabled={guardando}
                className="bg-gray-900 text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-all"
            >
                {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
        </form>
    )
}
