import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navigation from './components/Navigation'
import Dashboard from './pages/Dashboard'
import Tickets from './pages/Tickets'
import Analytics from './pages/Analytics'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Login from './pages/Login'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))

  useEffect(() => {
    const checkToken = () => {
      setToken(localStorage.getItem('token'))
    }
    window.addEventListener('storage', checkToken)
    return () => window.removeEventListener('storage', checkToken)
  }, [])

  const ProtectedRoute = ({ element }: { element: React.ReactNode }) => {
    return token ? element : <Navigate to="/login" replace />
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {token && <Navigation />}
        <main className={token ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" : ""}>
          <Routes>
            <Route path="/login" element={!token ? <Login /> : <Navigate to="/dashboard" replace />} />
            <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
            <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
            <Route path="/tickets" element={<ProtectedRoute element={<Tickets />} />} />
            <Route path="/analytics" element={<ProtectedRoute element={<Analytics />} />} />
            <Route path="/reports" element={<ProtectedRoute element={<Reports />} />} />
            <Route path="/settings" element={<ProtectedRoute element={<Settings />} />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
