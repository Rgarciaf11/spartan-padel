import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth, nombreVisible } from '../auth/useAuth'
import { aFechaISO, diaDesdeHoy, DIAS_SEMANA, MESES, formatearFecha, franjaEmpezada } from '../lib/fechas'
import type { Reserva, Pista, Slot } from '../types'

const SLOTS: Slot[] = [
    { inicio: '08:00', fin: '09:30' },
    { inicio: '09:30', fin: '11:00' },
    { inicio: '11:00', fin: '12:30' },
    { inicio: '12:30', fin: '14:00' },
    { inicio: '14:00', fin: '15:30' },
    { inicio: '15:30', fin: '17:00' },
    { inicio: '17:00', fin: '18:30' },
    { inicio: '18:30', fin: '20:00' },
    { inicio: '20:00', fin: '21:30' },
    { inicio: '21:30', fin: '23:00' },
]

const DIAS = 10

type ModoLectura = 'publico' | 'cliente' | 'admin'

/**
 * Cada rol lee solo lo que necesita (y Supabase solo le deja leer eso):
 * - publico: ocupación de las pistas, sin datos personales
 * - cliente: además user_id, para marcar "Tu reserva"
 * - admin: RPC reservas_admin, con nombre y teléfono de quien reserva
 */
async function leerReservas(fecha: string, modo: ModoLectura): Promise<{ reservas: Reserva[]; error: boolean }> {
    if (modo === 'admin') {
        const { data, error } = await supabase.rpc('reservas_admin', { p_fecha: fecha })
        return { reservas: (data as Reserva[] | null) ?? [], error: !!error }
    }
    const columnas = modo === 'cliente'
        ? 'id, pista_id, fecha, slot_inicio, slot_fin, es_clase, user_id'
        : 'id, pista_id, fecha, slot_inicio, slot_fin, es_clase'
    const { data, error } = await supabase.from('reservas').select(columnas).eq('fecha', fecha)
    return { reservas: (data as Reserva[] | null) ?? [], error: !!error }
}

type ModalReserva = { pista: Pista; slot: Slot; fecha: string; estado: 'confirmar' | 'hecha' }

export default function Reservas() {
    const { session, perfil, isAdmin, cargando: cargandoAuth } = useAuth()
    const navigate = useNavigate()
    const [params, setParams] = useSearchParams()
    const userId = session?.user.id

    const dayIdx = Math.min(DIAS - 1, Math.max(0, Number(params.get('dia')) || 0))
    const diaActual = diaDesdeHoy(dayIdx)
    const fechaActual = aFechaISO(diaActual)
    const modo: ModoLectura = isAdmin ? 'admin' : session ? 'cliente' : 'publico'

    const [pistas, setPistas] = useState<Pista[]>([])
    const [recarga, setRecarga] = useState(0)
    const clave = `${fechaActual}|${modo}|${recarga}`
    const [datos, setDatos] = useState<{ clave: string; reservas: Reserva[]; error: boolean } | null>(null)
    const cargandoReservas = datos?.clave !== clave
    const reservas = datos?.reservas ?? []

    const [modal, setModal] = useState<ModalReserva | null>(null)
    const [detalleAdmin, setDetalleAdmin] = useState<Reserva | null>(null)
    const [guardando, setGuardando] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        supabase.from('pistas').select('*').order('id').then(({ data }) => setPistas(data || []))
    }, [])

    useEffect(() => {
        if (cargandoAuth) return
        let cancelado = false
        leerReservas(fechaActual, modo).then(res => {
            if (!cancelado) setDatos({ clave, ...res })
        })
        return () => { cancelado = true }
    }, [clave, fechaActual, modo, cargandoAuth])

    const recargar = () => setRecarga(r => r + 1)
    const cambiarDia = (i: number) => setParams(i === 0 ? {} : { dia: String(i) }, { replace: true })

    function getReserva(pistaId: number, slot: Slot) {
        return reservas.find(r => r.pista_id === pistaId && r.slot_inicio.slice(0, 5) === slot.inicio)
    }

    function pulsarFranja(pista: Pista, slot: Slot) {
        const reserva = getReserva(pista.id, slot)

        if (isAdmin) {
            if (reserva && !reserva.es_clase) setDetalleAdmin(reserva)
            else toggleClase(pista, slot, reserva)
            return
        }

        if (reserva || franjaEmpezada(fechaActual, slot.inicio)) return
        if (!session) {
            navigate('/acceso', { state: { from: `/reservas${dayIdx ? `?dia=${dayIdx}` : ''}`, motivo: 'reservar' } })
            return
        }
        setError('')
        setModal({ pista, slot, fecha: fechaActual, estado: 'confirmar' })
    }

    async function confirmarReserva() {
        if (!modal || !userId) return
        setGuardando(true)
        const { error } = await supabase.from('reservas').insert({
            pista_id: modal.pista.id,
            fecha: modal.fecha,
            slot_inicio: modal.slot.inicio,
            slot_fin: modal.slot.fin,
            es_clase: false,
            user_id: userId,
            nombre_jugador: nombreVisible(perfil, session?.user.email),
        })
        setGuardando(false)
        recargar()
        if (error) {
            // 23505 = índice único (pista, fecha, hora): alguien la ha reservado justo antes
            setError(error.code === '23505'
                ? 'Esta franja se acaba de reservar. Elige otra, por favor.'
                : 'No se ha podido guardar la reserva. Inténtalo de nuevo.')
            return
        }
        setModal({ ...modal, estado: 'hecha' })
    }

    async function toggleClase(pista: Pista, slot: Slot, reserva?: Reserva) {
        if (reserva) {
            await supabase.from('reservas').delete().eq('id', reserva.id)
        } else {
            await supabase.from('reservas').insert({
                pista_id: pista.id,
                fecha: fechaActual,
                slot_inicio: slot.inicio,
                slot_fin: slot.fin,
                es_clase: true,
                user_id: userId,
                nombre_jugador: 'Clase',
            })
        }
        recargar()
    }

    async function cancelarComoAdmin(reserva: Reserva) {
        setGuardando(true)
        await supabase.from('reservas').delete().eq('id', reserva.id)
        setGuardando(false)
        setDetalleAdmin(null)
        recargar()
    }

    const leyenda = [
        { color: 'bg-emerald-100 border-emerald-300', label: 'Libre' },
        ...(session && !isAdmin ? [{ color: 'bg-yellow-100 border-yellow-300', label: 'Tu reserva' }] : []),
        { color: 'bg-red-50 border-red-200', label: 'Ocupada' },
        { color: 'bg-blue-50 border-blue-200', label: 'Clase' },
    ]

    return (
        <div className="max-w-5xl mx-auto px-4 py-6">

            {/* Navegación por días */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-semibold text-gray-900">
                    {DIAS_SEMANA[diaActual.getDay()]} {diaActual.getDate()} {MESES[diaActual.getMonth()]}
                </h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => cambiarDia(Math.max(0, dayIdx - 1))}
                        disabled={dayIdx === 0}
                        aria-label="Día anterior"
                        className="w-9 h-9 border border-gray-300 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >‹</button>
                    <button
                        onClick={() => cambiarDia(Math.min(DIAS - 1, dayIdx + 1))}
                        disabled={dayIdx === DIAS - 1}
                        aria-label="Día siguiente"
                        className="w-9 h-9 border border-gray-300 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >›</button>
                </div>
            </div>

            {/* Strip de días */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                {Array.from({ length: DIAS }).map((_, i) => {
                    const d = diaDesdeHoy(i)
                    return (
                        <button
                            key={i}
                            onClick={() => cambiarDia(i)}
                            className={`flex-shrink-0 min-w-[60px] border rounded-lg px-3 py-2 text-center transition-all ${i === dayIdx
                                ? 'border-emerald-500 bg-emerald-50'
                                : 'border-gray-200 bg-white hover:bg-gray-50'
                                }`}
                        >
                            <div className={`text-[10px] font-semibold uppercase tracking-wide ${i === dayIdx ? 'text-emerald-700' : 'text-gray-400'}`}>
                                {DIAS_SEMANA[d.getDay()]}
                            </div>
                            <div className={`text-lg font-medium ${i === dayIdx ? 'text-emerald-700' : 'text-gray-700'}`}>
                                {d.getDate()}
                            </div>
                            {i === 0 && <div className="w-1 h-1 rounded-full bg-emerald-500 mx-auto mt-0.5" />}
                        </button>
                    )
                })}
            </div>

            {/* Leyenda */}
            <div className="flex gap-4 mb-4 flex-wrap">
                {leyenda.map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <div className={`w-3.5 h-3.5 rounded border ${color}`} />
                        {label}
                    </div>
                ))}
            </div>

            {!session && !cargandoAuth && (
                <p className="text-sm text-gray-500 mb-4">
                    Para reservar necesitas una cuenta.{' '}
                    <Link to="/acceso" state={{ from: '/reservas', motivo: 'reservar' }} className="text-emerald-600 font-medium hover:underline">
                        Inicia sesión o regístrate
                    </Link>
                </p>
            )}

            {datos?.error && !cargandoReservas && (
                <p className="text-sm text-red-500 mb-4">No se han podido cargar las reservas. Recarga la página.</p>
            )}

            {/* Grid */}
            {cargandoReservas ? (
                <div className="text-center py-16 text-gray-400">Cargando...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[580px] border-separate border-spacing-1">
                        <thead>
                            <tr>
                                <th className="w-20" />
                                {pistas.map(p => (
                                    <th key={p.id} className="text-xs font-semibold text-gray-500 bg-gray-100 rounded-lg px-2 py-2">
                                        🏓 {p.nombre}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {SLOTS.map(slot => {
                                const empezada = franjaEmpezada(fechaActual, slot.inicio)
                                return (
                                    <tr key={slot.inicio}>
                                        <td className="text-xs text-gray-400 text-right pr-2 align-middle whitespace-nowrap">
                                            {slot.inicio}
                                        </td>
                                        {pistas.map(pista => (
                                            <Celda
                                                key={pista.id}
                                                slot={slot}
                                                reserva={getReserva(pista.id, slot)}
                                                userId={userId}
                                                isAdmin={isAdmin}
                                                empezada={empezada}
                                                onClick={() => pulsarFranja(pista, slot)}
                                            />
                                        ))}
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal reservar (cliente) */}
            {modal && (
                <Modal onClose={() => setModal(null)}>
                    {modal.estado === 'confirmar' ? (
                        <>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Reservar {modal.pista.nombre}</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                {formatearFecha(modal.fecha)} · {modal.slot.inicio}–{modal.slot.fin}
                            </p>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-4">
                                <p className="text-xs text-gray-500">A nombre de</p>
                                <p className="text-sm font-medium text-gray-900">{nombreVisible(perfil, session?.user.email)}</p>
                            </div>
                            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
                            <div className="flex gap-2 mt-2">
                                <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-all">
                                    Cancelar
                                </button>
                                <button onClick={confirmarReserva} disabled={guardando} className="flex-1 bg-emerald-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 transition-all">
                                    {guardando ? 'Reservando...' : 'Confirmar reserva'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="text-3xl mb-2">✅</div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">¡Reserva confirmada!</h3>
                            <p className="text-sm text-gray-500 mb-5">
                                {modal.pista.nombre} · {formatearFecha(modal.fecha)} · {modal.slot.inicio}–{modal.slot.fin}
                            </p>
                            <div className="flex gap-2">
                                <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-all">
                                    Cerrar
                                </button>
                                <Link to="/mi-cuenta" className="flex-1 text-center bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 transition-all">
                                    Ver mis reservas
                                </Link>
                            </div>
                        </>
                    )}
                </Modal>
            )}

            {/* Detalle de una reserva (admin) */}
            {detalleAdmin && (
                <Modal onClose={() => setDetalleAdmin(null)}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{detalleAdmin.nombre || 'Reserva'}</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        {pistas.find(p => p.id === detalleAdmin.pista_id)?.nombre} · {formatearFecha(detalleAdmin.fecha)} · {detalleAdmin.slot_inicio.slice(0, 5)}–{detalleAdmin.slot_fin.slice(0, 5)}
                    </p>
                    {detalleAdmin.telefono ? (
                        <a href={`tel:${detalleAdmin.telefono}`} className="inline-block text-sm text-emerald-600 font-medium mb-5 hover:underline">
                            📞 {detalleAdmin.telefono}
                        </a>
                    ) : (
                        <p className="text-sm text-gray-400 mb-5">Sin teléfono</p>
                    )}
                    <div className="flex gap-2">
                        <button onClick={() => setDetalleAdmin(null)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-all">
                            Cerrar
                        </button>
                        <button onClick={() => cancelarComoAdmin(detalleAdmin)} disabled={guardando} className="flex-1 bg-red-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-all">
                            {guardando ? 'Cancelando...' : 'Cancelar reserva'}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    )
}

function Celda({ slot, reserva, userId, isAdmin, empezada, onClick }: {
    slot: Slot
    reserva?: Reserva
    userId?: string
    isAdmin: boolean
    empezada: boolean
    onClick: () => void
}) {
    const esClase = reserva?.es_clase === true
    const esMia = !!reserva && !esClase && !!userId && reserva.user_id === userId
    const ocupada = !!reserva && !esClase && !esMia
    const libreNoDisponible = !reserva && empezada && !isAdmin

    let estilo = 'bg-emerald-50 border-emerald-200 cursor-pointer hover:bg-emerald-100'
    let titulo = 'Libre'
    let subtitulo = `${slot.inicio}–${slot.fin}`
    let colorTitulo = 'text-emerald-700'
    let colorSub = 'text-emerald-500'

    if (esClase) {
        estilo = `bg-blue-50 border-blue-200 ${isAdmin ? 'cursor-pointer hover:bg-blue-100' : 'cursor-default'}`
        titulo = 'Clase'; subtitulo = 'Bloqueada'
        colorTitulo = 'text-blue-600'; colorSub = 'text-blue-400'
    } else if (esMia) {
        estilo = 'bg-yellow-50 border-yellow-300 cursor-default'
        titulo = 'Tu reserva'; subtitulo = `${slot.inicio}–${slot.fin}`
        colorTitulo = 'text-yellow-700'; colorSub = 'text-yellow-600'
    } else if (ocupada) {
        estilo = `bg-red-50 border-red-200 ${isAdmin ? 'cursor-pointer hover:bg-red-100' : 'cursor-default'}`
        titulo = isAdmin ? (reserva?.nombre || 'Reservada') : 'Ocupada'
        subtitulo = isAdmin ? (reserva?.telefono || 'Sin teléfono') : 'Reservada'
        colorTitulo = 'text-red-500'; colorSub = 'text-red-400'
    } else if (libreNoDisponible) {
        estilo = 'bg-gray-50 border-gray-200 cursor-default'
        titulo = '—'; subtitulo = 'No disponible'
        colorTitulo = 'text-gray-400'; colorSub = 'text-gray-300'
    }

    return (
        <td onClick={onClick} className={`rounded-lg px-2 py-2 h-14 align-top transition-all border text-left ${estilo}`}>
            <div className={`text-[11px] font-semibold truncate max-w-[140px] ${colorTitulo}`}>{titulo}</div>
            <div className={`text-[10px] mt-0.5 truncate max-w-[140px] ${colorSub}`}>{subtitulo}</div>
        </td>
    )
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
                {children}
            </div>
        </div>
    )
}
