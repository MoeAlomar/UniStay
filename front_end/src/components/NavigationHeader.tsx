import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Menu, Moon, Sun, X } from "lucide-react";
import { Switch } from "./ui/switch";
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
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return (localStorage.getItem("theme") ?? "light") === "dark";
    } catch (_) {
      return document.documentElement.classList.contains("dark");
    }
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    try {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch (_) {}
  }, [isDark]);

  function transformAvatar(url?: string | null): string | undefined {
    const src = typeof url === "string" ? url : undefined;
    if (!src || !src.includes("res.cloudinary.com") || !src.includes("/image/upload/")) return src;
    try {
      const marker = "/image/upload/";
      const idx = src.indexOf(marker);
      const before = src.slice(0, idx + marker.length);
      const after = src.slice(idx + marker.length);
      const hasTransforms = after[0] !== "v" && after.includes("/");
      const transform = "c_fill,w_32,h_32,dpr_auto";
      if (hasTransforms) return `${before}f_auto,q_auto,${transform},${after}`;
      return `${before}f_auto,q_auto,${transform}/${after}`;
    } catch {
      return src;
    }
  }

  const handleNav = (page: string) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-4 flex items-center justify-between">
        {/* Logo + desktop nav */}
        <div className="flex items-center gap-2 sm:gap-8">
          <button
            onClick={() => handleNav("landing")}
            className="flex items-center gap-1.5 sm:gap-2"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white text-sm sm:text-base">DR</span>
            </div>
            <span className="text-lg sm:text-xl text-foreground">Darek</span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {isLoggedIn && (
              <button
                onClick={() => handleNav("messages")}
                className="text-foreground hover:text-primary transition-colors"
              >
                Messages
              </button>
            )}

            {isLoggedIn && user && user.role !== "landlord" && (
              <button
                onClick={() => handleNav("roommate")}
                className="text-foreground hover:text-primary transition-colors"
              >
                Roommates
              </button>
            )}

            <button
              onClick={() => {
                if (isLoggedIn) {
                  handleNav("search");
                } else {
                  try {
                    localStorage.setItem(
                      "register_gate_notice",
                      JSON.stringify({ message: "Please register to access listings." })
                    );
                  } catch (_) {}
                  handleNav("register");
                }
              }}
              className="text-foreground hover:text-primary transition-colors"
            >
              Listings
            </button>

            {isLoggedIn && userType === "landlord" && (
              <button
                onClick={() => handleNav("dashboard")}
                className="text-foreground hover:text-primary transition-colors"
              >
                Dashboard
              </button>
            )}
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 relative">
          {/* Theme toggle */}
          <Button
            variant="outline"
            size="icon"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setIsDark((prev) => !prev)}
            className="rounded-md h-8 w-8 sm:h-9 sm:w-9"
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            ) : (
              <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            )}
          </Button>

          {/* Auth controls (desktop+mobile) */}
          {!isLoggedIn ? (
            <>
              <Button
                variant="ghost"
                onClick={() => handleNav("login")}
                className="text-foreground h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm md:text-base md:inline-flex"
              >
                Login
              </Button>
              <Button
                onClick={() => handleNav("register")}
                className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm md:text-base md:inline-flex"
              >
                Register
              </Button>
            </>
          ) : (
            <button
              onClick={() => {
                handleNav("profile");
                try {
                  window.history.pushState(null, "", "/users/profile");
                } catch (_) {}
              }}
              aria-label="Profile"
              className="rounded-md border border-border p-0.5 sm:p-1 hover:bg-muted transition-colors md:inline-flex"
            >
              <Avatar className="size-6 sm:size-7 md:size-8">
                {user?.avatar_url ? (
                  <AvatarImage
                    src={transformAvatar(user.avatar_url)}
                    alt={
                      user?.first_name
                        ? `${user.first_name} ${user.last_name || ""}`.trim()
                        : user?.username || "User"
                    }
                    loading="eager"
                    decoding="async"
                  />
                ) : null}
                <AvatarFallback className="text-xs sm:text-sm">
                  {(() => {
                    const fn = user?.first_name?.trim() || "";
                    const ln = user?.last_name?.trim() || "";
                    const pair = ((fn ? fn[0] : "") + (ln ? ln[0] : "")).toUpperCase();
                    return pair || "US";
                  })()}
                </AvatarFallback>
              </Avatar>
            </button>
          )}

          {/* Mobile burger (md hidden) */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8 sm:h-9 sm:w-9"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-0 h-full w-[85vw] sm:w-[360px] bg-background shadow-xl p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <span className="text-white text-sm">DR</span>
                </div>
                <span className="text-lg text-foreground">Darek</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Mobile theme toggle */}
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">Dark mode</span>
              <Switch
                checked={isDark}
                onCheckedChange={(val: boolean) => setIsDark(Boolean(val))}
              />
            </div>

            {/* Navigation links */}
            <div className="space-y-2 mt-2">
              {isLoggedIn && (
                <button
                  onClick={() => handleNav("messages")}
                  className="w-full text-left p-3 rounded-md hover:bg-muted text-foreground"
                >
                  Messages
                </button>
              )}

              {isLoggedIn && user && user.role !== "landlord" && (
                <button
                  onClick={() => handleNav("roommate")}
                  className="w-full text-left p-3 rounded-md hover:bg-muted text-foreground"
                >
                  Roommates
                </button>
              )}

              <button
                onClick={() => {
                  if (isLoggedIn) {
                    handleNav("search");
                  } else {
                    try {
                      localStorage.setItem(
                        "register_gate_notice",
                        JSON.stringify({
                          message: "Please register to access listings.",
                        })
                      );
                    } catch (_) {}
                    handleNav("register");
                  }
                }}
                className="w-full text-left p-3 rounded-md hover:bg-muted text-foreground"
              >
                Listings
              </button>

              {isLoggedIn && userType === "landlord" && (
                <button
                  onClick={() => handleNav("dashboard")}
                  className="w-full text-left p-3 rounded-md hover:bg-muted text-foreground"
                >
                  Dashboard
                </button>
              )}
            </div>

            {/* Auth actions on mobile */}
            {!isLoggedIn ? (
              <div className="flex items-center gap-2 mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNav("login")}
                  className="flex-1"
                >
                  Login
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleNav("register")}
                  className="flex-1"
                >
                  Register
                </Button>
              </div>
            ) : (
              <button
                onClick={() => {
                  handleNav("profile");
                  try {
                    window.history.pushState(null, "", "/users/profile");
                  } catch (_) {}
                }}
                className="w-full text-left p-3 rounded-md hover:bg-muted text-foreground flex items-center gap-3 mt-4"
              >
                <Avatar className="size-8">
                  {user?.avatar_url ? (
                    <AvatarImage
                      src={transformAvatar(user.avatar_url)}
                      alt={
                        user?.first_name
                          ? `${user.first_name} ${user.last_name || ""}`.trim()
                          : user?.username || "User"
                      }
                      loading="eager"
                      decoding="async"
                    />
                  ) : null}
                  <AvatarFallback>
                    {(() => {
                      const fn = user?.first_name?.trim() || "";
                      const ln = user?.last_name?.trim() || "";
                      const pair = ((fn ? fn[0] : "") + (ln ? ln[0] : "")).toUpperCase();
                      return pair || "US";
                    })()}
                  </AvatarFallback>
                </Avatar>
                <span>Profile</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
