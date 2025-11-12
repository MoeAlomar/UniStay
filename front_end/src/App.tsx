import { BrowserRouter, Routes, Route, Navigate, useLocation, useSearchParams, useNavigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { NavigationHeader } from "./components/NavigationHeader";
import { LandingPage } from "./components/LandingPage";
import { SearchResults } from "./components/SearchResults";
import { FavoritesPage } from "./components/FavoritesPage";
import { ListingDetails } from "./components/ListingDetails";
import { Messages } from "./components/Messages";
import { RoommateMatching } from "./components/RoommateMatching";
import { OwnerDashboard } from "./components/OwnerDashboard";
import { LoginRegister } from "./components/LoginRegister";
import { Verification } from "./components/Verification";
import { ProfilePage } from "./components/ProfilePage";
import { storage } from "./services/api";
import { profile, type User } from "./services/auth";

// Legacy page routing type kept for reference; now replaced by react-router-dom
// type Page =
//   | "landing"
//   | "search"
//   | "listing"
//   | "favorites"
//   | "messages"
//   | "roommate"
//   | "dashboard"
//   | "login"
//   | "register"
//   | "verification"
//   | "profile";

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<"student" | "landlord">("student");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Sync auth state with stored tokens and fetch user profile
  useEffect(() => {
    const syncAuth = async () => {
      if (storage.access) {
        setIsLoggedIn(true);
        try {
          const u = await profile();
          setCurrentUser(u);
          if (u.role === "landlord") setUserType("landlord");
          else setUserType("student");
        } catch (_) {
          // keep login state; tokens may be invalid
        }
      } else {
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
    };
    syncAuth();
  }, [location.pathname]);

  const handleNavigate = (page: string, propertyId?: string) => {
    switch (page) {
      case "landing":
        navigate("/");
        break;
      case "search":
        navigate("/search");
        break;
      case "favorites":
        navigate("/favorites");
        break;
      case "listing":
        navigate(propertyId ? `/listing?listing=${propertyId}` : "/");
        break;
      case "messages":
        navigate("/messages");
        break;
      case "roommate":
        navigate("/roommate");
        break;
      case "dashboard":
        navigate("/owner/dashboard");
        break;
      case "login":
        navigate("/users/login");
        break;
      case "register":
        navigate("/users/register");
        break;
      case "verification":
        navigate("/users/verify");
        break;
      case "profile":
        navigate("/users/profile");
        break;
      default:
        navigate("/");
        break;
    }
    window.scrollTo(0, 0);
  };

  const currentPageForHeader = (() => {
    const p = location.pathname;
    if (p === "/") return "landing";
    if (p.startsWith("/search")) return "search";
    if (p.startsWith("/favorites")) return "favorites";
    if (p.startsWith("/listing")) return "listing";
    if (p.startsWith("/messages")) return "messages";
    if (p.startsWith("/roommate")) return "roommate";
    if (p.startsWith("/owner")) return "dashboard";
    if (p === "/users/login") return "login";
    if (p === "/users/register") return "register";
    if (p === "/users/verify") return "verification";
    if (p === "/users/profile") return "profile";
    return "landing";
  })();

  return (
    <Routes>
      {/* Layout with optional header */}
      <Route
        element={
          <Layout
            onNavigate={handleNavigate}
            isLoggedIn={isLoggedIn}
            userType={userType}
            currentUser={currentUser || undefined}
          />
        }
      >
        <Route
          path="/"
          element={<LandingPage onNavigate={handleNavigate} isLoggedIn={isLoggedIn} userType={userType} />}
        />
        <Route path="/search" element={<SearchResults onNavigate={handleNavigate} />} />
        <Route path="/favorites" element={<FavoritesPage onNavigate={handleNavigate} />} />
        <Route path="/listing" element={<ListingRoute onNavigate={handleNavigate} />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/roommate" element={<RoommateMatching onNavigate={handleNavigate} />} />
        <Route path="/owner/dashboard" element={<OwnerDashboard onNavigate={handleNavigate} />} />
        <Route path="/users/profile" element={<ProfilePage user={currentUser || undefined} onNavigate={handleNavigate} />} />
      </Route>

      {/* Auth-specific routes without header via Layout hide logic */}
      <Route path="/users/login" element={<LoginRegister onNavigate={handleNavigate} mode="login" />} />
      <Route path="/users/register" element={<LoginRegister onNavigate={handleNavigate} mode="register" />} />
      <Route path="/users/verify" element={<Verification onNavigate={handleNavigate} />} />

      {/* Redirect unknown paths */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function Layout({
  onNavigate,
  isLoggedIn,
  userType,
  currentUser,
}: {
  onNavigate: (page: string, propertyId?: string) => void;
  isLoggedIn: boolean;
  userType: "student" | "landlord";
  currentUser?: User;
}) {
  const location = useLocation();
  const hideHeaderPaths = new Set(["/users/login", "/users/register", "/users/verify"]);
  const showHeader = !hideHeaderPaths.has(location.pathname);

  const currentPageForHeader = (() => {
    const p = location.pathname;
    if (p === "/") return "landing";
    if (p.startsWith("/search")) return "search";
    if (p.startsWith("/favorites")) return "favorites";
    if (p.startsWith("/listing")) return "listing";
    if (p.startsWith("/messages")) return "messages";
    if (p.startsWith("/roommate")) return "roommate";
    if (p.startsWith("/owner")) return "dashboard";
    if (p === "/users/login") return "login";
    if (p === "/users/register") return "register";
    if (p === "/users/verify") return "verification";
    if (p === "/users/profile") return "profile";
    return "landing";
  })();

  return (
    <div className="min-h-screen bg-background">
      {showHeader && (
        <NavigationHeader
          onNavigate={onNavigate}
          currentPage={currentPageForHeader}
          isLoggedIn={isLoggedIn}
          userType={userType}
          user={currentUser}
        />
      )}
      <Outlet />
    </div>
  );
}

function ListingRoute({ onNavigate }: { onNavigate: (page: string, propertyId?: string) => void }) {
  const [params] = useSearchParams();
  const id = params.get("listing") ?? "";
  return <ListingDetails propertyId={id} onNavigate={onNavigate} />;
}
