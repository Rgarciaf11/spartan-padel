export type Pista = {
  id: number
  nombre: string
}

// Lo que cada rol puede leer de una reserva:
// - visitantes: solo la ocupación (sin datos personales)
// - clientes: además user_id, para reconocer sus propias reservas
// - administradores (RPC reservas_admin): además nombre y teléfono
export type Reserva = {
  id: string
  pista_id: number
  fecha: string
  slot_inicio: string
  slot_fin: string
  es_clase: boolean
  user_id?: string | null
  nombre?: string | null
  telefono?: string | null
}

export type Perfil = {
  id: string
  email: string
  nombre: string | null
  apellidos: string | null
  telefono: string | null
  es_admin: boolean
}

export type Slot = { inicio: string; fin: string }
