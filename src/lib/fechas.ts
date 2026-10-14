export const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
export const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** Fecha local (00:00) desplazada `offset` días desde hoy. */
export function diaDesdeHoy(offset: number): Date {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + offset)
    return d
}

/**
 * YYYY-MM-DD en hora local.
 * Ojo: no usar toISOString(), que convierte a UTC y en España devuelve el día anterior.
 */
export function aFechaISO(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dia = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${dia}`
}

/** "2026-10-16" → Date local a mediodía (evita saltos por zona horaria). */
export function desdeFechaISO(iso: string): Date {
    return new Date(`${iso}T12:00:00`)
}

/** "2026-10-16" → "Vie 16 oct" */
export function formatearFecha(iso: string): string {
    const d = desdeFechaISO(iso)
    return `${DIAS_SEMANA[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`
}

/** "18:30:00" → "18:30" */
export function formatearHora(hora: string): string {
    return hora.slice(0, 5)
}

/** true si la franja ya ha terminado. */
export function franjaTerminada(fecha: string, horaFin: string, ahora = new Date()): boolean {
    const hoy = aFechaISO(ahora)
    if (fecha !== hoy) return fecha < hoy
    return formatearHora(horaFin) <= ahora.toTimeString().slice(0, 5)
}

/** true si la franja ya ha empezado (no se puede reservar). */
export function franjaEmpezada(fecha: string, horaInicio: string, ahora = new Date()): boolean {
    const hoy = aFechaISO(ahora)
    if (fecha !== hoy) return fecha < hoy
    return formatearHora(horaInicio) <= ahora.toTimeString().slice(0, 5)
}
