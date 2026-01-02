import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navigation from './components/Navigation'
import Dashboard from './pages/Dashboard'
import Tickets from './pages/Tickets'
import Analytics from './pages/Analytics'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

function App() {
  const token = localStorage.getItem('token')

  const ProtectedRoute = ({ element }: { element: React.ReactNode }) => {
    return token ? element : <Navigate to="/" replace />
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<ProtectedRoute element={<Dashboard />} />} />
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
