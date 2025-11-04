import { useEffect, useState } from "react";
import { NavigationHeader } from "./components/NavigationHeader";
import { LandingPage } from "./components/LandingPage";
import { SearchResults } from "./components/SearchResults";
import { ListingDetails } from "./components/ListingDetails";
import { Messages } from "./components/Messages";
import { RoommateMatching } from "./components/RoommateMatching";
import { OwnerDashboard } from "./components/OwnerDashboard";
import { LoginRegister } from "./components/LoginRegister";
import { Verification } from "./components/Verification";
import { ProfilePage } from "./components/ProfilePage";
import { storage } from "./services/api";
import { profile, type User } from "./services/auth";

type Page =
  | "landing"
  | "search"
  | "listing"
  | "messages"
  | "roommate"
  | "dashboard"
  | "login"
  | "register"
  | "verification"
  | "profile";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("landing");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<"student" | "landlord">("student");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleNavigate = (page: string, propertyId?: string) => {
    setCurrentPage(page as Page);
    if (propertyId) {
      setSelectedPropertyId(propertyId);
    }

    // Simulate login when navigating to dashboard or after verification
    if (page === "dashboard") {
      setIsLoggedIn(true);
      setUserType("landlord");
    } else if (page === "landing" && currentPage === "verification") {
      setIsLoggedIn(true);
      setUserType("student");
    }

    // Scroll to top on navigation
    window.scrollTo(0, 0);
  };

  // Sync auth state with stored tokens and fetch user profile for role
  useEffect(() => {
    const syncAuth = async () => {
      if (storage.access) {
        setIsLoggedIn(true);
        try {
          const u = await profile();
          setCurrentUser(u);
          if (u.role === "landlord") setUserType("landlord");
          else setUserType("student");
        } catch (e) {
          // If profile fails, keep the login state; tokens may be invalid
          // Optionally handle token clearing, but keep minimal for now
        }
      } else {
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
    };
    syncAuth();
  }, [currentPage]);

  const showHeader =
    currentPage !== "login" &&
    currentPage !== "register" &&
    currentPage !== "verification";

  return (
    <div className="min-h-screen bg-background">
      {showHeader && (
        <NavigationHeader
          onNavigate={handleNavigate}
          currentPage={currentPage}
          isLoggedIn={isLoggedIn}
          userType={userType}
          user={currentUser || undefined}
        />
      )}

      {currentPage === "landing" && (
        <LandingPage
          onNavigate={handleNavigate}
          isLoggedIn={isLoggedIn}
          userType={userType}
        />
      )}
      {currentPage === "search" && <SearchResults onNavigate={handleNavigate} />}
      {currentPage === "listing" && (
        <ListingDetails
          propertyId={selectedPropertyId}
          onNavigate={handleNavigate}
        />
      )}
      {currentPage === "messages" && <Messages />}
      {currentPage === "roommate" && (
        <RoommateMatching onNavigate={handleNavigate} />
      )}
      {currentPage === "dashboard" && (
        <OwnerDashboard onNavigate={handleNavigate} />
      )}
      {currentPage === "login" && (
        <LoginRegister onNavigate={handleNavigate} mode="login" />
      )}
      {currentPage === "register" && (
        <LoginRegister onNavigate={handleNavigate} mode="register" />
      )}
      {currentPage === "verification" && (
        <Verification onNavigate={handleNavigate} />
      )}
      {currentPage === "profile" && (
        <ProfilePage user={currentUser || undefined} onNavigate={handleNavigate} />
      )}
    </div>
  );
}
