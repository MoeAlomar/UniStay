import { useState } from "react";
import { Button } from "./ui/button";
import { User as UserIcon, Menu } from "lucide-react";
import type { User as AppUser } from "../services/auth";

interface NavigationHeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  isLoggedIn?: boolean;
  userType?: "student" | "landlord";
  user?: AppUser;
}

export function NavigationHeader({
  onNavigate,
  currentPage,
  isLoggedIn = false,
  userType,
  user,
}: NavigationHeaderProps) {
  return (
    <header className="bg-white border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button
            onClick={() => onNavigate("landing")}
            className="flex items-center gap-2"
          >
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white">US</span>
            </div>
            <span className="text-xl text-foreground">UniStay KSA</span>
          </button>

          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => onNavigate("search")}
              className="text-foreground hover:text-primary transition-colors"
            >
              Listings
            </button>
            {isLoggedIn && user && user.role !== "landlord" && (
              <button
                onClick={() => onNavigate("roommate")}
                className="text-foreground hover:text-primary transition-colors"
              >
                Roommates
              </button>
            )}
            {isLoggedIn && userType === "landlord" && (
              <button
                onClick={() => onNavigate("dashboard")}
                className="text-foreground hover:text-primary transition-colors"
              >
                Dashboard
              </button>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3 relative">
          {!isLoggedIn ? (
            <>
              <Button
                variant="ghost"
                onClick={() => onNavigate("login")}
                className="text-foreground"
              >
                Login
              </Button>
              <Button onClick={() => onNavigate("register")}>Register</Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                onNavigate("profile");
                try {
                  window.history.pushState(null, "", "/users/profile");
                } catch (_) {}
              }}
              aria-label="Profile"
            >
              <UserIcon className="w-5 h-5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
