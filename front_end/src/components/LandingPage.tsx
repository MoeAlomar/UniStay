import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface LandingPageProps {
  onNavigate: (page: string) => void;
  isLoggedIn?: boolean;
  userType?: "student" | "landlord";
}

export function LandingPage({ onNavigate, isLoggedIn, userType }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-secondary">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/10 to-secondary py-20 px-4">
        <div className="absolute inset-0 opacity-10">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1672912995257-0c8255289523?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwYWVyaWFsfGVufDF8fHx8MTc2MDM3Mjc3M3ww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Campus background"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl mb-4 text-foreground">
              UniStay KSA — Student Housing Made Simple
            </h1>
            <p className="text-lg text-muted-foreground">
              A trusted platform connecting students and verified landlords across Saudi Arabia.
            </p>
          </div>
          {/* Overview Card */}
          <Card className="shadow-xl">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="mb-2 text-foreground">What is UniStay KSA?</h3>
                  <p className="text-muted-foreground text-sm">
                    UniStay KSA is a platform that helps students discover safe, verified accommodation near universities, and enables landlords to list properties tailored for student needs. Our goal is to make student housing transparent, affordable, and easy to access.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 text-foreground">How it works</h3>
                  <ul className="text-muted-foreground text-sm list-disc pl-5 space-y-1">
                    <li>Students register with their `.edu.sa` email and verify it.</li>
                    <li>Browse verified properties and connect with landlords.</li>
                    <li>Landlords manage listings and messages via their dashboard.</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* About Section */}
      <div className="bg-white py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-center mb-12 text-foreground">About UniStay KSA</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="mb-2 text-foreground">Our Mission</h3>
              <p className="text-muted-foreground text-sm">
                Provide safe, verified, and student-friendly housing options across Saudi Arabia.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-foreground">For Students and other Users</h3>
              <p className="text-muted-foreground text-sm">
                Discover verified accommodations nearby and connect directly with landlords.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-foreground">For Landlords</h3>
              <p className="text-muted-foreground text-sm">
                List properties, manage listings, via your dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-center mb-12 text-foreground">
            Why Choose UniStay KSA?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✓</span>
              </div>
              <h3 className="mb-2 text-foreground">Verified Listings</h3>
              <p className="text-muted-foreground text-sm">
                All properties are verified by our team for safety and authenticity
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="mb-2 text-foreground">Student Community</h3>
              <p className="text-muted-foreground text-sm">
                Connect with fellow students and find compatible roommates
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="mb-2 text-foreground">Student Discounts</h3>
              <p className="text-muted-foreground text-sm">
                Special rates and offers exclusively for students
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-center mb-8 text-foreground">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-foreground mb-2">Who can use UniStay KSA?</h3>
                <p className="text-muted-foreground text-sm">Students, employees and landlords across Saudi Arabia. Students should register with a `.edu.sa` email.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="text-foreground mb-2">Why do students need an `.edu.sa` email?</h3>
                <p className="text-muted-foreground text-sm">Student accounts require `.edu.sa` to be verified as a student. Landlords and other users can register with any valid email.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="text-foreground mb-2">How do I list a property?</h3>
                <p className="text-muted-foreground text-sm">Register as a landlord, then access your listings from the top navigation to create and manage listings, use the dashboard to see your listings status.</p>
              </CardContent>
            </Card>
          </div>
          <div className="text-center mt-8">
            <Button
              onClick={() => {
                if (isLoggedIn) {
                  onNavigate(userType === "landlord" ? "dashboard" : "profile");
                } else {
                  onNavigate("register");
                }
              }}
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
