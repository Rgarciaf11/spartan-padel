import { useNavigate } from 'react-router-dom'
import { bar, arriba, red, pista, logo } from '../assets/fotos'

export default function Home() {
    const navigate = useNavigate()

    return (
        <div className="bg-black min-h-screen text-white">

            {/* HERO */}
            <div className="relative h-[90vh] min-h-[500px] overflow-hidden">
                <img src={pista} alt="Pista Spartan Padel" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black" />
                <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
                    <img src={logo} alt="Spartan Padel logo" className="w-36 h-36 object-contain mb-6 drop-shadow-2xl" />
                    <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-3 uppercase">
                        Spartan Padel
                    </h1>
                    <p className="text-yellow-400 font-semibold tracking-[0.3em] text-sm uppercase mb-2">
                        40 · 15 · Academy
                    </p>
                    <p className="text-white/70 text-lg max-w-md mt-3 mb-8">
                        Reserva tu pista en Mutxamel, Alicante
                    </p>
                    <button
                        onClick={() => navigate('/reservas')}
                        className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-10 py-4 rounded-full text-base uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                    >
                        Reservar pista
                    </button>
                </div>
            </div>

            {/* STATS */}
            <div className="border-y border-white/10 grid grid-cols-3">
                {[
                    { num: '4', label: 'Pistas' },
                    { num: '8–22h', label: 'Horario' },
                    { num: '1h 30\'', label: 'Por reserva' },
                ].map(({ num, label }) => (
                    <div key={label} className="py-8 text-center border-r border-white/10 last:border-r-0">
                        <div className="text-3xl font-black text-yellow-400">{num}</div>
                        <div className="text-xs text-white/50 uppercase tracking-widest mt-1">{label}</div>
                    </div>
                ))}
            </div>

            {/* FOTOS */}
            <div className="max-w-5xl mx-auto px-4 py-16">
                <h2 className="text-3xl font-black uppercase tracking-tight mb-2">El club</h2>
                <p className="text-white/50 mb-8">Instalaciones de primer nivel en Mutxamel</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="col-span-2 sm:col-span-2 row-span-2 rounded-2xl overflow-hidden aspect-square sm:aspect-auto sm:h-72">
                        <img src={arriba} alt="Vista aérea del club" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="rounded-2xl overflow-hidden h-[138px] sm:h-[138px]">
                        <img src={bar} alt="Bar Punto de Oro" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="rounded-2xl overflow-hidden h-[138px] sm:h-[138px]">
                        <img src={red} alt="Pista de pádel" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    </div>
                </div>
            </div>

            {/* SERVICIOS */}
            <div className="max-w-5xl mx-auto px-4 pb-16">
                <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Servicios</h2>
                <p className="text-white/50 mb-8">Todo lo que necesitas en un solo lugar</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { emoji: '🎾', title: 'Clases con entrenador', desc: 'Entrena con profesionales y mejora tu nivel en pista.' },
                        { emoji: '🍺', title: 'Bar Punto de Oro', desc: 'Cafetería y bar con terraza para antes y después del partido.' },
                        { emoji: '🅿️', title: 'Aparcamiento gratuito', desc: 'Amplio parking privado para todos los socios y visitantes.' },
                    ].map(({ emoji, title, desc }) => (
                        <div key={title} className="border border-white/10 rounded-2xl p-6 hover:border-yellow-400/50 transition-all">
                            <div className="text-3xl mb-3">{emoji}</div>
                            <h3 className="font-bold text-white mb-2">{title}</h3>
                            <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* MAPA */}
            <div className="max-w-5xl mx-auto px-4 pb-16">
                <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Dónde estamos</h2>
                <p className="text-white/50 mb-6">Cami del Mahones, Partida El Collao, Parc.200 · 03110 Mutxamel, Alicante</p>
                <div className="rounded-2xl overflow-hidden border border-white/10" style={{ height: '380px' }}>
                    <iframe
                        title="Ubicación Spartan Padel"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3126.032328024313!2d-0.48989852367247483!3d38.4176177748699!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd6230df6f8fa957%3A0x6036009dd70425a!2s40%2F15%20Club%20Deportivo!5e0!3m2!1ses!2ses!4v1780613066299!5m2!1ses!2ses"
                    />
                </div>
            </div>

            {/* CTA FINAL */}
            <div className="border-t border-white/10 py-16 text-center px-4">
                <h2 className="text-4xl font-black uppercase tracking-tight mb-4">¿Listo para jugar?</h2>
                <p className="text-white/50 mb-8">Consulta la disponibilidad y reserva tu franja en segundos</p>
                <button
                    onClick={() => navigate('/reservas')}
                    className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-10 py-4 rounded-full text-base uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                >
                    Ver disponibilidad →
                </button>
            </div>

            {/* FOOTER */}
            <div className="border-t border-white/10 py-8 text-center text-white/30 text-xs px-4">
                <p>© 2025 Spartan Padel 4015 · Mutxamel, Alicante</p>
            </div>

        </div>
    )
}