import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

const CHART_COLORS = [
  "#0891b2",
  "#0f766e",
  "#f59e0b",
  "#ef4444",
  "#6366f1",
  "#14b8a6",
];

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function shortenLabel(value, maxLength = 16) {
  if (!value) return "Unknown";
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
      {label && (
        <p className="mb-2 text-sm font-semibold text-slate-900">{label}</p>
      )}
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm text-slate-600">
          <span className="font-medium" style={{ color: entry.color }}>
            {entry.name}:
          </span>{" "}
          {typeof entry.value === "number" &&
          entry.name.toLowerCase().includes("revenue")
            ? currencyFormatter.format(entry.value)
            : entry.value}
        </p>
      ))}
    </div>
  );
}

export default function StatisticsPage() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    totalWeight: 0,
    avgWeight: 0,
    checkedInCount: 0,
    pendingCount: 0,
  });
  const [wasteTypeStats, setWasteTypeStats] = useState([]);
  const [vehicleSizeStats, setVehicleSizeStats] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdminAndLoad() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        setErrorMessage("Please log in as an admin.");
        setLoading(false);
        return;
      }

      const { data: adminRow } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!adminRow) {
        setErrorMessage("You are not authorized to view statistics.");
        setLoading(false);
        return;
      }

      setIsAdmin(true);
      await loadStatistics();
      setLoading(false);
    }

    checkAdminAndLoad();
  }, []);

  async function loadStatistics() {
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("*");

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (!bookings || bookings.length === 0) {
      setWasteTypeStats([]);
      setVehicleSizeStats([]);
      setMonthlyTrend([]);
      setStatusDistribution([]);
      return;
    }

    // Overall stats
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.amount), 0);
    const totalWeight = bookings.reduce(
      (sum, b) => sum + Number(b.estimated_weight_tons),
      0,
    );
    const checkedInCount = bookings.filter((b) => b.checked_in_at).length;
    const pendingCount = bookings.filter(
      (b) => !b.checked_in_at && !b.cancelled_at,
    ).length;
    const cancelledCount = bookings.filter((b) => b.cancelled_at).length;

    setStats({
      totalBookings,
      totalRevenue,
      totalWeight,
      avgWeight: totalWeight / totalBookings,
      checkedInCount,
      pendingCount,
    });

    // Waste type breakdown
    const wasteTypeMap = {};
    bookings.forEach((b) => {
      if (!wasteTypeMap[b.waste_type]) {
        wasteTypeMap[b.waste_type] = { count: 0, weight: 0, revenue: 0 };
      }
      wasteTypeMap[b.waste_type].count++;
      wasteTypeMap[b.waste_type].weight += Number(b.estimated_weight_tons);
      wasteTypeMap[b.waste_type].revenue += Number(b.amount);
    });

    const wasteTypeArray = Object.entries(wasteTypeMap)
      .map(([type, data]) => ({
        type,
        ...data,
      }))
      .sort((a, b) => b.weight - a.weight);

    setWasteTypeStats(wasteTypeArray);

    // Vehicle size breakdown
    const vehicleSizeMap = {};
    bookings.forEach((b) => {
      if (!vehicleSizeMap[b.vehicle_size]) {
        vehicleSizeMap[b.vehicle_size] = { count: 0, weight: 0, revenue: 0 };
      }
      vehicleSizeMap[b.vehicle_size].count++;
      vehicleSizeMap[b.vehicle_size].weight += Number(b.estimated_weight_tons);
      vehicleSizeMap[b.vehicle_size].revenue += Number(b.amount);
    });

    const vehicleSizeArray = Object.entries(vehicleSizeMap)
      .map(([size, data]) => ({
        size,
        ...data,
      }))
      .sort((a, b) => b.count - a.count);

    setVehicleSizeStats(vehicleSizeArray);

    // Monthly trend
    const monthlyMap = {};
    bookings.forEach((booking) => {
      const sourceDate = booking.appointment_at || booking.created_at;
      if (!sourceDate) return;

      const date = new Date(sourceDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          month: date.toLocaleString("en-IN", {
            month: "short",
            year: "2-digit",
          }),
          bookings: 0,
          revenue: 0,
        };
      }

      monthlyMap[key].bookings += 1;
      monthlyMap[key].revenue += Number(booking.amount);
    });

    setMonthlyTrend(
      Object.entries(monthlyMap)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([, value]) => value),
    );

    setStatusDistribution(
      [
        { name: "Checked In", value: checkedInCount },
        { name: "Pending", value: pendingCount },
        { name: "Cancelled", value: cancelledCount },
      ].filter((item) => item.value > 0),
    );
  }

  if (loading) {
    return (
      <section className="panel">
        <h2>Statistics Dashboard</h2>
        <p>Loading statistics...</p>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="panel">
        <h2>Statistics Dashboard</h2>
        <p className="error-text">{errorMessage || "Not authorized."}</p>
      </section>
    );
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
          <p className="stat-value stat-value-currency">
            ₹{stats.totalRevenue.toFixed(2)}
          </p>
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Booking Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={3}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Monthly Booking Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis allowDecimals={false} stroke="#64748b" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="bookings"
                    stroke="#0891b2"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Bookings"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Waste Type by Weight</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={wasteTypeStats.slice(0, 6)}
                  layout="vertical"
                  margin={{ left: 16, right: 16 }}
                >
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#64748b" />
                  <YAxis
                    type="category"
                    dataKey="type"
                    width={120}
                    stroke="#64748b"
                    tickFormatter={(value) => shortenLabel(value, 14)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="weight"
                    fill="#0f766e"
                    radius={[0, 6, 6, 0]}
                    name="Weight (tons)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Revenue by Vehicle Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={vehicleSizeStats}
                  margin={{ left: 12, right: 12 }}
                >
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="size"
                    stroke="#64748b"
                    tickFormatter={(value) => shortenLabel(value, 12)}
                  />
                  <YAxis
                    stroke="#64748b"
                    tickFormatter={(value) => currencyFormatter.format(value)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="revenue"
                    fill="#f59e0b"
                    radius={[6, 6, 0, 0]}
                    name="Revenue"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
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
                <td data-label="Total Weight (tons)">
                  {item.weight.toFixed(2)}
                </td>
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
                <td data-label="Total Weight (tons)">
                  {item.weight.toFixed(2)}
                </td>
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
  );
}
