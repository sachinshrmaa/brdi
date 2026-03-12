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

const navLinkClasses = (active) =>
  `inline-flex items-center rounded-lg border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 ${
    active
      ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
      : "border-slate-300 bg-white text-slate-700 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800"
  }`;

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
    <div className="app-shell mx-auto flex min-h-screen w-full max-w-7xl flex-col">
      <div className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-3 text-inherit no-underline transition hover:opacity-90"
          >
            <Avatar className="h-11 w-auto overflow-visible rounded-none border-0 bg-transparent align-middle">
              <AvatarImage
                src="/balkapso-logo.jpg"
                alt="BRDI logo"
                className="h-full w-auto aspect-auto object-contain"
              />
              <AvatarFallback className="text-xs font-semibold text-cyan-700">
                BRDI
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Waste Management
              </p>
              <h1 className="m-0 text-2xl font-bold tracking-tight text-cyan-700">
                BRDI
              </h1>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <NavigationMenu>
              <NavigationMenuList>
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
                              Book Now
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
                className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </div>

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
  );
}

export default App;
