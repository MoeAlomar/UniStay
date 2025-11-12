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
      <div className="relative bg-gradient-to-br from-primary/10 to-secondary py-8 sm:py-12 md:py-20 px-3 sm:px-4">
        <div className="absolute inset-0 opacity-10">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1672912995257-0c8255289523?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwYWVyaWFsfGVufDF8fHx8MTc2MDM3Mjc3M3ww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Campus background"
            loading="eager"
            fetchPriority="high"
            data-cloudinary-transform="c_fill,w_1920,dpr_auto"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-2 sm:mb-3 md:mb-4 text-foreground leading-tight px-2">
              Darek — Student Housing Made Simple
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground px-2">
              A trusted platform connecting students and verified landlords across Saudi Arabia.
            </p>
          </div>
          {/* Overview Card */}
          <Card className="shadow-xl">
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="grid md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                <div>
                  <h3 className="mb-2 text-foreground text-base sm:text-lg">What is Darek?</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                    Darek is a platform that helps students discover safe, verified accommodation near universities, and enables landlords to list properties tailored for student needs. Our goal is to make student housing transparent, affordable, and easy to access.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 text-foreground text-base sm:text-lg">How it works</h3>
                  <ul className="text-muted-foreground text-xs sm:text-sm list-disc pl-4 sm:pl-5 space-y-1 leading-relaxed">
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
      <div className="bg-background py-8 sm:py-12 md:py-16 px-3 sm:px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-center mb-6 sm:mb-8 md:mb-12 text-foreground text-xl sm:text-2xl md:text-3xl">About Darek</h2>
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <div className="text-center md:text-left">
              <h3 className="mb-2 text-foreground text-base sm:text-lg">Our Mission</h3>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                Provide safe, verified, and student-friendly housing options across Saudi Arabia.
              </p>
            </div>
            <div className="text-center md:text-left">
              <h3 className="mb-2 text-foreground text-base sm:text-lg">For Students and other Users</h3>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                Discover verified accommodations nearby and connect directly with landlords.
              </p>
            </div>
            <div className="text-center md:text-left">
              <h3 className="mb-2 text-foreground text-base sm:text-lg">For Landlords</h3>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                List properties, manage listings, via your dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-background py-8 sm:py-12 md:py-16 px-3 sm:px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-center mb-6 sm:mb-8 md:mb-12 text-foreground text-xl sm:text-2xl md:text-3xl">
            Why Choose Darek?
          </h2>
          <div className="grid md:grid-cols-3 gap-6 sm:gap-7 md:gap-8">
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl">✓</span>
              </div>
              <h3 className="mb-2 text-foreground text-base sm:text-lg">Verified Listings</h3>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                All properties are verified by our team for safety and authenticity
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl">👥</span>
              </div>
              <h3 className="mb-2 text-foreground text-base sm:text-lg">Student Community</h3>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                Connect with fellow students and find compatible roommates
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl">💰</span>
              </div>
              <h3 className="mb-2 text-foreground text-base sm:text-lg">Student Discounts</h3>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                Special rates and offers exclusively for students
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-background py-8 sm:py-12 md:py-16 px-3 sm:px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-center mb-6 sm:mb-8 text-foreground text-xl sm:text-2xl md:text-3xl">Frequently Asked Questions</h2>
          <div className="space-y-3 sm:space-y-4">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <h3 className="text-foreground mb-1.5 sm:mb-2 text-sm sm:text-base">Who can use Darek?</h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">Students, employees and landlords across Saudi Arabia. Students should register with a `.edu.sa` email.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <h3 className="text-foreground mb-1.5 sm:mb-2 text-sm sm:text-base">Why do students need an `.edu.sa` email?</h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">Student accounts require `.edu.sa` to be verified as a student. Landlords and other users can register with any valid email.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <h3 className="text-foreground mb-1.5 sm:mb-2 text-sm sm:text-base">How do I list a property?</h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">Register as a landlord, then access your listings from the top navigation to create and manage listings, use the dashboard to see your listings status.</p>
              </CardContent>
            </Card>
          </div>
          <div className="text-center mt-6 sm:mt-8">
            <Button
              onClick={() => {
                if (isLoggedIn) {
                  onNavigate(userType === "landlord" ? "dashboard" : "profile");
                } else {
                  onNavigate("register");
                }
              }}
              className="text-sm sm:text-base px-4 sm:px-6 h-9 sm:h-10"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
