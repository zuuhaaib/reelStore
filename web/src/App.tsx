import { Link, Route, Routes, useNavigate } from 'react-router-dom'
import { useAuth } from './auth.tsx'
import Catalog from './pages/Catalog.tsx'
import ItemDetail from './pages/ItemDetail.tsx'
import Login from './pages/Login.tsx'
import Register from './pages/Register.tsx'

export default function App() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <>
      <header>
        <Link to="/" className="brand">Reel Store</Link>
        {loading ? null : user ? (
          <>
            <span>Hi, {user.firstName}</span>
            <button onClick={() => logout().then(() => navigate('/'))}>Sign out</button>
          </>
        ) : (
          <>
            <Link to="/login">Sign in</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </header>
      <main>
        {/* Each feature adds its routes here: /items/:id, /cart, /checkout, /profile, /admin */}
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="/items/:id" element={<ItemDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
    </>
  )
}
