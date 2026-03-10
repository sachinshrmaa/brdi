import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [scanToken, setScanToken] = useState('')
  const [scanResult, setScanResult] = useState(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterWasteType, setFilterWasteType] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    let mounted = true

    async function bootstrap() {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (!mounted) {
          return
        }

        if (error) {
          setErrorMessage(error.message)
          setSession(null)
          setIsAdmin(false)
          setBookings([])
          return
        }

        const activeSession = data.session
        setSession(activeSession)

        if (activeSession) {
          await checkAdminAndLoad(activeSession.user.id)
        } else {
          setIsAdmin(false)
          setBookings([])
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        if (mounted) {
          setErrorMessage(message)
          setSession(null)
          setIsAdmin(false)
          setBookings([])
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    bootstrap()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setLoading(true)
      setSession(newSession)
      setScanResult(null)
      setErrorMessage('')

      try {
        if (newSession) {
          await checkAdminAndLoad(newSession.user.id)
        } else {
          setIsAdmin(false)
          setBookings([])
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        setErrorMessage(message)
        setIsAdmin(false)
        setBookings([])
      } finally {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  async function checkAdminAndLoad(userId) {
    try {
      const { data: adminRow, error: adminError } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle()

      if (adminError) {
        setErrorMessage(adminError.message)
        setIsAdmin(false)
        setBookings([])
        return
      }

      if (!adminRow) {
        setErrorMessage('You are signed in but not registered as an admin.')
        setIsAdmin(false)
        setBookings([])
        return
      }

      setIsAdmin(true)
      await loadBookings()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setErrorMessage(message)
      setIsAdmin(false)
      setBookings([])
    }
  }

  async function loadBookings() {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setErrorMessage(error.message)
      return
    }

    setBookings(data || [])
  }

  async function cancelBooking(bookingId) {
    const confirmed = window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')
    if (!confirmed) return

    const { error } = await supabase
      .from('bookings')
      .update({ cancelled_at: new Date().toISOString() })
      .eq('id', bookingId)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    await loadBookings()
    setErrorMessage('')
  }

  const filteredBookings = useMemo(() => {
    let filtered = [...bookings]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(b =>
        b.applicant_name?.toLowerCase().includes(query) ||
        b.email?.toLowerCase().includes(query) ||
        b.vehicle_number?.toLowerCase().includes(query) ||
        b.phone?.includes(query) ||
        String(b.id).includes(query)
      )
    }

    // Status filter
    if (filterStatus === 'checked-in') {
      filtered = filtered.filter(b => b.checked_in_at)
    } else if (filterStatus === 'pending') {
      filtered = filtered.filter(b => !b.checked_in_at)
    }

    // Waste type filter
    if (filterWasteType !== 'all') {
      filtered = filtered.filter(b => b.waste_type === filterWasteType)
    }

    // Sort
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    } else if (sortBy === 'appointment') {
      filtered.sort((a, b) => new Date(a.appointment_at) - new Date(b.appointment_at))
    } else if (sortBy === 'amount-high') {
      filtered.sort((a, b) => Number(b.amount) - Number(a.amount))
    } else if (sortBy === 'amount-low') {
      filtered.sort((a, b) => Number(a.amount) - Number(b.amount))
    }

    return filtered
  }, [bookings, searchQuery, filterStatus, filterWasteType, sortBy])

  const wasteTypes = useMemo(() => {
    const types = new Set(bookings.map(b => b.waste_type))
    return Array.from(types).sort()
  }, [bookings])

  async function login(event) {
    event.preventDefault()
    if (isLoggingIn) {
      return
    }

    setIsLoggingIn(true)
    setErrorMessage('')

    try {
      let result = await supabase.auth.signInWithPassword({ email, password })

      // Supabase auth can briefly lose a lock if another tab is refreshing auth state.
      if (result.error?.name === 'AbortError' || /Lock broken by another request/i.test(result.error?.message || '')) {
        result = await supabase.auth.signInWithPassword({ email, password })
      }

      if (result.error) {
        if (result.error.name === 'AbortError' || /Lock broken by another request/i.test(result.error.message || '')) {
          setErrorMessage('Login was interrupted by another open session. Close duplicate tabs and try again.')
          return
        }

        setErrorMessage(result.error.message)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (/Lock broken by another request/i.test(message) || /AbortError/i.test(message)) {
        setErrorMessage('Login was interrupted by another open session. Close duplicate tabs and try again.')
      } else {
        setErrorMessage(message)
      }
    } finally {
      setIsLoggingIn(false)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  async function verifyToken() {
    setErrorMessage('')
    setScanResult(null)

    if (!scanToken.trim()) {
      return
    }

    const { data, error } = await supabase
      .from('bookings')
      .select('id, applicant_name, appointment_at, checked_in_at, payment_status, amount, qr_token')
      .eq('qr_token', scanToken.trim())
      .maybeSingle()

    if (error) {
      setErrorMessage(error.message)
      return
    }

    setScanResult(data)
  }

  async function markCheckedIn() {
    if (!scanResult) {
      return
    }

    const { data, error } = await supabase
      .from('bookings')
      .update({ checked_in_at: new Date().toISOString() })
      .eq('id', scanResult.id)
      .select('id, applicant_name, appointment_at, checked_in_at, payment_status, amount, qr_token')
      .single()

    if (error) {
      setErrorMessage(error.message)
      return
    }

    setScanResult(data)
    await loadBookings()
  }

  if (loading) {
    return (
      <section className="panel">
        <h2>Admin Portal</h2>
        <p>Loading...</p>
      </section>
    )
  }

  if (!session) {
    return (
      <section className="panel">
        <h2>Admin Login</h2>
        <p>Sign in to view all appointment bookings.</p>

        {errorMessage && <p className="error-text">{errorMessage}</p>}

        <form className="admin-login" onSubmit={login}>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>

          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>

          <button type="submit" disabled={isLoggingIn}>{isLoggingIn ? 'Logging in...' : 'Login'}</button>
        </form>
      </section>
    )
  }

  if (!isAdmin) {
    return (
      <section className="panel">
        <h2>Admin Portal</h2>
        <p className="error-text">{errorMessage || 'Not authorized.'}</p>
        <button onClick={logout}>Sign Out</button>
      </section>
    )
  }

  return (
    <section className="panel admin-page">
      <div className="header-row admin-header-row">
        <h2>Admin Dashboard</h2>
        <button className="secondary" onClick={logout}>Logout</button>
      </div>

      {errorMessage && <p className="error-text">{errorMessage}</p>}

      <div className="scan-box">
        <h3>Entry Gate Verification</h3>
        <p>Paste or scan the QR token to validate the booking at entry.</p>
        <div className="scan-row">
          <input
            placeholder="QR token"
            value={scanToken}
            onChange={(event) => setScanToken(event.target.value)}
          />
          <button onClick={verifyToken}>Verify</button>
        </div>

        {scanResult && (
          <div className="scan-result">
            <p><strong>Booking:</strong> {scanResult.id}</p>
            <p><strong>Name:</strong> {scanResult.applicant_name}</p>
            <p><strong>Appointment:</strong> {new Date(scanResult.appointment_at).toLocaleString()}</p>
            <p><strong>Payment:</strong> {scanResult.payment_status}</p>
            <p><strong>Checked In:</strong> {scanResult.checked_in_at ? new Date(scanResult.checked_in_at).toLocaleString() : 'No'}</p>

            {!scanResult.checked_in_at && (
              <button onClick={markCheckedIn}>Mark Entry Completed</button>
            )}
          </div>
        )}
      </div>

      <h3>All Bookings ({filteredBookings.length})</h3>
      
      <div className="filters-bar admin-filters-grid">
        <input
          type="text"
          placeholder="Search by name, email, vehicle, phone, ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input admin-search-input"
        />

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="checked-in">Checked In</option>
          <option value="pending">Pending</option>
        </select>

        <select value={filterWasteType} onChange={(e) => setFilterWasteType(e.target.value)}>
          <option value="all">All Waste Types</option>
          {wasteTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="appointment">By Appointment Date</option>
          <option value="amount-high">Amount (High to Low)</option>
          <option value="amount-low">Amount (Low to High)</option>
        </select>
      </div>

      <div className="table-wrap admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Vehicle</th>
              <th>Waste Type</th>
              <th>Weight (t)</th>
              <th>Amount</th>
              <th>Appointment</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map((booking) => (
              <tr key={booking.id} className={booking.cancelled_at ? 'cancelled-row' : ''}>
                <td data-label="ID">{booking.id}</td>
                <td data-label="Name">{booking.applicant_name}</td>
                <td data-label="Email">{booking.email}</td>
                <td data-label="Vehicle">{booking.vehicle_number}</td>
                <td data-label="Waste Type">{booking.waste_type}</td>
                <td data-label="Weight (t)">{booking.estimated_weight_tons}</td>
                <td data-label="Amount">₹{Number(booking.amount).toFixed(2)}</td>
                <td data-label="Appointment">{new Date(booking.appointment_at).toLocaleString()}</td>
                <td data-label="Status">
                  {booking.cancelled_at ? (
                    <span className="status-badge cancelled">✗ Cancelled</span>
                  ) : booking.checked_in_at ? (
                    <span className="status-badge checked-in">✓ Checked In</span>
                  ) : (
                    <span className="status-badge pending">⏱ Pending</span>
                  )}
                </td>
                <td data-label="Action">
                  {!booking.cancelled_at && !booking.checked_in_at && (
                    <button 
                      className="btn-cancel small" 
                      onClick={() => cancelBooking(booking.id)}
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredBookings.length === 0 && (
              <tr>
                <td colSpan="10">No bookings match your filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
