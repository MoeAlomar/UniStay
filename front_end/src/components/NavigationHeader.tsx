import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { User as UserIcon, Menu, Moon, Sun } from "lucide-react";
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

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button onClick={() => onNavigate("landing")} className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white">DR</span>
            </div>
            <span className="text-xl text-foreground">Darek</span>
          </button>

          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => {
                if (isLoggedIn) {
                  onNavigate("search");
                } else {
                  try {
                    localStorage.setItem(
                      "register_gate_notice",
                      JSON.stringify({ message: "Please register to access listings." })
                    );
                  } catch (_) {}
                  onNavigate("register");
                }
              }}
              className="text-foreground hover:text-primary transition-colors"
            >
              Listings
            </button>

            {/* NEW: Messages tab when logged in */}
            {isLoggedIn && (
              <button
                onClick={() => onNavigate("messages")}
                className="text-foreground hover:text-primary transition-colors"
              >
                Messages
              </button>
            )}

            {isLoggedIn && user && user.role !== "landlord" && (
              <button onClick={() => onNavigate("roommate")} className="text-foreground hover:text-primary transition-colors">
                Roommates
              </button>
            )}
            {isLoggedIn && userType === "landlord" && (
              <button onClick={() => onNavigate("dashboard")} className="text-foreground hover:text-primary transition-colors">
                Dashboard
              </button>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3 relative">
          <Button
            variant="outline"
            size="icon"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setIsDark((prev) => !prev)}
            className="rounded-md"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {!isLoggedIn ? (
            <>
              <Button variant="ghost" onClick={() => onNavigate("login")} className="text-foreground">
                Login
              </Button>
              <Button onClick={() => onNavigate("register")}>Register</Button>
            </>
          ) : (
            <button
              onClick={() => {
                onNavigate("profile");
                try {
                  window.history.pushState(null, "", "/users/profile");
                } catch (_) {}
              }}
              aria-label="Profile"
              className="rounded-md border border-border p-1 hover:bg-muted transition-colors"
            >
              <Avatar className="size-8">
                {user?.avatar_url ? (
                  <AvatarImage
                    src={transformAvatar(user.avatar_url)}
                    alt={
                      user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : user?.username || "User"
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
            </button>
          )}

          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
