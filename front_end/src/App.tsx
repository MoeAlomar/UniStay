import { useState } from "react";
import { NavigationHeader } from "./components/NavigationHeader";
import { LandingPage } from "./components/LandingPage";
import { SearchResults } from "./components/SearchResults";
import { ListingDetails } from "./components/ListingDetails";
import { Messages } from "./components/Messages";
import { RoommateMatching } from "./components/RoommateMatching";
import { OwnerDashboard } from "./components/OwnerDashboard";
import { LoginRegister } from "./components/LoginRegister";
import { Verification } from "./components/Verification";

type Page =
  | "landing"
  | "search"
  | "listing"
  | "messages"
  | "roommate"
  | "dashboard"
  | "login"
  | "register"
  | "verification";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("landing");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<"student" | "landlord">("student");

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
        />
      )}

      {currentPage === "landing" && <LandingPage onNavigate={handleNavigate} />}
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
    </div>
  );
}
