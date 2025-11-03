import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface LoginRegisterProps {
  onNavigate: (page: string) => void;
  mode?: "login" | "register";
}

export function LoginRegister({
  onNavigate,
  mode = "login",
}: LoginRegisterProps) {
  const [userType, setUserType] = useState<"student" | "landlord">("student");
  const [activeTab, setActiveTab] = useState(mode);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerFirstName, setRegisterFirstName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-primary text-xl">US</span>
                </div>
                <span className="text-2xl">UniStay KSA</span>
              </div>
              <h2 className="text-3xl mb-4">Welcome to UniStay KSA</h2>
              <p className="text-white/90 mb-6">
                The trusted platform for student housing in Saudi Arabia. Connect
                with verified landlords and find your perfect home near campus.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    ✓
                  </span>
                  <span>Verified properties and landlords</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    ✓
                  </span>
                  <span>Student-friendly prices</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    ✓
                  </span>
                  <span>Safe and secure platform</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Panel - Form */}
          <CardContent className="p-12">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
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

                  {/* User Type Selection */}
                  <div>
                    <Label className="mb-3 block">Login as</Label>
                    <div className="grid grid-cols-2 gap-3">
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
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" className="rounded" />
                      <span>Remember me</span>
                    </label>
                    <Button variant="link" className="text-primary p-0 h-auto">
                      Forgot password?
                    </Button>
                  </div>

                  <Button
                    className="w-full"
                    onClick={async () => {
                      setError(null);
                      setLoading(true);
                      try {
                        const username = loginEmail.includes("@")
                          ? loginEmail.split("@")[0]
                          : loginEmail;
                        const { login } = await import("../services/auth");
                        const res = await login(username, loginPassword);
                        onNavigate(
                          res.redirect_url?.includes("dashboard") || userType === "landlord"
                            ? "dashboard"
                            : "landing"
                        );
                      } catch (e: any) {
                        setError(e?.response?.data?.detail || "Login failed");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? "Signing in…" : "Login"}
                  </Button>

                  {error && (
                    <div className="text-sm text-red-500 text-center">{error}</div>
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

              {/* Register Form */}
              <TabsContent value="register">
                <div className="space-y-6">
                  <div>
                    <h2 className="mb-2 text-foreground">Create Account</h2>
                    <p className="text-muted-foreground text-sm">
                      Join UniStay KSA today
                    </p>
                  </div>

                  {/* User Type Selection */}
                  <div>
                    <Label className="mb-3 block">Register as</Label>
                    <div className="grid grid-cols-2 gap-3">
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
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="register-first-name">First Name</Label>
                      <Input
                        id="register-first-name"
                        placeholder="Ahmed"
                        value={registerFirstName}
                        onChange={(e) => setRegisterFirstName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="register-last-name">Last Name</Label>
                      <Input
                        id="register-last-name"
                        placeholder="Altamimi"
                        value={registerLastName}
                        onChange={(e) => setRegisterLastName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="register-phone">Phone Number</Label>
                    <Input
                      id="register-phone"
                      type="tel"
                      placeholder="+966 XX XXX XXXX"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                    />
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
                      setLoading(true);
                      try {
                        const username = registerEmail.split("@")[0];
                        const first_name = registerFirstName;
                        const last_name = registerLastName;
                        const { register } = await import("../services/auth");
                        await register({
                          username,
                          first_name,
                          last_name,
                          email: registerEmail,
                          password: registerPassword,
                          role: userType,
                          gender: "male",
                          phone: registerPhone,
                        });
                        onNavigate("verification");
                      } catch (e: any) {
                        setError(
                          e?.response?.data?.detail || "Registration failed"
                        );
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? "Creating…" : "Create Account"}
                  </Button>

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
