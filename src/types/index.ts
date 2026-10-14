export type Pista = {
  id: number
  nombre: string
}

export type Reserva = {
  id: string
  pista_id: number
  fecha: string
  slot_inicio: string
  slot_fin: string
  nombre_jugador: string
  telefono?: string | null
  es_clase: boolean
  created_at: string
}

export type Perfil = {
  id: string
  email: string
  es_admin: boolean
}