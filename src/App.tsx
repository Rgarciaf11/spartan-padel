import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthProvider from './auth/AuthProvider'
import RequireAuth from './auth/RequireAuth'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Reservas from './pages/Reservas'
import Acceso from './pages/Acceso'
import MiCuenta from './pages/MiCuenta'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/reservas" element={<Reservas />} />
            <Route path="/acceso" element={<Acceso />} />
            <Route path="/login" element={<Navigate to="/acceso" replace />} />
            <Route path="/mi-cuenta" element={<RequireAuth><MiCuenta /></RequireAuth>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
