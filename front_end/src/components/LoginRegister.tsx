import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { AlertCircle } from "lucide-react";

interface LoginRegisterProps {
  onNavigate: (page: string) => void;
  mode?: "login" | "register";
}

export function LoginRegister({
  onNavigate,
  mode = "login",
}: LoginRegisterProps) {
  const [userType, setUserType] = useState<"student" | "landlord" | "other">("student");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [activeTab, setActiveTab] = useState(mode);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerFirstName, setRegisterFirstName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});
  const [gateNotice, setGateNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("register_gate_notice");
      if (raw) {
        const data = JSON.parse(raw);
        const msg = typeof data?.message === "string" ? data.message : "Please register to access listings.";
        setGateNotice(msg);
        localStorage.removeItem("register_gate_notice");
        setActiveTab("register");
      }
    } catch (_) {}
  }, []);

  const parseError = (e: any) => {
    const d = e?.response?.data;
    if (!d) return e?.message || "Request failed";
    if (typeof d === "string") return d;
    if (d.detail) return String(d.detail);
    if (Array.isArray(d)) return d.join(", ");
    if (typeof d === "object") {
      const parts: string[] = [];
      for (const [k, v] of Object.entries(d)) {
        const msg = Array.isArray(v) ? v.join(", ") : String(v);
        parts.push(`${k}: ${msg}`);
      }
      return parts.join("; ");
    }
    return "Request failed";
  };

  const normalizeMessage = (s: string) => {
    let t = (s ?? "").trim();
    // remove trailing periods/commas and existing trailing exclamations
    t = t.replace(/[.,\s]+!+$/g, ""); // clean sequences like ".!", " !", "!!!"
    t = t.replace(/[.,]+$/g, ""); // remove trailing '.' or ','
    // ensure single space before a single '!'
    return `${t} !`;
  };

  const extractFieldErrors = (d: any) => {
    const result: Record<string, string> = {};
    if (!d || typeof d !== "object") return result;
    for (const [k, v] of Object.entries(d)) {
      if (k === "detail") continue;
      const msg = Array.isArray(v) ? (v as any[]).join(", ") : String(v);
      result[k] = normalizeMessage(msg);
    }
    return result;
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Left Panel - Branding */}
          <div className="relative bg-primary p-12 text-white hidden md:flex flex-col justify-center">
            <div className="absolute inset-0 opacity-10">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1672912995257-0c8255289523?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwYWVyaWFsfGVufDF8fHx8MTc2MDM3Mjc3M3ww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Campus"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-12 h-12 bg-card rounded-lg flex items-center justify-center">
                  <span className="text-primary text-xl">DR</span>
                </div>
                <span className="text-2xl">Darek</span>
              </div>
              <h2 className="text-3xl mb-4">Welcome to Darek</h2>
              <p className="text-white/90 mb-6">
                The trusted platform for student housing. Connect
                with verified landlords and find your perfect home near campus.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                    ✓
                  </span>
                  <span>Verified properties and landlords</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                    ✓
                  </span>
                  <span>Student-friendly prices</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                    ✓
                  </span>
                  <span>Safe and secure platform</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Panel - Form */}
          <CardContent className="p-12">
            <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as "login" | "register")}>
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <div className="space-y-6">
                  <div>
                    <h2 className="mb-2 text-foreground">Welcome Back</h2>
                    <p className="text-muted-foreground text-sm">
                      Login to access your account
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={loginEmail}
                      onChange={(e) => {
                        setLoginEmail(e.target.value);
                        if (loginErrors.email) {
                          setLoginErrors((prev) => {
                            const next = { ...prev };
                            delete next.email;
                            return next;
                          });
                        }
                      }}
                      aria-invalid={!!loginErrors.email}
                    />
                    {loginErrors.email && (
                      <div className="text-sm text-destructive mt-1">{loginErrors.email}</div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        if (loginErrors.password) {
                          setLoginErrors((prev) => {
                            const next = { ...prev };
                            delete next.password;
                            return next;
                          });
                        }
                      }}
                      aria-invalid={!!loginErrors.password}
                    />
                    {loginErrors.password && (
                      <div className="text-sm text-destructive mt-1">{loginErrors.password}</div>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    onClick={async () => {
                      setError(null);
                      setLoginErrors({});
                      setLoading(true);
                      try {
                        const { login } = await import("../services/auth");
                        await login(loginEmail, loginPassword);
                        onNavigate("landing");
                      } catch (e: any) {
                        const d = e?.response?.data;
                        if (d && typeof d === "object" && !d.detail) {
                          setLoginErrors(extractFieldErrors(d));
                          setError(null);
                        } else {
                          setError(parseError(e));
                        }
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? "Signing in…" : "Login"}
                  </Button>

                  {error && (
                    <div className="text-sm text-destructive text-center">{error}</div>
                  )}

                  <p className="text-center text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <button
                      onClick={() => setActiveTab("register")}
                      className="text-primary hover:underline"
                    >
                      Register here
                    </button>
                  </p>
                </div>
                </TabsContent>
                <TabsContent value="register">
                  <div className="space-y-6">
                    {gateNotice && (
                      <div className="rounded-md border border-primary/30 bg-primary/10 p-3 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <div className="font-medium text-foreground">Registration Required</div>
                          <div className="text-muted-foreground">{gateNotice}</div>
                        </div>
                        <button
                          onClick={() => setGateNotice(null)}
                          className="ml-auto text-muted-foreground hover:text-foreground"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                    {/* Register Form */}
                    <div>
                    <h2 className="mb-2 text-foreground">Create Account</h2>
                    <p className="text-muted-foreground text-sm">
                      Join Darek today
                    </p>
                  </div>

                  {/* User Type Selection */}
                  <div>
                    <Label className="mb-3 block">Register as</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <button
                        onClick={() => setUserType("student")}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          userType === "student"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="text-2xl mb-2">🎓</div>
                        <div className={userType === "student" ? "" : ""}>
                          Student
                        </div>
                      </button>
                      <button
                        onClick={() => setUserType("landlord")}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          userType === "landlord"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="text-2xl mb-2">🏢</div>
                        <div className={userType === "landlord" ? "" : ""}>
                          Landlord
                        </div>
                      </button>
                      <button
                        onClick={() => setUserType("other")}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          userType === "other"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="text-2xl mb-2">👤</div>
                        <div className={userType === "other" ? "" : ""}>
                          Other
                        </div>
                      </button>
                    </div>
                    {registerErrors.role && (
                      <div className="text-sm text-destructive mt-1">{registerErrors.role}</div>
                    )}
                  </div>

                  {/* Gender Selection */}
                  <div>
                    <Label className="mb-3 block">Gender</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          setGender("male");
                          if (registerErrors.gender) {
                            setRegisterErrors((prev) => {
                              const next = { ...prev };
                              delete next.gender;
                              return next;
                            });
                          }
                        }}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          gender === "male"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="text-2xl mb-2">♂</div>
                        <div>Male</div>
                      </button>
                      <button
                        onClick={() => {
                          setGender("female");
                          if (registerErrors.gender) {
                            setRegisterErrors((prev) => {
                              const next = { ...prev };
                              delete next.gender;
                              return next;
                            });
                          }
                        }}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          gender === "female"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="text-2xl mb-2">♀</div>
                        <div>Female</div>
                      </button>
                    </div>
                    {registerErrors.gender && (
                      <div className="text-sm text-destructive mt-1">{registerErrors.gender}</div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="register-first-name">First Name</Label>
                      <Input
                        id="register-first-name"
                        placeholder="Ahmed"
                        value={registerFirstName}
                        onChange={(e) => {
                          setRegisterFirstName(e.target.value);
                          if (registerErrors.first_name) {
                            setRegisterErrors((prev) => {
                              const next = { ...prev };
                              delete next.first_name;
                              return next;
                            });
                          }
                        }}
                        aria-invalid={!!registerErrors.first_name}
                      />
                      {registerErrors.first_name && (
                        <div className="text-sm text-destructive mt-1">{registerErrors.first_name}</div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="register-last-name">Last Name</Label>
                      <Input
                        id="register-last-name"
                        placeholder="Altamimi"
                        value={registerLastName}
                        onChange={(e) => {
                          setRegisterLastName(e.target.value);
                          if (registerErrors.last_name) {
                            setRegisterErrors((prev) => {
                              const next = { ...prev };
                              delete next.last_name;
                              return next;
                            });
                          }
                        }}
                        aria-invalid={!!registerErrors.last_name}
                      />
                      {registerErrors.last_name && (
                        <div className="text-sm text-destructive mt-1">{registerErrors.last_name}</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="register-username">Username</Label>
                    <Input
                      id="register-username"
                      placeholder="Your username"
                      value={registerUsername}
                      onChange={(e) => {
                        setRegisterUsername(e.target.value);
                        if (registerErrors.username) {
                          setRegisterErrors((prev) => {
                            const next = { ...prev };
                            delete next.username;
                            return next;
                          });
                        }
                      }}
                      aria-invalid={!!registerErrors.username}
                    />
                    {registerErrors.username && (
                      <div className="text-sm text-destructive mt-1">{registerErrors.username}</div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={registerEmail}
                      onChange={(e) => {
                        setRegisterEmail(e.target.value);
                        if (registerErrors.email) {
                          setRegisterErrors((prev) => {
                            const next = { ...prev };
                            delete next.email;
                            return next;
                          });
                        }
                      }}
                      aria-invalid={!!registerErrors.email}
                    />
                    {registerErrors.email && (
                      <div className="text-sm text-destructive mt-1">{registerErrors.email}</div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="register-phone">Phone Number</Label>
                    <Input
                      id="register-phone"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="05XXXXXXXX"
                      className="placeholder:text-gray-400"
                      value={registerPhone}
                      onChange={(e) => {
                        // Restrict to digits and max length 10
                        const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setRegisterPhone(digitsOnly);
                        if (registerErrors.phone) {
                          setRegisterErrors((prev) => {
                            const next = { ...prev };
                            delete next.phone;
                            return next;
                          });
                        }
                      }}
                      aria-invalid={!!registerErrors.phone}
                    />
                    {registerErrors.phone && (
                      <div className="text-sm text-destructive mt-1">{registerErrors.phone}</div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerPassword}
                      onChange={(e) => {
                        setRegisterPassword(e.target.value);
                        if (registerErrors.password) {
                          setRegisterErrors((prev) => {
                            const next = { ...prev };
                            delete next.password;
                            return next;
                          });
                        }
                      }}
                      aria-invalid={!!registerErrors.password}
                    />
                    {registerErrors.password && (
                      <div className="text-sm text-destructive mt-1">{registerErrors.password}</div>
                    )}
                  </div>

                  <div className="flex items-start gap-2">
                    <input type="checkbox" className="mt-1 rounded" />
                    <label className="text-sm text-muted-foreground">
                      I agree to the Terms of Service and Privacy Policy
                    </label>
                  </div>

                  <Button
                    className="w-full"
                    onClick={async () => {
                      setError(null);
                      setRegisterErrors({});
                      setLoading(true);
                      try {
                        const { register, login } = await import("../services/auth");
                        const emailLower = (registerEmail ?? "").toLowerCase();
                        // Client-side phone format pre-check: allow empty; else must match 05XXXXXXXX
                        if (registerPhone && !/^05\d{8}$/.test(registerPhone)) {
                          setRegisterErrors({ phone: normalizeMessage("Phone must start with 05 and be 10 digits") });
                          setLoading(false);
                          return;
                        }
                        await register({
                          username: registerUsername || emailLower.split("@")[0],
                          first_name: registerFirstName,
                          last_name: registerLastName,
                          email: emailLower,
                          password: registerPassword,
                          role: userType,
                          gender,
                          phone: registerPhone,
                        });
                        // Automatically log in with the same credentials
                        try {
                          await login(emailLower, registerPassword);
                          onNavigate("landing");
                        } catch (e: any) {
                          // If auto-login fails, show the error but stay on register tab
                          setError(parseError(e));
                        }
                      } catch (e: any) {
                        const d = e?.response?.data;
                        if (d && typeof d === "object") {
                          setRegisterErrors(extractFieldErrors(d));
                          const detail = (d as any).detail;
                          if (detail) setError(normalizeMessage(String(detail)));
                          else setError(null);
                        } else {
                          setError(parseError(e));
                        }
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? "Creating…" : "Create Account"}
                  </Button>

                  {error && (
                    <div className="text-sm text-destructive text-center">{error}</div>
                  )}

                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <button
                      onClick={() => setActiveTab("login")}
                      className="text-primary hover:underline"
                    >
                      Login here
                    </button>
                  </p>
                </div>
              </TabsContent>
            </Tabs>
            </CardContent>
          </div>
      </Card>
    </div>
  );
}
