import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Home,
  MessageSquare,
  CheckCircle2,
  Settings,
  PlusCircle,
  Edit,
  Trash2,
} from "lucide-react";
import { PropertyCard } from "./PropertyCard";

interface OwnerDashboardProps {
  onNavigate: (page: string) => void;
}

const mockListings = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1515263487990-61b07816b324?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBidWlsZGluZ3xlbnwxfHx8fDE3NjAzNjMxMTl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    price: 1800,
    title: "Modern Studio Apartment",
    location: "Al Malqa, Riyadh",
    distance: "0.8 km",
    verified: true,
    femaleOnly: true,
    studentDiscount: true,
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1649429710616-dad56ce9a076?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwYXBhcnRtZW50JTIwaW50ZXJpb3J8ZW58MXx8fHwxNzYwMzcyNzczfDA&ixlib=rb-4.1.0&q=80&w=1080",
    price: 2500,
    title: "Spacious 2BR Apartment",
    location: "Olaya, Riyadh",
    distance: "2.5 km",
    verified: true,
    femaleOnly: false,
    studentDiscount: false,
  },
];

export function OwnerDashboard({ onNavigate }: OwnerDashboardProps) {
  const [showNewListing, setShowNewListing] = useState(false);
  const [femaleOnly, setFemaleOnly] = useState(false);
  const [studentDiscount, setStudentDiscount] = useState(false);
  const [stats, setStats] = useState<{ total_listings: number; available: number; reserved: number; draft: number } | null>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [district, setDistrict] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { dashboard } = await import("../services/listings");
        const d = await dashboard();
        setStats({ total_listings: d.total_listings, available: d.available, reserved: d.reserved, draft: d.draft });
        setListings(
          d.listings.map((l: any) => ({
            id: String(l.id),
            image: "https://images.unsplash.com/photo-1515263487990-61b07816b324",
            price: l.price,
            title: l.title,
            location: l.district || "",
            distance: "",
          }))
        );
      } catch (_) {
        // keep mock
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-secondary">
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden md:block w-64 bg-sidebar border-r border-sidebar-border h-screen sticky top-0">
          <div className="p-6">
            <h2 className="mb-6 text-sidebar-foreground">Owner Dashboard</h2>
            <nav className="space-y-2">
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
                <Home className="w-5 h-5" />
                <span>My Listings</span>
              </button>
              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
                onClick={() => onNavigate("messages")}
              >
                <MessageSquare className="w-5 h-5" />
                <span>Messages</span>
                <span className="ml-auto bg-primary text-white text-xs px-2 py-1 rounded-full">
                  3
                </span>
              </button>
              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
                onClick={() => onNavigate("verification")}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Verification</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors">
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-foreground">My Listings</h1>
              <Button onClick={() => setShowNewListing(!showNewListing)}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Add New Listing
              </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">
                    Total Listings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl text-foreground">{stats?.total_listings ?? 12}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">
                    Active Chats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl text-foreground">{stats ? stats.available + stats.reserved : 8}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">
                    Verified
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl text-foreground">{stats?.available ?? 10}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">
                    Pending
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl text-foreground">{stats?.draft ?? 2}</div>
                </CardContent>
              </Card>
            </div>

            {/* New Listing Form */}
            {showNewListing && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Create New Listing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="title">Property Title</Label>
                        <Input id="title" placeholder="e.g., Modern Studio Apartment" value={title} onChange={(e) => setTitle(e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="price">Monthly Rent (SAR)</Label>
                        <Input id="price" type="number" placeholder="1800" value={price as any} onChange={(e) => setPrice(Number(e.target.value))} />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input id="location" placeholder="e.g., Al Malqa, Riyadh" value={district} onChange={(e) => setDistrict(e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="distance">Distance from Campus (km)</Label>
                        <Input id="distance" type="number" placeholder="0.8" />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" placeholder="Describe your property..." rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <Label htmlFor="bedrooms">Bedrooms</Label>
                        <Input id="bedrooms" type="number" placeholder="1" />
                      </div>
                      <div>
                        <Label htmlFor="bathrooms">Bathrooms</Label>
                        <Input id="bathrooms" type="number" placeholder="1" />
                      </div>
                      <div>
                        <Label htmlFor="area">Area (m²)</Label>
                        <Input id="area" type="number" placeholder="45" />
                      </div>
                    </div>

                    <div>
                      <Label>Property Photos</Label>
                      <div className="mt-2 border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors">
                        <PlusCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload photos
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="female-only">Female Only</Label>
                          <p className="text-sm text-muted-foreground">
                            This property is for female tenants only
                          </p>
                        </div>
                        <Switch
                          id="female-only"
                          checked={femaleOnly}
                          onCheckedChange={setFemaleOnly}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="student-discount">Student Discount</Label>
                          <p className="text-sm text-muted-foreground">
                            Offer special rates for students
                          </p>
                        </div>
                        <Switch
                          id="student-discount"
                          checked={studentDiscount}
                          onCheckedChange={setStudentDiscount}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button className="flex-1" onClick={async () => {
                        try {
                          const { create } = await import("../services/listings");
                          const created = await create({
                            id_type: "NATIONAL_ID",
                            owner_identification_id: "0000000000",
                            deed_number: "0000000000",
                            title,
                            description,
                            price: typeof price === "number" ? price : 0,
                            type: "APARTMENT",
                            female_only: femaleOnly,
                            roommates_allowed: false,
                            student_discount: studentDiscount,
                            status: "DRAFT",
                            district,
                            location_link: "",
                          });
                          setShowNewListing(false);
                          setListings((prev) => [{ id: String(created.id), image: "https://images.unsplash.com/photo-1515263487990-61b07816b324", price: created.price, title: created.title, location: created.district, distance: "" }, ...prev]);
                        } catch (_) {}
                      }}>Publish Listing</Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowNewListing(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Existing Listings */}
            <Card>
              <CardHeader>
                <CardTitle>Your Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockListings.map((listing) => (
                    <div
                      key={listing.id}
                      className="flex items-center gap-4 p-4 border border-border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <img
                        src={listing.image}
                        alt={listing.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="text-foreground mb-1">{listing.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {listing.location}
                        </p>
                        <p className="text-primary">
                          {listing.price.toLocaleString()} SAR/mo
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
