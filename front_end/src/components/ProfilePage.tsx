import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import type { User as AppUser } from "../services/auth";
import { profile as fetchProfile, updateAvatar } from "../services/auth";
import { clearTokens } from "../services/api";
import ImageCropDialog from "./ImageCropDialog";

type Props = {
  user?: AppUser | null;
  onNavigate: (page: string) => void;
};

export function ProfilePage({ user: userProp, onNavigate }: Props) {
  const [user, setUser] = useState<AppUser | null | undefined>(userProp);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [preloading, setPreloading] = useState(false);

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

  // Removed dark/light toggle from Profile page to avoid duplicate controls

  const initials = useMemo(() => {
    const fn = user?.first_name?.trim() || "";
    const ln = user?.last_name?.trim() || "";
    const f = fn ? fn[0] : "";
    const l = ln ? ln[0] : "";
    const pair = (f + l).toUpperCase();
    return pair || "US";
  }, [user]);

  const verified = !!user?.is_email_verified;

  function transformAvatar(url?: string | null): string | undefined {
    const src = typeof url === "string" ? url : undefined;
    if (!src || !src.includes("res.cloudinary.com") || !src.includes("/image/upload/")) return src;
    try {
      const marker = "/image/upload/";
      const idx = src.indexOf(marker);
      const before = src.slice(0, idx + marker.length);
      const after = src.slice(idx + marker.length);
      const hasTransforms = after[0] !== 'v' && after.includes('/');
      const transform = "c_fill,w_128,h_128,dpr_auto";
      if (hasTransforms) {
        return `${before}f_auto,q_auto,${transform},${after}`;
      }
      return `${before}f_auto,q_auto,${transform}/${after}`;
    } catch {
      return src;
    }
  }

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
    <div className="container mx-auto max-w-5xl px-8 py-10">
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
      <Card className="shadow-md">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                {user?.avatar_url ? (
                  <AvatarImage src={transformAvatar(user.avatar_url)} alt="Profile photo" loading="eager" decoding="async" />
                ) : null}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadError(null);
                  try {
                    const url = URL.createObjectURL(file);
                    setCropSrc(url);
                    setCropOpen(true);
                  } catch (_) {}
                }}
              />
            </div>
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
        <CardContent className="space-y-8">
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? "Uploading..." : "Change Photo"}
            </Button>
            {uploadError && (
              <span className="text-sm text-red-600">{uploadError}</span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">First name</div>
              <div className="text-lg">{user?.first_name || "—"}</div>
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
      <ImageCropDialog
        open={cropOpen}
        onOpenChange={(o) => {
          setCropOpen(o);
          if (!o) {
            try {
              if (cropSrc) URL.revokeObjectURL(cropSrc);
            } catch (_) {}
            setCropSrc(null);
          }
        }}
        src={cropSrc}
        onCropped={async (file) => {
          setUploading(true);
          try {
            const updated = await updateAvatar(file);
            // Preload new avatar before swapping to avoid fallback flash
            const nextUrl = transformAvatar(updated?.avatar_url) || updated?.avatar_url || undefined;
            if (nextUrl) {
              setPreloading(true);
              const img = new Image();
              (img as any).loading = "eager";
              (img as any).decoding = "async";
              img.src = nextUrl;
              const finish = () => {
                setPreloading(false);
                setUser(updated);
              };
              img.onload = finish;
              img.onerror = finish;
            } else {
              setUser(updated);
            }
          } catch (err: any) {
            const msg = err?.response?.data?.avatar || err?.message || "Failed to upload avatar";
            setUploadError(typeof msg === 'string' ? msg : JSON.stringify(msg));
          } finally {
            setUploading(false);
          }
        }}
        title="Crop Profile Photo"
        outputSize={512}
      />
    </div>
  );
}
