import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import type { Perfil } from './types'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Reservas from './pages/Reservas'
import Login from './pages/Login'

function App() {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) cargarPerfil(data.session.user.id)
      else setLoadingAuth(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) cargarPerfil(session.user.id)
      else { setPerfil(null); setLoadingAuth(false) }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function cargarPerfil(userId: string) {
    const { data } = await supabase.from('perfiles').select('*').eq('id', userId).single()
    setPerfil(data || null)
    setLoadingAuth(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setPerfil(null)
  }

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Cargando...</p>
      </div>
    )
  }

  const isAdmin = perfil?.es_admin === true

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar isAdmin={isAdmin} perfil={perfil} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/reservas" element={<Reservas isAdmin={isAdmin} />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App