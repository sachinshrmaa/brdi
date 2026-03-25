import { useEffect, useMemo, useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { supabase } from "../lib/supabase";

const VEHICLE_SIZES = {
  "Small Pickup (1 ton)": 1,
  "Large Pickup (2 tons)": 2,
  "Small Truck (5 tons)": 5,
  "Medium Truck (10 tons)": 10,
  "Large Truck (20 tons)": 20,
  "Trailer (30+ tons)": 30,
};

const WASTE_TYPES = [
  "Concrete Dominant Material",
  "Brick-Concrete Mixed Material",
  "Brick Dominant Material",
  "Other Inert Mineral Material",
  "Reinforced Concrete",
  "Non-Reinforced Concrete",
  "Brick Masonry Debris",
  "Cement Mortar Debris",
  "Concrete Blocks",
  "Stone Rubble",
  "Precast Concrete Elements",
  "Ceramic and Cement-Based Tiles",
  "Sand-Cement Plaster Debris",
  "Inert Excavation Debris",
];

const initialForm = {
  phone: "",
  address: "",
  vehicle_number: "",
  driver_name: "",
  driver_license: "",
  waste_type: "",
  vehicle_size: "",
  appointment_date: "",
  appointment_time: "",
};

function calculateAmount(vehicleSize) {
  const tons = Number(vehicleSize || 0);
  const minimumCharge = 500;
  const handlingFee = 200;
  const perTonRate = 350;
  const computed = handlingFee + tons * perTonRate;
  return Math.max(minimumCharge, Number(computed.toFixed(2)));
}

export default function BookingPage() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [stage, setStage] = useState("auth");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [bookingResult, setBookingResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const pdfRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const activeSession = data.session;
      setUser(activeSession?.user || null);
      setStage(activeSession ? "form" : "auth");
      setLoading(false);
    }

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setUser(session?.user || null);
        setStage(session ? "form" : "auth");
      },
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const selectedVehicleTons = useMemo(() => {
    return VEHICLE_SIZES[formData.vehicle_size] || 0;
  }, [formData.vehicle_size]);

  const amount = useMemo(
    () => calculateAmount(selectedVehicleTons),
    [selectedVehicleTons],
  );

  const currentStageIndex =
    stage === "payment" ? 2 : stage === "success" ? 3 : 1;
  const stageItems = [
    { key: "form", label: "Booking Details" },
    { key: "payment", label: "Payment Review" },
    { key: "success", label: "Confirmation" },
  ];
  const appointmentPreview =
    formData.appointment_date && formData.appointment_time
      ? `${formData.appointment_date} at ${formData.appointment_time}`
      : "Not selected";

  function onChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function signInWithGoogle() {
    setErrorMessage("");
    let redirectTo = `${window.location.origin}/book`;

    // In production, use the env variable which should have the full URL with /book path
    if (import.meta.env.VITE_OAUTH_REDIRECT_URL) {
      redirectTo = import.meta.env.VITE_OAUTH_REDIRECT_URL.endsWith("/book")
        ? import.meta.env.VITE_OAUTH_REDIRECT_URL
        : import.meta.env.VITE_OAUTH_REDIRECT_URL + "/book";
    }

    console.log("OAuth redirect URL:", redirectTo);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      setErrorMessage(error.message);
    }
  }

  async function downloadBookingPDF() {
    if (!pdfRef.current) return;

    try {
      // Temporarily show hidden element so html2canvas can capture it
      const originalDisplay = pdfRef.current.style.display;
      pdfRef.current.style.display = "block";

      // Wait for DOM to fully render
      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        allowTaint: true,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      // Hide element again
      pdfRef.current.style.display = originalDisplay;

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
      pdf.save(`BRDI-Booking-${bookingResult.id}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      setErrorMessage("Failed to generate PDF. Please try again.");
    }
  }

  function onReview(event) {
    event.preventDefault();
    setErrorMessage("");
    setStage("payment");
  }

  async function onConfirmPayment() {
    if (!user) {
      setErrorMessage("You must be signed in to complete booking.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    const qrToken = crypto.randomUUID();

    const payload = {
      user_id: user.id,
      applicant_name:
        user.user_metadata?.full_name || user.email?.split("@")[0] || "Unknown",
      email: user.email,
      phone: formData.phone,
      address: formData.address,
      vehicle_number: formData.vehicle_number,
      driver_name: formData.driver_name,
      driver_license: formData.driver_license || null,
      waste_type: formData.waste_type,
      vehicle_size: formData.vehicle_size,
      estimated_weight_tons: selectedVehicleTons,
      appointment_at: `${formData.appointment_date}T${formData.appointment_time}:00`,
      amount,
      payment_status: "paid",
      qr_token: qrToken,
    };

    const { data, error } = await supabase
      .from("bookings")
      .insert(payload)
      .select(
        "id, applicant_name, appointment_at, amount, qr_token, created_at",
      )
      .single();

    if (error) {
      setIsSubmitting(false);
      setErrorMessage(error.message);
      return;
    }

    setBookingResult(data);
    setStage("success");
    setIsSubmitting(false);
  }

  if (loading) {
    return (
      <section className="panel">
        <p>Loading...</p>
      </section>
    );
  }

  if (stage === "success" && bookingResult) {
    return (
      <section className="panel success-panel">
        {/* Hidden PDF content */}
        <div
          ref={pdfRef}
          style={{
            display: "none",
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
              style={{ margin: "0 0 4px", fontSize: "13px", color: "#475569" }}
            >
              Gangtok, Sikkim - 737101
            </p>
            <p
              style={{ margin: "0 0 14px", fontSize: "13px", color: "#475569" }}
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
              <strong>Booking ID:</strong> {bookingResult.id}
            </p>
            <p>
              <strong>Name:</strong> {bookingResult.applicant_name}
            </p>
            <p>
              <strong>Email:</strong> {user?.email}
            </p>
            <p>
              <strong>Appointment:</strong>{" "}
              {new Date(bookingResult.appointment_at).toLocaleString()}
            </p>
            <p>
              <strong>Amount Paid:</strong> ₹
              {Number(bookingResult.amount).toFixed(2)}
            </p>
          </div>

          <div
            style={{
              textAlign: "center",
              marginTop: "20px",
              marginBottom: "20px",
            }}
          >
            <p style={{ fontSize: "12px", marginBottom: "10px" }}>
              QR Code for Entry Gate
            </p>
            <QRCodeSVG
              value={bookingResult.qr_token}
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

        {/* Visible content */}
        <h2>Booking Confirmed</h2>
        <p>
          <span className="status-badge pending">Pending Gate Check-In</span>
        </p>
        <p>
          Your waste drop-off appointment is confirmed. Present this QR code at
          the facility gate.
        </p>

        <div className="qr-wrap">
          <QRCodeSVG value={bookingResult.qr_token} size={220} includeMargin />
        </div>

        <div className="receipt-grid">
          <p>
            <strong>Booking ID:</strong> {bookingResult.id}
          </p>
          <p>
            <strong>Name:</strong> {bookingResult.applicant_name}
          </p>
          <p>
            <strong>Appointment:</strong>{" "}
            {new Date(bookingResult.appointment_at).toLocaleString()}
          </p>
          <p>
            <strong>Amount Paid:</strong> ₹
            {Number(bookingResult.amount).toFixed(2)}
          </p>
          <p>
            <strong>QR Token:</strong> {bookingResult.qr_token}
          </p>
        </div>

        <div className="button-row">
          <button onClick={downloadBookingPDF}>Download Receipt as PDF</button>
          <button
            className="secondary"
            onClick={() => {
              setStage("form");
              setFormData(initialForm);
              setBookingResult(null);
            }}
          >
            Create Another Booking
          </button>
        </div>
      </section>
    );
  }

  if (stage === "auth") {
    return (
      <section className="panel auth-panel">
        <h2>Sign In to Book Appointment</h2>
        <p>
          Please sign in with your Google account to schedule a waste drop-off
          appointment.
        </p>

        {errorMessage && <p className="error-text">{errorMessage}</p>}

        <button onClick={signInWithGoogle} className="google-btn">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
              fill="#4285F4"
            />
            <path
              d="M9.003 18c2.43 0 4.467-.806 5.956-2.184L12.05 13.56c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z"
              fill="#34A853"
            />
            <path
              d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9.001c0 1.452.348 2.827.957 4.041l3.007-2.332z"
              fill="#FBBC05"
            />
            <path
              d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.002 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>
      </section>
    );
  }

  return (
    <section className="panel booking-shell">
      <div className="header-row">
        <div>
          <h2>Construction Waste Booking</h2>
          <p className="muted-text">
            Signed in as <strong>{user?.email}</strong>
          </p>
        </div>
      </div>

      <div className="booking-progress" role="list" aria-label="Booking steps">
        {stageItems.map((item, index) => {
          const position = index + 1;
          const stateClass =
            position < currentStageIndex
              ? "done"
              : position === currentStageIndex
                ? "active"
                : "";

          return (
            <div
              key={item.key}
              className={`progress-step ${stateClass}`.trim()}
              role="listitem"
            >
              <small>Step {position}</small>
              <p>{item.label}</p>
            </div>
          );
        })}
      </div>

      {errorMessage && <p className="error-text">{errorMessage}</p>}

      <div className="booking-layout">
        <div className="booking-main">
          {stage === "form" && (
            <form className="booking-form" onSubmit={onReview}>
              <div className="booking-form-section full-width">
                <h3>Contact Details</h3>
                <div className="booking-form-grid">
                  <label>
                    Phone Number
                    <input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={onChange}
                      placeholder="+91 98765 43210"
                      required
                    />
                  </label>

                  <label className="full-width">
                    Address
                    <input
                      name="address"
                      value={formData.address}
                      onChange={onChange}
                      placeholder="Street address, city, state, pin"
                      required
                    />
                  </label>
                </div>
              </div>

              <div className="booking-form-section full-width">
                <h3>Vehicle and Driver</h3>
                <div className="booking-form-grid">
                  <label>
                    Vehicle Number
                    <input
                      name="vehicle_number"
                      value={formData.vehicle_number}
                      onChange={onChange}
                      placeholder="SK-01-AB-1234"
                      required
                    />
                  </label>

                  <label>
                    Vehicle Size
                    <select
                      name="vehicle_size"
                      value={formData.vehicle_size}
                      onChange={onChange}
                      required
                    >
                      <option value="">Select vehicle size</option>
                      {Object.keys(VEHICLE_SIZES).map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Driver Name
                    <input
                      name="driver_name"
                      value={formData.driver_name}
                      onChange={onChange}
                      required
                    />
                  </label>

                  <label>
                    Driver License Number (Optional)
                    <input
                      name="driver_license"
                      value={formData.driver_license}
                      onChange={onChange}
                      placeholder="DL123456"
                    />
                  </label>
                </div>
              </div>

              <div className="booking-form-section full-width">
                <h3>Waste and Appointment</h3>
                <div className="booking-form-grid">
                  <label className="full-width">
                    Waste Type
                    <select
                      name="waste_type"
                      value={formData.waste_type}
                      onChange={onChange}
                      required
                    >
                      <option value="">Select waste type</option>
                      {WASTE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Appointment Date
                    <input
                      type="date"
                      name="appointment_date"
                      value={formData.appointment_date}
                      onChange={onChange}
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </label>

                  <label>
                    Appointment Time
                    <input
                      type="time"
                      name="appointment_time"
                      value={formData.appointment_time}
                      onChange={onChange}
                      required
                    />
                  </label>
                </div>
              </div>

              <button type="submit" className="full-width">
                Continue to Payment Review
              </button>
            </form>
          )}

          {stage === "payment" && (
            <div className="payment-box">
              <h3>Confirm Payment and Booking</h3>
              <p className="muted-text">
                Review your details before confirming payment.
              </p>
              <div className="summary-details">
                <p>
                  <strong>Phone:</strong> {formData.phone}
                </p>
                <p>
                  <strong>Vehicle:</strong> {formData.vehicle_number} (
                  {formData.vehicle_size})
                </p>
                <p>
                  <strong>Estimated Load:</strong> {selectedVehicleTons} tons
                </p>
                <p>
                  <strong>Waste Type:</strong> {formData.waste_type}
                </p>
                <p>
                  <strong>Appointment:</strong> {appointmentPreview}
                </p>
              </div>
              <p className="price">Total: ₹{amount.toFixed(2)}</p>

              <div className="payment-actions">
                <button className="secondary" onClick={() => setStage("form")}>
                  Back to Edit Details
                </button>
                <button onClick={onConfirmPayment} disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : "Pay and Confirm"}
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="booking-aside" aria-label="Booking summary">
          <h4>Booking Summary</h4>
          <p>
            <strong>Applicant:</strong>{" "}
            {user?.user_metadata?.full_name || user?.email}
          </p>
          <p>
            <strong>Vehicle Size:</strong>{" "}
            {formData.vehicle_size || "Not selected"}
          </p>
          <p>
            <strong>Waste Type:</strong> {formData.waste_type || "Not selected"}
          </p>
          <p>
            <strong>Appointment:</strong> {appointmentPreview}
          </p>
          <p className="price">₹{amount.toFixed(2)}</p>
          <p className="muted-text">
            Final invoice and QR code will be generated right after successful
            payment.
          </p>
        </aside>
      </div>
    </section>
  );
}
