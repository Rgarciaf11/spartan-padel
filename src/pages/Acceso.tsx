import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/useAuth'

type Modo = 'login' | 'registro'
type EstadoNavegacion = { from?: string; motivo?: 'reservar' } | null

const inputClass =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500'
const labelClass = 'block text-xs font-medium text-gray-500 mb-1'

function traducirError(mensaje: string): string {
    const m = mensaje.toLowerCase()
    if (m.includes('invalid login credentials')) return 'Email o contraseña incorrectos'
    if (m.includes('email not confirmed')) return 'Confirma tu email antes de entrar (revisa tu bandeja de entrada)'
    if (m.includes('already registered') || m.includes('already been registered')) return 'Ya existe una cuenta con ese email'
    if (m.includes('signups not allowed') || m.includes('signup is disabled')) return 'El registro de nuevas cuentas está desactivado'
    if (m.includes('password')) return 'La contraseña no es válida (mínimo 8 caracteres)'
    if (m.includes('rate limit')) return 'Demasiados intentos. Espera unos minutos y vuelve a probar'
    return 'Ha ocurrido un error. Inténtalo de nuevo'
}

export default function Acceso() {
    const { session, cargando } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [params, setParams] = useSearchParams()
    const estado = location.state as EstadoNavegacion
    const destino = estado?.from || '/'
    const modo: Modo = params.get('modo') === 'registro' ? 'registro' : 'login'

    const [form, setForm] = useState({
        nombre: '', apellidos: '', email: '', telefono: '', password: '', password2: '',
    })
    const [error, setError] = useState('')
    const [enviando, setEnviando] = useState(false)
    const [pendienteConfirmar, setPendienteConfirmar] = useState(false)

    // Ya hay sesión (p. ej. vuelve con el botón atrás): no tiene sentido mostrar el login.
    if (!cargando && session) return <Navigate to={destino} replace />

    function cambiarModo(nuevo: Modo) {
        setError('')
        setParams(nuevo === 'registro' ? { modo: 'registro' } : {}, { replace: true, state: estado })
    }

    function campo(nombre: keyof typeof form) {
        return {
            value: form[nombre],
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                setForm(f => ({ ...f, [nombre]: e.target.value }))
                setError('')
            },
        }
    }

    async function entrar(e: FormEvent) {
        e.preventDefault()
        if (!form.email.trim() || !form.password) return setError('Introduce tu email y contraseña')
        setEnviando(true)
        const { error } = await supabase.auth.signInWithPassword({
            email: form.email.trim(),
            password: form.password,
        })
        setEnviando(false)
        if (error) return setError(traducirError(error.message))
        navigate(destino, { replace: true })
    }

    async function registrarse(e: FormEvent) {
        e.preventDefault()
        const telefono = form.telefono.replace(/\s+/g, '')
        if (!form.nombre.trim() || !form.apellidos.trim()) return setError('Indica tu nombre y apellidos')
        if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setError('El email no es válido')
        if (!/^\+?\d{9,15}$/.test(telefono)) return setError('El teléfono no es válido')
        if (form.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres')
        if (form.password !== form.password2) return setError('Las contraseñas no coinciden')

        setEnviando(true)
        const { data, error } = await supabase.auth.signUp({
            email: form.email.trim(),
            password: form.password,
            options: {
                // Estos datos los usa el trigger crear_perfil() para rellenar la tabla perfiles
                data: { nombre: form.nombre.trim(), apellidos: form.apellidos.trim(), telefono },
                emailRedirectTo: `${window.location.origin}/mi-cuenta`,
            },
        })
        setEnviando(false)
        if (error) return setError(traducirError(error.message))

        // Con "Confirm email" desactivado Supabase devuelve sesión directamente;
        // si está activado, hay que esperar a que el usuario confirme el correo.
        if (data.session) navigate(destino, { replace: true })
        else setPendienteConfirmar(true)
    }

    if (pendienteConfirmar) {
        return (
            <Tarjeta>
                <div className="text-3xl mb-3">📩</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Revisa tu correo</h2>
                <p className="text-sm text-gray-500">
                    Te hemos enviado un enlace a <strong>{form.email}</strong> para confirmar tu cuenta.
                    Después podrás iniciar sesión y reservar.
                </p>
            </Tarjeta>
        )
    }

    return (
        <Tarjeta>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Área de clientes</h2>
            <p className="text-sm text-gray-500 mb-5">
                {estado?.motivo === 'reservar'
                    ? 'Inicia sesión o crea una cuenta para reservar tu pista.'
                    : 'Gestiona tus reservas y tus datos.'}
            </p>

            <div className="grid grid-cols-2 bg-gray-100 rounded-lg p-1 mb-5">
                {(['login', 'registro'] as const).map(m => (
                    <button
                        key={m}
                        type="button"
                        onClick={() => cambiarModo(m)}
                        className={`py-2 text-sm font-medium rounded-md transition-all ${modo === m ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                    </button>
                ))}
            </div>

            {modo === 'login' ? (
                <form onSubmit={entrar} noValidate>
                    <div className="mb-3">
                        <label className={labelClass} htmlFor="email">Email</label>
                        <input id="email" type="email" autoComplete="email" placeholder="tu@email.com" className={inputClass} autoFocus {...campo('email')} />
                    </div>
                    <div className="mb-3">
                        <label className={labelClass} htmlFor="password">Contraseña</label>
                        <input id="password" type="password" autoComplete="current-password" placeholder="••••••••" className={inputClass} {...campo('password')} />
                    </div>
                    {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
                    <BotonEnviar enviando={enviando} texto="Entrar" textoEnviando="Entrando..." />
                </form>
            ) : (
                <form onSubmit={registrarse} noValidate>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className={labelClass} htmlFor="nombre">Nombre</label>
                            <input id="nombre" autoComplete="given-name" className={inputClass} autoFocus {...campo('nombre')} />
                        </div>
                        <div>
                            <label className={labelClass} htmlFor="apellidos">Apellidos</label>
                            <input id="apellidos" autoComplete="family-name" className={inputClass} {...campo('apellidos')} />
                        </div>
                    </div>
                    <div className="mb-3">
                        <label className={labelClass} htmlFor="email-registro">Email</label>
                        <input id="email-registro" type="email" autoComplete="email" placeholder="tu@email.com" className={inputClass} {...campo('email')} />
                    </div>
                    <div className="mb-3">
                        <label className={labelClass} htmlFor="telefono">Teléfono</label>
                        <input id="telefono" type="tel" autoComplete="tel" placeholder="612 345 678" className={inputClass} {...campo('telefono')} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className={labelClass} htmlFor="password-registro">Contraseña</label>
                            <input id="password-registro" type="password" autoComplete="new-password" placeholder="Mín. 8 caracteres" className={inputClass} {...campo('password')} />
                        </div>
                        <div>
                            <label className={labelClass} htmlFor="password2">Repite la contraseña</label>
                            <input id="password2" type="password" autoComplete="new-password" className={inputClass} {...campo('password2')} />
                        </div>
                    </div>
                    {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
                    <BotonEnviar enviando={enviando} texto="Crear cuenta" textoEnviando="Creando cuenta..." />
                </form>
            )}
        </Tarjeta>
    )
}

function Tarjeta({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-md shadow-sm">
                {children}
            </div>
        </div>
    )
}

function BotonEnviar({ enviando, texto, textoEnviando }: { enviando: boolean; texto: string; textoEnviando: string }) {
    return (
        <button
            type="submit"
            disabled={enviando}
            className="w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-all mt-2"
        >
            {enviando ? textoEnviando : texto}
        </button>
    )
}
