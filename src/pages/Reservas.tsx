import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Reserva, Pista } from '../types'

// El teléfono del jugador nunca se pide desde la web pública: solo se leen las columnas necesarias
// para pintar el calendario (y en Supabase anon solo tiene permiso de lectura sobre estas columnas).
const COLUMNAS_PUBLICAS = 'id, pista_id, fecha, slot_inicio, slot_fin, nombre_jugador, es_clase, created_at'

const SLOTS: { inicio: string; fin: string }[] = [
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

const DAYS = 10
const DOW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function getDate(offset: number) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + offset)
    return d
}

function formatDate(d: Date) {
    return d.toISOString().split('T')[0]
}

type ModalData = {
    pista: Pista
    slot: { inicio: string; fin: string }
    fecha: string
} | null

interface Props {
    isAdmin: boolean
}

export default function Reservas({ isAdmin }: Props) {
    const [pistas, setPistas] = useState<Pista[]>([])
    const [reservas, setReservas] = useState<Reserva[]>([])
    const [dayIdx, setDayIdx] = useState(0)
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState<ModalData>(null)
    const [nombre, setNombre] = useState('')
    const [telefono, setTelefono] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const fechaActual = formatDate(getDate(dayIdx))
    const diaActual = getDate(dayIdx)

    useEffect(() => {
        supabase.from('pistas').select('*').order('id').then(({ data }) => {
            setPistas(data || [])
        })
    }, [])

    useEffect(() => {
        setLoading(true)
        supabase
            .from('reservas')
            .select(COLUMNAS_PUBLICAS)
            .eq('fecha', fechaActual)
            .then(({ data }) => {
                setReservas(data || [])
                setLoading(false)
            })
    }, [fechaActual])

    function getSlotInfo(pistaId: number, slot: { inicio: string; fin: string }) {
        return reservas.find(
            r => r.pista_id === pistaId && r.slot_inicio === slot.inicio + ':00'
        )
    }

    function abrirModal(pista: Pista, slot: { inicio: string; fin: string }) {
        const reserva = getSlotInfo(pista.id, slot)
        if (reserva) return
        setModal({ pista, slot, fecha: fechaActual })
        setNombre('')
        setTelefono('')
        setError('')
    }

    async function confirmarReserva() {
        if (!nombre.trim()) { setError('El nombre es obligatorio'); return }
        if (!modal) return
        setSaving(true)
        const { error } = await supabase.from('reservas').insert({
            pista_id: modal.pista.id,
            fecha: modal.fecha,
            slot_inicio: modal.slot.inicio,
            slot_fin: modal.slot.fin,
            nombre_jugador: nombre.trim(),
            telefono: telefono.trim() || null,
            es_clase: false,
        })
        setSaving(false)
        if (error) { setError('Error al guardar la reserva'); return }
        setModal(null)
        const { data } = await supabase.from('reservas').select(COLUMNAS_PUBLICAS).eq('fecha', fechaActual)
        setReservas(data || [])
    }

    async function toggleClase(pista: Pista, slot: { inicio: string; fin: string }) {
        const reserva = getSlotInfo(pista.id, slot)
        if (reserva) {
            await supabase.from('reservas').delete().eq('id', reserva.id)
        } else {
            await supabase.from('reservas').insert({
                pista_id: pista.id,
                fecha: fechaActual,
                slot_inicio: slot.inicio,
                slot_fin: slot.fin,
                nombre_jugador: 'Clase',
                telefono: null,
                es_clase: true,
            })
        }
        const { data } = await supabase.from('reservas').select(COLUMNAS_PUBLICAS).eq('fecha', fechaActual)
        setReservas(data || [])
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-6">

            {/* Navegación por días */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-semibold text-gray-900">
                    {DOW[diaActual.getDay()]} {diaActual.getDate()} {MONTHS[diaActual.getMonth()]}
                </h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setDayIdx(i => Math.max(0, i - 1))}
                        disabled={dayIdx === 0}
                        className="w-9 h-9 border border-gray-300 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >‹</button>
                    <button
                        onClick={() => setDayIdx(i => Math.min(DAYS - 1, i + 1))}
                        disabled={dayIdx === DAYS - 1}
                        className="w-9 h-9 border border-gray-300 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >›</button>
                </div>
            </div>

            {/* Strip de días */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                {Array.from({ length: DAYS }).map((_, i) => {
                    const d = getDate(i)
                    return (
                        <button
                            key={i}
                            onClick={() => setDayIdx(i)}
                            className={`flex-shrink-0 min-w-[60px] border rounded-lg px-3 py-2 text-center transition-all ${i === dayIdx
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-gray-200 bg-white hover:bg-gray-50'
                                }`}
                        >
                            <div className={`text-[10px] font-semibold uppercase tracking-wide ${i === dayIdx ? 'text-emerald-700' : 'text-gray-400'}`}>
                                {DOW[d.getDay()]}
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
                {[
                    { color: 'bg-emerald-100 border-emerald-300', label: 'Libre' },
                    { color: 'bg-red-50 border-red-200', label: 'Ocupada' },
                    { color: 'bg-blue-50 border-blue-200', label: 'Clase' },
                ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <div className={`w-3.5 h-3.5 rounded border ${color}`} />
                        {label}
                    </div>
                ))}
            </div>

            {/* Grid */}
            {loading ? (
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
                            {SLOTS.map(slot => (
                                <tr key={slot.inicio}>
                                    <td className="text-xs text-gray-400 text-right pr-2 align-middle whitespace-nowrap">
                                        {slot.inicio}
                                    </td>
                                    {pistas.map(pista => {
                                        const reserva = getSlotInfo(pista.id, slot)
                                        const esClase = reserva?.es_clase
                                        const esOcupada = reserva && !esClase

                                        return (
                                            <td
                                                key={pista.id}
                                                onClick={() => isAdmin ? toggleClase(pista, slot) : (!reserva && abrirModal(pista, slot))}
                                                className={`rounded-lg px-2 py-2 h-14 align-top transition-all border text-left
                          ${esClase ? 'bg-blue-50 border-blue-200 cursor-default' :
                                                        esOcupada ? 'bg-red-50 border-red-200 cursor-default' :
                                                            'bg-emerald-50 border-emerald-200 cursor-pointer hover:bg-emerald-100'
                                                    }`}
                                            >
                                                <div className={`text-[11px] font-semibold ${esClase ? 'text-blue-600' : esOcupada ? 'text-red-500' : 'text-emerald-700'
                                                    }`}>
                                                    {esClase ? 'Clase' : esOcupada ? reserva.nombre_jugador : 'Libre'}
                                                </div>
                                                <div className={`text-[10px] mt-0.5 ${esClase ? 'text-blue-400' : esOcupada ? 'text-red-400' : 'text-emerald-500'
                                                    }`}>
                                                    {esClase ? 'Bloqueada' : esOcupada ? 'Ocupada' : `${slot.inicio}–${slot.fin}`}
                                                </div>
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal reservar */}
            {modal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Reservar {modal.pista.nombre}</h3>
                        <p className="text-sm text-gray-500 mb-5">
                            {DOW[new Date(modal.fecha + 'T12:00:00').getDay()]} {new Date(modal.fecha + 'T12:00:00').getDate()} · {modal.slot.inicio}–{modal.slot.fin}
                        </p>
                        <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Tu nombre *</label>
                            <input
                                type="text"
                                value={nombre}
                                onChange={e => { setNombre(e.target.value); setError('') }}
                                placeholder="Ej: Carlos García"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Teléfono (opcional)</label>
                            <input
                                type="tel"
                                value={telefono}
                                onChange={e => setTelefono(e.target.value)}
                                placeholder="Ej: 612 345 678"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500"
                            />
                        </div>
                        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
                        <div className="flex gap-2 mt-4">
                            <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-all">
                                Cancelar
                            </button>
                            <button onClick={confirmarReserva} disabled={saving} className="flex-1 bg-emerald-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 transition-all">
                                {saving ? 'Guardando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}