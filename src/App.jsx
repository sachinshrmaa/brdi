import { Navigate, Route, Routes, Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './App.css'
import BookingPage from './pages/BookingPage'
import AdminPage from './pages/AdminPage'
import StatisticsPage from './pages/StatisticsPage'
import UserDashboard from './pages/UserDashboard'
import { supabase } from './lib/supabase'

function LandingPage() {
  return (
    <div className="landing-page">
      <div className="landing-hero">
        <h1>BRDI</h1>
        <p className="tagline">Construction Waste Management & Recycling</p>
        <p className="subtitle">Schedule your waste drop-off appointment today</p>
      </div>

      <div className="landing-buttons">
        <Link to="/book" className="btn-primary">
          📦 Book an Appointment
        </Link>
        <Link to="/admin-login" className="btn-secondary">
          🔐 Admin Access
        </Link>
      </div>

      <div className="landing-info">
        <h2>About BRDI</h2>
        <p>We accept: Concrete, Brick masonry debris, Cement mortar, Concrete blocks, Stone rubble, Precast elements, Ceramic tiles, and Inert excavation debris.</p>
        <p>We do NOT accept: Municipal waste, Organic waste, Hazardous materials, or Medical waste.</p>
      </div>
    </div>
  )
}

function App() {
  const location = useLocation()
  const [session, setSession] = useState(null)

  useEffect(() => {
    let isMounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setSession(data.session)
      }
    }).catch((err) => {
      console.error('Session check error:', err)
      if (isMounted) {
        setSession(null)
      }
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (isMounted) {
        setSession(newSession)
      }
    })

    return () => {
      isMounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  const isAdminPath = location.pathname.startsWith('/admin') || location.pathname === '/admin-login'
  const isUserPath = location.pathname.startsWith('/book') || location.pathname === '/my-bookings'

  return (
    <div className="app-shell">
      <header>
        <Link to="/" className="header-logo">
          <div>
            <p className="eyebrow">Waste Management</p>
            <h1>BRDI</h1>
          </div>
        </Link>
        
        <nav>
          {!isAdminPath && (
            <>
              <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
              {session && (
                <>
                  <Link to="/book" className={location.pathname === '/book' ? 'active' : ''}>Book Now</Link>
                  <Link to="/my-bookings" className={location.pathname === '/my-bookings' ? 'active' : ''}>My Bookings</Link>
                </>
              )}
            </>
          )}
          {isAdminPath && (
            <>
              <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>Bookings</Link>
              <Link to="/admin/statistics" className={location.pathname === '/admin/statistics' ? 'active' : ''}>Statistics</Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/book" element={<BookingPage />} />
          <Route path="/my-bookings" element={<UserDashboard />} />
          <Route path="/admin-login" element={<AdminPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/statistics" element={<StatisticsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
