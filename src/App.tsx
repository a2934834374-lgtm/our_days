import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Pair from './pages/Pair'
import Home from './pages/Home'
import Savings from './pages/Savings'
import SavingsDetail from './pages/SavingsDetail'
import Moments from './pages/Moments'
import Settings from './pages/Settings'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-cream"><div className="text-3xl animate-bounce">🌱</div></div>
  if (!user) return <Navigate to="/login" />
  return <>{children}</>
}

function AppRoutes() {
  const { user, partnerId, loading } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-cream"><div className="text-3xl animate-bounce">🌱</div></div>
  }

  return (
    <Routes>
      <Route path="/login" element={user ? (partnerId ? <Navigate to="/" /> : <Navigate to="/pair" />) : <Login />} />
      <Route path="/pair" element={
        <ProtectedRoute>
          {partnerId ? <Navigate to="/" /> : <Pair />}
        </ProtectedRoute>
      } />
      <Route path="/" element={<ProtectedRoute>{partnerId ? <Home /> : <Navigate to="/pair" />}</ProtectedRoute>} />
      <Route path="/savings" element={<ProtectedRoute><Savings /></ProtectedRoute>} />
      <Route path="/savings/:id" element={<ProtectedRoute><SavingsDetail /></ProtectedRoute>} />
      <Route path="/moments" element={<ProtectedRoute><Moments /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/our_days">
      <AuthProvider>
        <div className="max-w-lg mx-auto min-h-screen bg-cream shadow-lg relative overflow-hidden">
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
