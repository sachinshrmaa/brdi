import { useEffect, useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { supabase } from "../lib/supabase";

export default function UserDashboard() {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadUserBookings() {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData.session?.user;

      if (!currentUser) {
        setErrorMessage("Please sign in to view your bookings.");
        setLoading(false);
        return;
      }

      setUser(currentUser);

      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setBookings(data || []);
      }
      setLoading(false);
    }

    loadUserBookings();
  }, []);

  async function downloadPDF(booking) {
    const pdfContent = document.getElementById(`pdf-content-${booking.id}`);
    if (!pdfContent) return;

    try {
      // Temporarily show hidden element so html2canvas can capture it
      const originalDisplay = pdfContent.style.display;
      pdfContent.style.display = "block";

      // Wait for DOM to fully render
      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        allowTaint: true,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      // Hide element again
      pdfContent.style.display = originalDisplay;

      // Validate canvas dimensions
      if (
        !canvas.width ||
        !canvas.height ||
        canvas.width <= 0 ||
        canvas.height <= 0
      ) {
        console.error("Canvas dimensions:", {
          width: canvas.width,
          height: canvas.height,
        });
        throw new Error("Invalid canvas dimensions");
      }

      // Use JPEG instead of PNG for better compatibility
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF("p", "mm", "a4");

      // A4 page: 210mm x 297mm, with 10mm margins = 190mm x 277mm usable
      const maxWidth = 190;
      const maxHeight = 277;

      // Calculate aspect ratio and fit to page
      const aspectRatio = canvas.width / canvas.height;
      let imgWidth = maxWidth;
      let imgHeight = maxWidth / aspectRatio;

      // If height exceeds max, scale down width too
      if (imgHeight > maxHeight) {
        imgHeight = maxHeight;
        imgWidth = maxHeight * aspectRatio;
      }

      // Final validation
      if (
        !Number.isFinite(imgWidth) ||
        !Number.isFinite(imgHeight) ||
        imgWidth <= 0 ||
        imgHeight <= 0
      ) {
        throw new Error(
          `Invalid calculated dimensions: ${imgWidth}x${imgHeight}`,
        );
      }

      pdf.addImage(imgData, "JPEG", 10, 10, imgWidth, imgHeight);
      pdf.save(`BRDI-Booking-${booking.id}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      setErrorMessage("Failed to generate PDF. Please try again.");
    }
  }

  async function cancelBooking(bookingId) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking? This action cannot be undone.",
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("bookings")
        .update({ cancelled_at: new Date().toISOString() })
        .eq("id", bookingId);

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      // Reload bookings
      const { data, error: fetchError } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        setErrorMessage(fetchError.message);
      } else {
        setBookings(data || []);
        setErrorMessage("");
      }
    } catch (err) {
      setErrorMessage("Failed to cancel booking. Please try again.");
    }
  }

  if (loading) {
    return (
      <section className="panel">
        <p>Loading your bookings...</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="panel">
        <h2>My Bookings</h2>
        <p className="error-text">{errorMessage}</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="header-row">
        <div>
          <h2>My Bookings</h2>
          <p>
            Signed in as <strong>{user.email}</strong>
          </p>
        </div>
      </div>

      {errorMessage && <p className="error-text">{errorMessage}</p>}

      {bookings.length === 0 ? (
        <p>
          You don't have any bookings yet.{" "}
          <a href="/">Create your first booking</a>
        </p>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => (
            <div key={booking.id} className="booking-card">
              {/* Hidden PDF content */}
              <div id={`pdf-content-${booking.id}`} style={{ display: "none" }}>
                <div
                  style={{
                    padding: "20px",
                    background: "#fff",
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      borderBottom: "1px solid #dbe4ee",
                      paddingBottom: "16px",
                      marginBottom: "20px",
                    }}
                  >
                    <img
                      src="/balkapso-logo.jpg"
                      alt="Balkapso logo"
                      style={{
                        height: "64px",
                        width: "auto",
                        objectFit: "contain",
                        marginBottom: "12px",
                      }}
                    />
                    <h1
                      style={{
                        fontSize: "20px",
                        margin: "0 0 6px",
                        color: "#0f172a",
                      }}
                    >
                      Balkapso Research and Development Institute
                    </h1>
                    <p
                      style={{
                        margin: "0 0 4px",
                        fontSize: "13px",
                        color: "#475569",
                      }}
                    >
                      Gangtok, Sikkim - 737101
                    </p>
                    <p
                      style={{
                        margin: "0 0 14px",
                        fontSize: "13px",
                        color: "#475569",
                      }}
                    >
                      contact@balkapso.com - +917076219337
                    </p>
                    <h2
                      style={{
                        textAlign: "center",
                        fontSize: "16px",
                        margin: 0,
                      }}
                    >
                      Waste Drop-Off Booking Receipt
                    </h2>
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <p>
                      <strong>Booking ID:</strong> {booking.id}
                    </p>
                    <p>
                      <strong>Name:</strong> {booking.applicant_name}
                    </p>
                    <p>
                      <strong>Email:</strong> {booking.email}
                    </p>
                    <p>
                      <strong>Phone:</strong> {booking.phone}
                    </p>
                    <p>
                      <strong>Address:</strong> {booking.address}
                    </p>
                    <p>
                      <strong>Vehicle:</strong> {booking.vehicle_number}
                    </p>
                    <p>
                      <strong>Driver:</strong> {booking.driver_name}
                    </p>
                    <p>
                      <strong>Waste Type:</strong> {booking.waste_type}
                    </p>
                    <p>
                      <strong>Vehicle Size:</strong> {booking.vehicle_size}
                    </p>
                    <p>
                      <strong>Estimated Weight:</strong>{" "}
                      {booking.estimated_weight_tons} tons
                    </p>
                    <p>
                      <strong>Appointment:</strong>{" "}
                      {new Date(booking.appointment_at).toLocaleString()}
                    </p>
                    <p>
                      <strong>Amount Paid:</strong> ₹
                      {Number(booking.amount).toFixed(2)}
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      {booking.checked_in_at ? "Checked In" : "Pending"}
                    </p>
                  </div>

                  <div style={{ textAlign: "center", marginTop: "20px" }}>
                    <p style={{ fontSize: "12px", marginBottom: "10px" }}>
                      QR Code for Entry Gate
                    </p>
                    <QRCodeSVG
                      value={booking.qr_token}
                      size={150}
                      includeMargin
                    />
                  </div>

                  <div
                    style={{
                      textAlign: "center",
                      marginTop: "20px",
                      fontSize: "10px",
                      color: "#666",
                    }}
                  >
                    <p>Present this QR code at the facility gate for entry.</p>
                    <p>Generated: {new Date().toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Visible card */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                  gap: "1rem",
                }}
              >
                <div>
                  <h3>Booking #{booking.id}</h3>
                  <p>
                    <strong>Status:</strong>{" "}
                    {booking.cancelled_at ? (
                      <span className="status-badge cancelled">
                        ✗ Cancelled
                      </span>
                    ) : booking.checked_in_at ? (
                      <span className="status-badge checked-in">
                        ✓ Checked In
                      </span>
                    ) : (
                      <span className="status-badge pending">⏱ Pending</span>
                    )}
                  </p>
                  <p>
                    <strong>Appointment:</strong>{" "}
                    {new Date(booking.appointment_at).toLocaleString()}
                  </p>
                  <p>
                    <strong>Waste Type:</strong> {booking.waste_type}
                  </p>
                  <p>
                    <strong>Load:</strong> {booking.estimated_weight_tons} tons
                    ({booking.vehicle_size})
                  </p>
                  <p>
                    <strong>Amount:</strong> ₹
                    {Number(booking.amount).toFixed(2)}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  {!booking.cancelled_at && (
                    <div className="qr-small">
                      <QRCodeSVG value={booking.qr_token} size={100} />
                    </div>
                  )}
                  <button
                    onClick={() => downloadPDF(booking)}
                    className="secondary small"
                    disabled={booking.cancelled_at}
                  >
                    Download PDF
                  </button>
                  {!booking.cancelled_at && !booking.checked_in_at && (
                    <button
                      onClick={() => cancelBooking(booking.id)}
                      className="btn-cancel small"
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
