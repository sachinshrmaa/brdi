import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function StatisticsPage() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    totalWeight: 0,
    avgWeight: 0,
    checkedInCount: 0,
    pendingCount: 0,
  })
  const [wasteTypeStats, setWasteTypeStats] = useState([])
  const [vehicleSizeStats, setVehicleSizeStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function checkAdminAndLoad() {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user

      if (!user) {
        setErrorMessage('Please log in as an admin.')
        setLoading(false)
        return
      }

      const { data: adminRow } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!adminRow) {
        setErrorMessage('You are not authorized to view statistics.')
        setLoading(false)
        return
      }

      setIsAdmin(true)
      await loadStatistics()
      setLoading(false)
    }

    checkAdminAndLoad()
  }, [])

  async function loadStatistics() {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')

    if (error) {
      setErrorMessage(error.message)
      return
    }

    if (!bookings || bookings.length === 0) {
      return
    }

    // Overall stats
    const totalBookings = bookings.length
    const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.amount), 0)
    const totalWeight = bookings.reduce((sum, b) => sum + Number(b.estimated_weight_tons), 0)
    const checkedInCount = bookings.filter(b => b.checked_in_at).length
    const pendingCount = totalBookings - checkedInCount

    setStats({
      totalBookings,
      totalRevenue,
      totalWeight,
      avgWeight: totalWeight / totalBookings,
      checkedInCount,
      pendingCount,
    })

    // Waste type breakdown
    const wasteTypeMap = {}
    bookings.forEach(b => {
      if (!wasteTypeMap[b.waste_type]) {
        wasteTypeMap[b.waste_type] = { count: 0, weight: 0, revenue: 0 }
      }
      wasteTypeMap[b.waste_type].count++
      wasteTypeMap[b.waste_type].weight += Number(b.estimated_weight_tons)
      wasteTypeMap[b.waste_type].revenue += Number(b.amount)
    })

    const wasteTypeArray = Object.entries(wasteTypeMap).map(([type, data]) => ({
      type,
      ...data,
    })).sort((a, b) => b.weight - a.weight)

    setWasteTypeStats(wasteTypeArray)

    // Vehicle size breakdown
    const vehicleSizeMap = {}
    bookings.forEach(b => {
      if (!vehicleSizeMap[b.vehicle_size]) {
        vehicleSizeMap[b.vehicle_size] = { count: 0, weight: 0, revenue: 0 }
      }
      vehicleSizeMap[b.vehicle_size].count++
      vehicleSizeMap[b.vehicle_size].weight += Number(b.estimated_weight_tons)
      vehicleSizeMap[b.vehicle_size].revenue += Number(b.amount)
    })

    const vehicleSizeArray = Object.entries(vehicleSizeMap).map(([size, data]) => ({
      size,
      ...data,
    })).sort((a, b) => b.count - a.count)

    setVehicleSizeStats(vehicleSizeArray)
  }

  if (loading) {
    return (
      <section className="panel">
        <h2>Statistics Dashboard</h2>
        <p>Loading statistics...</p>
      </section>
    )
  }

  if (!isAdmin) {
    return (
      <section className="panel">
        <h2>Statistics Dashboard</h2>
        <p className="error-text">{errorMessage || 'Not authorized.'}</p>
      </section>
    )
  }

  return (
    <section className="panel stats-page">
      <h2>Statistics Dashboard</h2>
      <p>Overview of all waste drop-offs and revenue.</p>

      {errorMessage && <p className="error-text">{errorMessage}</p>}

      <div className="stats-grid stats-dashboard-grid">
        <div className="stat-card">
          <h3>Total Bookings</h3>
          <p className="stat-value">{stats.totalBookings}</p>
        </div>

        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p className="stat-value">₹{stats.totalRevenue.toFixed(2)}</p>
        </div>

        <div className="stat-card">
          <h3>Total Waste (tons)</h3>
          <p className="stat-value">{stats.totalWeight.toFixed(2)}</p>
        </div>

        <div className="stat-card">
          <h3>Avg Weight/Booking</h3>
          <p className="stat-value">{stats.avgWeight.toFixed(2)} tons</p>
        </div>

        <div className="stat-card">
          <h3>Checked In</h3>
          <p className="stat-value">{stats.checkedInCount}</p>
        </div>

        <div className="stat-card">
          <h3>Pending</h3>
          <p className="stat-value">{stats.pendingCount}</p>
        </div>
      </div>

      <h3>Waste Type Breakdown</h3>
      <div className="table-wrap stats-table-wrap">
        <table className="stats-table">
          <thead>
            <tr>
              <th>Waste Type</th>
              <th>Count</th>
              <th>Total Weight (tons)</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {wasteTypeStats.map((item) => (
              <tr key={item.type}>
                <td data-label="Waste Type">{item.type}</td>
                <td data-label="Count">{item.count}</td>
                <td data-label="Total Weight (tons)">{item.weight.toFixed(2)}</td>
                <td data-label="Revenue">₹{item.revenue.toFixed(2)}</td>
              </tr>
            ))}
            {wasteTypeStats.length === 0 && (
              <tr>
                <td colSpan="4">No data available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h3>Vehicle Size Breakdown</h3>
      <div className="table-wrap stats-table-wrap">
        <table className="stats-table">
          <thead>
            <tr>
              <th>Vehicle Size</th>
              <th>Count</th>
              <th>Total Weight (tons)</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {vehicleSizeStats.map((item) => (
              <tr key={item.size}>
                <td data-label="Vehicle Size">{item.size}</td>
                <td data-label="Count">{item.count}</td>
                <td data-label="Total Weight (tons)">{item.weight.toFixed(2)}</td>
                <td data-label="Revenue">₹{item.revenue.toFixed(2)}</td>
              </tr>
            ))}
            {vehicleSizeStats.length === 0 && (
              <tr>
                <td colSpan="4">No data available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
