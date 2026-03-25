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
import { Card, CardContent, CardTitle } from "./components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar";
import { Separator } from "./components/ui/separator";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "./components/ui/navigation-menu";

const navLinkClasses = (active) => `nav-link ${active ? "is-active" : ""}`;

function LandingPage() {
  return (
    <Card className="mx-auto w-full max-w-4xl rounded-3xl sm:p-4">
      <CardContent className="p-6 sm:p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            BRDI
          </h1>
          <p className="mt-3 text-base font-semibold uppercase tracking-[0.2em] text-cyan-700 sm:text-lg">
            Construction Waste Management &amp; Recycling
          </p>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Schedule your waste drop-off appointment today
          </p>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              Step 1
            </p>
            <h3 className="mt-1 text-base font-bold text-slate-900">
              Sign in and submit details
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Use Google sign-in and complete vehicle, waste, and appointment
              details.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              Step 2
            </p>
            <h3 className="mt-1 text-base font-bold text-slate-900">
              Confirm payment
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Review booking summary and complete payment to lock your slot.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              Step 3
            </p>
            <h3 className="mt-1 text-base font-bold text-slate-900">
              Show invoice QR at gate
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Download your receipt and present the generated QR at entry.
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Button asChild size="lg" className="rounded-xl px-6">
            <Link to="/book">Book an Appointment</Link>
          </Button>
        </div>

        <Card className="mt-10 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none">
          <CardContent className="p-5 text-sm text-slate-700 sm:text-base">
            <CardTitle className="text-xl">About BRDI</CardTitle>
            <p className="mt-3">
              We accept: Concrete, Brick masonry debris, Cement mortar, Concrete
              blocks, Stone rubble, Precast elements, Ceramic tiles, and Inert
              excavation debris.
            </p>
            <p className="mt-2">
              We do NOT accept: Municipal waste, Organic waste, Hazardous
              materials, or Medical waste.
            </p>
            <p className="mt-4 rounded-lg border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-900">
              Booking history and receipts are available in My Bookings after
              sign-in.
            </p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
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

  const isAdminPath =
    location.pathname.startsWith("/admin") ||
    location.pathname === "/admin-login";
  const isUserPath =
    location.pathname.startsWith("/book") ||
    location.pathname === "/my-bookings";

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/");
  }

  return (
    <>
      <header className="global-navbar">
        <div className="global-navbar-inner">
          <Link to="/" className="brand-link">
            <Avatar className="brand-avatar h-11 w-auto overflow-visible rounded-none border-0 bg-transparent align-middle">
              <AvatarImage
                src="/balkapso-logo.jpg"
                alt="BRDI logo"
                className="h-full w-auto aspect-auto object-contain"
              />
              <AvatarFallback className="text-xs font-semibold text-cyan-700">
                BRDI
              </AvatarFallback>
            </Avatar>
            <div className="brand-copy">
              <p className="brand-eyebrow">Waste Management</p>
              <h1 className="brand-title">BRDI</h1>
            </div>
          </Link>

          <div className="desktop-nav">
            <NavigationMenu className="primary-nav-shell">
              <NavigationMenuList className="primary-nav-list">
                {!isAdminPath && (
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
                    {session && (
                      <>
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
                    )}
                  </>
                )}
                {isAdminPath && (
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
                )}
              </NavigationMenuList>
            </NavigationMenu>

            {session && !isAdminPath && (
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
            {!isAdminPath && (
              <>
                <Link
                  to="/"
                  className={
                    navLinkClasses(location.pathname === "/") +
                    " mobile-nav-link"
                  }
                >
                  Home
                </Link>
                {session && (
                  <>
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
                )}
              </>
            )}
            {isAdminPath && (
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

        <footer className="px-4 pb-4 pt-2 sm:px-6 lg:px-8">
          <Separator />
          <div className="flex items-center justify-end pt-3">
            {!isUserPath && !isAdminPath && (
              <Link
                to="/admin-login"
                className="text-xs text-slate-400 no-underline transition hover:text-slate-600"
                aria-label="Admin access"
              >
                Admin
              </Link>
            )}
          </div>
        </footer>
      </div>
    </>
  );
}

export default App;
