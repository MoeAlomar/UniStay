import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import type { User as AppUser } from "../services/auth";
import { profile as fetchProfile } from "../services/auth";
import { clearTokens } from "../services/api";

type Props = {
  user?: AppUser | null;
  onNavigate: (page: string) => void;
};

export function ProfilePage({ user: userProp, onNavigate }: Props) {
  const [user, setUser] = useState<AppUser | null | undefined>(userProp);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Ensure URL reflects the profile page
    try {
      if (window.location.pathname !== "/users/profile") {
        window.history.pushState(null, "", "/users/profile");
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!userProp) {
      setLoading(true);
      fetchProfile()
        .then((u) => setUser(u))
        .catch((e) => setError(e?.message ?? "Failed to load profile"))
        .finally(() => setLoading(false));
    } else {
      setUser(userProp);
    }
  }, [userProp]);

  const initials = useMemo(() => {
    const fn = user?.first_name?.trim() || "";
    const ln = user?.last_name?.trim() || "";
    const f = fn ? fn[0] : user?.username?.[0] || "U";
    const l = ln ? ln[0] : "";
    return (f + l).toUpperCase();
  }, [user]);

  const verified = !!user?.is_email_verified;

  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl p-4">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-3xl p-4">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <Button className="mt-4" onClick={() => onNavigate("landing")}>Go back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={() => onNavigate("landing")}> 
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div className="ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              try { clearTokens(); } catch (_) {}
              setUser(null);
              onNavigate("landing");
              try { window.history.pushState(null, "", "/"); } catch (_) {}
            }}
          >
            Logout
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {/* Replace AvatarImage src with real photo when available */}
              <AvatarImage src={undefined} alt="Profile photo" />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">
                {(user?.first_name || user?.last_name) ? `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() : user?.username}
              </CardTitle>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                {verified ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600" /> Email verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 text-yellow-500" /> Email not verified
                  </span>
                )}
                <Separator orientation="vertical" className="mx-1 h-4" />
                <span className="capitalize">Role: {user?.role ?? "user"}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">First name</div>
              <div className="text-base">{user?.first_name || "—"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Last name</div>
              <div className="text-base">{user?.last_name || "—"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="text-base">{user?.email || "—"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Username</div>
              <div className="text-base">{user?.username || "—"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Gender</div>
              <div className="text-base capitalize">{user?.gender || "—"}</div>
            </div>
          </div>
          {!verified && (
            <div className="mt-6">
              <div className="text-sm text-muted-foreground">
                Your email is not verified. You may have limited access to some features.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}