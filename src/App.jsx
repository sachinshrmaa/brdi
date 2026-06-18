import {
  Navigate,
  Route,
  Routes,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import "./App.css";
import BookingPage from "./pages/BookingPage";
import AdminPage from "./pages/AdminPage";
import StatisticsPage from "./pages/StatisticsPage";
import UserDashboard from "./pages/UserDashboard";
import { supabase } from "./lib/supabase";
import { Button } from "./components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "./components/ui/navigation-menu";

const navLinkClasses = (active) => `nav-link ${active ? "is-active" : ""}`;

const BALKAPSO_URL = "https://balkapso.com";

/* ---------- Inline icons ---------- */
function Icon({ path, size = 24, fill = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {path}
    </svg>
  );
}

const icons = {
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>,
  qr: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3M21 14v.01M14 21h.01M21 21v-4M17 21h1" />
    </>
  ),
  receipt: (
    <>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </>
  ),
  recycle: (
    <>
      <path d="M7 19H5a2 2 0 0 1-1.7-3l1.3-2.2" />
      <path d="M12.5 4.5 14 7l3-1.7" />
      <path d="M9.8 8 7 3l-3 5 3 1" />
      <path d="m14 21 3-5 3 1-3-5-3 1" />
      <path d="M17 19h2a2 2 0 0 0 1.7-3l-1-1.7" />
      <path d="M9 21h5" />
    </>
  ),
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  scale: (
    <>
      <path d="M12 3v18M7 21h10" />
      <path d="m5 7 14-2" />
      <path d="M5 7 2 13a3 3 0 0 0 6 0L5 7zM19 5l-3 6a3 3 0 0 0 6 0l-3-6z" />
    </>
  ),
  truck: (
    <>
      <path d="M10 17h4V5H2v12h3" />
      <path d="M14 9h4l3 3v5h-3" />
      <circle cx="7.5" cy="17.5" r="2" />
      <circle cx="17.5" cy="17.5" r="2" />
    </>
  ),
  leaf: (
    <>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6" />
    </>
  ),
  check: <><path d="M20 6 9 17l-5-5" /></>,
  cross: <><path d="M18 6 6 18M6 6l12 12" /></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  pin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  phone: <><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8.1 9.5a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z" /></>,
};

const ACCEPTED = [
  "Concrete & reinforced concrete",
  "Brick masonry & mixed debris",
  "Cement mortar & sand-cement plaster",
  "Concrete blocks & precast elements",
  "Stone rubble & inert excavation debris",
  "Ceramic & cement-based tiles",
];

const REJECTED = [
  "Municipal & household waste",
  "Organic & food waste",
  "Hazardous & chemical materials",
  "Medical & biohazard waste",
];

function LandingPage() {
  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero reveal reveal-1">
        <span className="hero-orb one" aria-hidden="true" />
        <span className="hero-orb two" aria-hidden="true" />
        <span className="hero-eyebrow">
          <span className="dot" />
          C&amp;D Waste Facility · Gangtok, Sikkim
        </span>
        <h1>
          Construction waste, <br />
          <span className="grad">responsibly recycled.</span>
        </h1>
        <p className="hero-sub">
          BRDI makes it effortless to schedule construction &amp; demolition
          waste drop-offs. Book a slot, pay securely, and breeze through the gate
          with a single QR code — built for haulers, contractors, and cleaner
          cities.
        </p>
        <div className="hero-cta">
          <Link to="/book" className="btn-hero primary">
            Book an Appointment
            <Icon path={icons.arrow} size={20} />
          </Link>
          <a href="#how-it-works" className="btn-hero ghost">
            How it works
          </a>
        </div>
        <p className="hero-soon-note">
          <span className="soon-badge solid">Coming Soon</span>
          Online slot booking is launching shortly — reservations aren't open
          just yet.
        </p>

        <div className="hero-stats">
          <div className="hero-stat">
            <p className="num">6</p>
            <p className="lbl">Vehicle classes supported</p>
          </div>
          <div className="hero-stat">
            <p className="num">14+</p>
            <p className="lbl">Inert waste categories</p>
          </div>
          <div className="hero-stat">
            <p className="num">&lt;60s</p>
            <p className="lbl">From booking to QR pass</p>
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="how-it-works" className="reveal reveal-2">
        <div className="section-head">
          <span className="section-eyebrow">How it works</span>
          <h2>Three steps to a confirmed drop-off</h2>
          <p>
            No paperwork, no queues. The entire process happens online and is
            verified instantly at the gate.
          </p>
        </div>
        <div className="process-grid">
          <article className="process-card">
            <span className="process-num">1</span>
            <h3>Sign in &amp; submit details</h3>
            <p>
              Continue with Google, then add your vehicle, waste type, and a
              preferred appointment window in under a minute.
            </p>
          </article>
          <article className="process-card">
            <span className="process-num">2</span>
            <h3>Review &amp; pay securely</h3>
            <p>
              See a transparent price based on your load. Confirm payment to lock
              your slot — no hidden charges, ever.
            </p>
          </article>
          <article className="process-card">
            <span className="process-num">3</span>
            <h3>Show your QR at the gate</h3>
            <p>
              Download your receipt with a unique QR code. Staff scan it for
              instant verified entry to the facility.
            </p>
          </article>
        </div>
      </section>

      {/* Features */}
      <section className="reveal reveal-3">
        <div className="section-head">
          <span className="section-eyebrow">Why BRDI</span>
          <h2>A facility built for modern waste logistics</h2>
          <p>
            Engineered by the Balkapso Research &amp; Development Institute to
            divert inert construction waste from landfills.
          </p>
        </div>
        <div className="feature-grid">
          {[
            {
              icon: icons.qr,
              title: "Contactless QR entry",
              body: "Every booking generates a tamper-proof QR pass for fast, verified check-in at the gate.",
            },
            {
              icon: icons.scale,
              title: "Transparent, weight-based pricing",
              body: "Pricing scales with your vehicle's estimated load — see the exact amount before you pay.",
            },
            {
              icon: icons.recycle,
              title: "Genuine material recovery",
              body: "Accepted inert materials are processed and recycled instead of ending up in landfill.",
            },
            {
              icon: icons.clock,
              title: "Book around your schedule",
              body: "Pick a date and time that suits your operation. Manage everything from one dashboard.",
            },
            {
              icon: icons.receipt,
              title: "Instant digital receipts",
              body: "Download a professional PDF invoice with full booking details the moment you pay.",
            },
            {
              icon: icons.shield,
              title: "Secure & accountable",
              body: "Google authentication, audited bookings, and a full check-in trail for every drop-off.",
            },
          ].map((f) => (
            <article className="feature-card" key={f.title}>
              <span className="feature-icon">
                <Icon path={f.icon} size={24} />
              </span>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Materials */}
      <section className="reveal reveal-4">
        <div className="section-head">
          <span className="section-eyebrow">Acceptance policy</span>
          <h2>Know before you haul</h2>
          <p>
            We specialise in inert construction &amp; demolition debris. Please
            keep the following materials separate.
          </p>
        </div>
        <div className="materials-grid">
          <div className="material-panel accept">
            <h3>
              <span className="material-badge">
                <Icon path={icons.check} size={16} />
              </span>
              We accept
            </h3>
            <ul className="material-list">
              {ACCEPTED.map((m) => (
                <li key={m}>
                  <Icon path={icons.check} size={18} />
                  {m}
                </li>
              ))}
            </ul>
          </div>
          <div className="material-panel reject">
            <h3>
              <span className="material-badge">
                <Icon path={icons.cross} size={16} />
              </span>
              We do not accept
            </h3>
            <ul className="material-list">
              {REJECTED.map((m) => (
                <li key={m}>
                  <Icon path={icons.cross} size={18} />
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="cta-band reveal reveal-5">
        <span className="soon-badge solid" style={{ marginBottom: "1rem" }}>
          Coming Soon
        </span>
        <h2>Slot booking is almost here</h2>
        <p>
          We're putting the finishing touches on online reservations. Explore the
          process now — you'll be able to book your first drop-off very soon.
        </p>
        <div className="hero-cta" style={{ justifyContent: "center" }}>
          <a href="#how-it-works" className="btn-hero primary">
            See how it works
            <Icon path={icons.arrow} size={20} />
          </a>
        </div>
      </section>
    </div>
  );
}

function SiteFooter({ showAdminLink }) {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-brand">
          <div className="footer-logo-row">
            <img src="/balkapso-logo.jpg" alt="BRDI logo" />
            <strong style={{ fontSize: "1.05rem" }}>BRDI</strong>
          </div>
          <h3>Balkapso Research &amp; Development Institute</h3>
          <p>
            Construction &amp; demolition waste management and recycling —
            diverting inert debris from landfills across Sikkim.
          </p>
          <a
            href={BALKAPSO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-site-link"
          >
            Visit balkapso.com
            <Icon path={icons.arrow} size={15} />
          </a>
        </div>

        <div className="footer-col">
          <h4>Navigate</h4>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/book">Book Appointment</Link>
            </li>
            <li>
              <Link to="/my-bookings">My Bookings</Link>
            </li>
            <li>
              <a href={BALKAPSO_URL} target="_blank" rel="noopener noreferrer">
                Balkapso.com ↗
              </a>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Get in touch</h4>
          <ul>
            <li>
              <span style={{ display: "inline-flex", gap: ".5rem", alignItems: "flex-start" }}>
                <Icon path={icons.pin} size={16} /> Gangtok, Sikkim — 737101
              </span>
            </li>
            <li>
              <a href="mailto:contact@balkapso.com" style={{ display: "inline-flex", gap: ".5rem", alignItems: "center" }}>
                <Icon path={icons.mail} size={16} /> contact@balkapso.com
              </a>
            </li>
            <li>
              <a href="tel:+917076219337" style={{ display: "inline-flex", gap: ".5rem", alignItems: "center" }}>
                <Icon path={icons.phone} size={16} /> +91 70762 19337
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {year} Balkapso Research &amp; Development Institute. All rights reserved.</span>
        {showAdminLink && (
          <Link to="/admin-login" className="footer-admin-link" aria-label="Admin access">
            Admin Portal
          </Link>
        )}
      </div>
    </footer>
  );
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (isMounted) {
          setSession(data.session);
        }
      })
      .catch((err) => {
        console.error("Session check error:", err);
        if (isMounted) {
          setSession(null);
        }
      });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (isMounted) {
          setSession(newSession);
        }
      },
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Resolve admin role for RBAC navigation.
  useEffect(() => {
    let active = true;

    async function resolveRole() {
      if (!session?.user) {
        if (active) setIsAdmin(false);
        return;
      }

      const { data } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (active) setIsAdmin(!!data);
    }

    resolveRole();
    return () => {
      active = false;
    };
  }, [session]);

  const role = isAdmin ? "admin" : session ? "user" : "guest";

  async function handleSignOut() {
    await supabase.auth.signOut();
    setIsAdmin(false);
    navigate("/");
  }

  return (
    <>
      {role !== "admin" && (
        <div className="announce-bar">
          <span className="soon-badge solid">Coming Soon</span>
          <span>
            Online slot booking is launching shortly — reservations aren't open
            for the public yet.
          </span>
        </div>
      )}
      <header className="global-navbar">
        <div className="global-navbar-inner">
          <Link to="/" className="brand-link">
            <Avatar className="brand-avatar h-11 w-11">
              <AvatarImage
                src="/balkapso-logo.jpg"
                alt="BRDI logo"
                className="h-full w-full object-cover"
              />
              <AvatarFallback className="text-xs font-semibold text-cyan-700">
                BRDI
              </AvatarFallback>
            </Avatar>
            <span className="brand-title">BRDI</span>
          </Link>

          <div className="desktop-nav">
            <NavigationMenu className="primary-nav-shell">
              <NavigationMenuList className="primary-nav-list">
                {role === "admin" ? (
                  <>
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/admin"
                          className={navLinkClasses(
                            location.pathname === "/admin",
                          )}
                        >
                          Bookings
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/admin/statistics"
                          className={navLinkClasses(
                            location.pathname === "/admin/statistics",
                          )}
                        >
                          Statistics
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  </>
                ) : role === "user" ? (
                  <>
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/"
                          className={navLinkClasses(location.pathname === "/")}
                        >
                          Home
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/book"
                          className={navLinkClasses(
                            location.pathname === "/book",
                          )}
                        >
                          Book Appointment
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/my-bookings"
                          className={navLinkClasses(
                            location.pathname === "/my-bookings",
                          )}
                        >
                          My Bookings
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  </>
                ) : (
                  <>
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/"
                          className={navLinkClasses(location.pathname === "/")}
                        >
                          Home
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <a
                          href={BALKAPSO_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="nav-link"
                        >
                          Balkapso.com ↗
                        </a>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  </>
                )}
              </NavigationMenuList>
            </NavigationMenu>

            {role === "guest" ? (
              <span className="nav-cta-group">
                <span className="soon-badge">Soon</span>
                <Button asChild size="sm" className="nav-cta-btn">
                  <Link to="/book">Get Started</Link>
                </Button>
              </span>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="nav-signout-btn"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            )}
          </div>

          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M4 4l14 14M18 4L4 18" />
              </svg>
            ) : (
              <svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M3 7h16M3 11h16M3 15h16" />
              </svg>
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="mobile-nav-panel">
            {role === "admin" ? (
              <>
                <Link
                  to="/admin"
                  className={
                    navLinkClasses(location.pathname === "/admin") +
                    " mobile-nav-link"
                  }
                >
                  Bookings
                </Link>
                <Link
                  to="/admin/statistics"
                  className={
                    navLinkClasses(location.pathname === "/admin/statistics") +
                    " mobile-nav-link"
                  }
                >
                  Statistics
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="mobile-signout-btn"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </>
            ) : role === "user" ? (
              <>
                <Link
                  to="/"
                  className={
                    navLinkClasses(location.pathname === "/") + " mobile-nav-link"
                  }
                >
                  Home
                </Link>
                <Link
                  to="/book"
                  className={
                    navLinkClasses(location.pathname === "/book") +
                    " mobile-nav-link"
                  }
                >
                  Book Appointment
                </Link>
                <Link
                  to="/my-bookings"
                  className={
                    navLinkClasses(location.pathname === "/my-bookings") +
                    " mobile-nav-link"
                  }
                >
                  My Bookings
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="mobile-signout-btn"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  className={
                    navLinkClasses(location.pathname === "/") + " mobile-nav-link"
                  }
                >
                  Home
                </Link>
                <a
                  href={BALKAPSO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-link mobile-nav-link"
                >
                  Balkapso.com ↗
                </a>
                <Button asChild size="sm" className="nav-cta-btn mobile-nav-link">
                  <Link to="/book">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        )}
      </header>

      <div className="app-shell mx-auto flex min-h-screen w-full max-w-7xl flex-col">
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/book" element={<BookingPage />} />
            <Route path="/my-bookings" element={<UserDashboard />} />
            <Route path="/admin-login" element={<AdminPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/statistics" element={<StatisticsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        <SiteFooter showAdminLink={role !== "admin"} />
      </div>
    </>
  );
}

export default App;
