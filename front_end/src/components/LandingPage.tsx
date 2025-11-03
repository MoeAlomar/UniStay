import { Search, Home, Users, Building2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
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
              Find Your Perfect Student Home in KSA
            </h1>
            <p className="text-lg text-muted-foreground">
              Verified housing, trusted roommates, student-friendly prices
            </p>
          </div>

          {/* Search Card */}
          <Card className="shadow-xl">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="City" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="riyadh">Riyadh</SelectItem>
                    <SelectItem value="jeddah">Jeddah</SelectItem>
                    <SelectItem value="dammam">Dammam</SelectItem>
                    <SelectItem value="mecca">Mecca</SelectItem>
                  </SelectContent>
                </Select>

                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Price Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-1000">0 - 1,000 SAR</SelectItem>
                    <SelectItem value="1000-2000">1,000 - 2,000 SAR</SelectItem>
                    <SelectItem value="2000-3000">2,000 - 3,000 SAR</SelectItem>
                    <SelectItem value="3000+">3,000+ SAR</SelectItem>
                  </SelectContent>
                </Select>

                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Distance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1km">Within 1 km</SelectItem>
                    <SelectItem value="3km">Within 3 km</SelectItem>
                    <SelectItem value="5km">Within 5 km</SelectItem>
                    <SelectItem value="any">Any distance</SelectItem>
                  </SelectContent>
                </Select>

                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="female">Female Only</SelectItem>
                    <SelectItem value="male">Male Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() => onNavigate("search")}
              >
                <Search className="w-5 h-5 mr-2" />
                Search Housing
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="grid md:grid-cols-3 gap-6">
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onNavigate("search")}
          >
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Home className="w-8 h-8 text-primary" />
              </div>
              <h3 className="mb-2 text-foreground">Find Housing</h3>
              <p className="text-muted-foreground text-sm">
                Browse verified student apartments and rooms near your campus
              </p>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onNavigate("roommate")}
          >
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="mb-2 text-foreground">Find Roommate</h3>
              <p className="text-muted-foreground text-sm">
                Connect with students looking to share accommodation
              </p>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onNavigate("dashboard")}
          >
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="mb-2 text-foreground">For Landlords</h3>
              <p className="text-muted-foreground text-sm">
                List your property and connect with student tenants
              </p>
            </CardContent>
          </Card>
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
    </div>
  );
}
