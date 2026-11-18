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
        <div className="bar">
          <Link to="/" className="brand">
            {/* Mark: a film frame with sprocket holes */}
            <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
              <rect x="1" y="3" width="20" height="16" rx="3" fill="var(--accent)" />
              <rect x="6" y="6" width="10" height="10" rx="1" fill="var(--ground)" />
              {[6, 10, 14].map((y) => <g key={y}><rect x="2.5" y={y} width="2" height="2" fill="var(--ground)" /><rect x="17.5" y={y} width="2" height="2" fill="var(--ground)" /></g>)}
            </svg>
            Reel Store
          </Link>
          <nav className="links">
            {loading ? null : user ? (
              <>
                <span className="muted">Hi, {user.firstName}</span>
                <button className="secondary" onClick={() => logout().then(() => navigate('/'))}>Sign out</button>
              </>
            ) : (
              <>
                <Link to="/login">Sign in</Link>
                <Link to="/register" className="button">Create account</Link>
              </>
            )}
          </nav>
        </div>
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
