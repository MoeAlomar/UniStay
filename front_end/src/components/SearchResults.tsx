import { useEffect, useMemo, useState } from "react";
import { PropertyCard } from "./PropertyCard";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { SlidersHorizontal, Grid3x3, List, MapIcon } from "lucide-react";
import { profile, type User } from "../services/auth";
import { list as listListings } from "../services/listings";

interface SearchResultsProps {
  onNavigate: (page: string, propertyId?: string) => void;
}

const mockProperties = [
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
    image: "https://images.unsplash.com/photo-1555662328-4c2c27e7e4c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwZG9ybWl0b3J5JTIwcm9vbXxlbnwxfHx8fDE3NjAzNDE0MDB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    price: 1200,
    title: "Shared Student Room",
    location: "Al Yasmin, Riyadh",
    distance: "1.2 km",
    verified: true,
    femaleOnly: false,
    studentDiscount: true,
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1649429710616-dad56ce9a076?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwYXBhcnRtZW50JTIwaW50ZXJpb3J8ZW58MXx8fHwxNzYwMzcyNzczfDA&ixlib=rb-4.1.0&q=80&w=1080",
    price: 2500,
    title: "Spacious 2BR Apartment",
    location: "Olaya, Riyadh",
    distance: "2.5 km",
    verified: true,
    femaleOnly: false,
    studentDiscount: false,
  },
  {
    id: "4",
    image: "https://images.unsplash.com/photo-1515263487990-61b07816b324?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBidWlsZGluZ3xlbnwxfHx8fDE3NjAzNjMxMTl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    price: 1500,
    title: "Cozy Studio Near Campus",
    location: "King Saud University Area",
    distance: "0.5 km",
    verified: true,
    femaleOnly: true,
    studentDiscount: true,
  },
  {
    id: "5",
    image: "https://images.unsplash.com/photo-1555662328-4c2c27e7e4c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwZG9ybWl0b3J5JTIwcm9vbXxlbnwxfHx8fDE3NjAzNDE0MDB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    price: 1600,
    title: "Furnished Room with Utilities",
    location: "Al Nakheel, Riyadh",
    distance: "1.8 km",
    verified: false,
    femaleOnly: false,
    studentDiscount: true,
  },
  {
    id: "6",
    image: "https://images.unsplash.com/photo-1649429710616-dad56ce9a076?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwYXBhcnRtZW50JTIwaW50ZXJpb3J8ZW58MXx8fHwxNzYwMzcyNzczfDA&ixlib=rb-4.1.0&q=80&w=1080",
    price: 2200,
    title: "Luxury Student Apartment",
    location: "Diplomatic Quarter",
    distance: "3.2 km",
    verified: true,
    femaleOnly: true,
    studentDiscount: false,
  },
];

export function SearchResults({ onNavigate }: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [showMap, setShowMap] = useState(false);
  const [items, setItems] = useState<typeof mockProperties>(mockProperties);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Controlled filter states
  const [typeStudio, setTypeStudio] = useState(false);
  const [typeShared, setTypeShared] = useState(false); // maps to OTHER
  const [typeApartment, setTypeApartment] = useState(false);
  const [femaleOnly, setFemaleOnly] = useState(false);
  const [studentDiscount, setStudentDiscount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Load user to determine role-based default filtering
        const u = await profile();
        setCurrentUser(u);
        setError(null);
        setLoading(true);
        const params: Record<string, any> = {};
        if (u.role !== "landlord") params.status = "AVAILABLE";
        const data = await listListings(params);
        setItems(
          data.map((l: any) => ({
            id: String(l.id),
            image:
              "https://images.unsplash.com/photo-1515263487990-61b07816b324?auto=format&fit=crop&w=1080&q=60",
            price: Number(l.price),
            title: l.title,
            location: l.district || "",
            distance: "",
            verified: true,
            femaleOnly: !!l.female_only,
            studentDiscount: !!l.student_discount,
          }))
        );
      } catch (_) {
        // keep mock on error (e.g., not authenticated)
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectedTypeParam = useMemo(() => {
    const count = [typeStudio, typeShared, typeApartment].filter(Boolean).length;
    if (count !== 1) return undefined;
    if (typeStudio) return "STUDIO";
    if (typeApartment) return "APARTMENT";
    if (typeShared) return "OTHER";
    return undefined;
  }, [typeStudio, typeShared, typeApartment]);

  async function applyFilters() {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, any> = {
        max_price: priceRange[1],
      };
      if (currentUser?.role !== "landlord") params.status = "AVAILABLE";
      if (femaleOnly) params.female_only = true;
      if (studentDiscount) params.student_discount = true;
      if (selectedTypeParam) params.type = selectedTypeParam;
      const data = await listListings(params);
      setItems(
        data.map((l: any) => ({
          id: String(l.id),
          image:
            "https://images.unsplash.com/photo-1515263487990-61b07816b324?auto=format&fit=crop&w=1080&q=60",
          price: Number(l.price),
          title: l.title,
          location: l.district || "",
          distance: "",
          verified: true,
          femaleOnly: !!l.female_only,
          studentDiscount: !!l.student_discount,
        }))
      );
    } catch (e: any) {
      setError("Failed to apply filters. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function resetFilters() {
    setTypeStudio(false);
    setTypeShared(false);
    setTypeApartment(false);
    setFemaleOnly(false);
    setStudentDiscount(false);
    setPriceRange([0, 5000]);
    await applyFilters();
  }

  return (
    <div className="min-h-screen bg-secondary">
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Filter Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <SlidersHorizontal className="w-5 h-5 text-primary" />
                  <h3 className="text-foreground">Filters</h3>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <Label className="mb-3 block">
                    Price Range: {priceRange[0]} - {priceRange[1]} SAR
                  </Label>
                  <Slider
                    min={0}
                    max={5000}
                    step={100}
                    value={priceRange}
                    onValueChange={setPriceRange}
                    className="mb-2"
                  />
                </div>

                {/* Property Type (select one) */}
                <div className="mb-6">
                  <Label className="mb-3 block">Property Type</Label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Checkbox id="studio" checked={typeStudio} onCheckedChange={(v) => setTypeStudio(!!v)} />
                      <label htmlFor="studio" className="text-sm cursor-pointer">
                        Studio
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="shared" checked={typeShared} onCheckedChange={(v) => setTypeShared(!!v)} />
                      <label htmlFor="shared" className="text-sm cursor-pointer">
                        Shared Room
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="apartment" checked={typeApartment} onCheckedChange={(v) => setTypeApartment(!!v)} />
                      <label htmlFor="apartment" className="text-sm cursor-pointer">
                        Apartment
                      </label>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="mb-6">
                  <Label className="mb-3 block">Features</Label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Checkbox id="verified" defaultChecked />
                      <label htmlFor="verified" className="text-sm cursor-pointer">
                        Verified Only
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="female" checked={femaleOnly} onCheckedChange={(v) => setFemaleOnly(!!v)} />
                      <label htmlFor="female" className="text-sm cursor-pointer">
                        Female Only
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="discount" checked={studentDiscount} onCheckedChange={(v) => setStudentDiscount(!!v)} />
                      <label htmlFor="discount" className="text-sm cursor-pointer">
                        Student Discount
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="furnished" />
                      <label htmlFor="furnished" className="text-sm cursor-pointer">
                        Furnished
                      </label>
                    </div>
                  </div>
                </div>

                {/* Distance */}
                <div className="mb-6">
                  <Label className="mb-3 block">Distance from Campus</Label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Checkbox id="1km" />
                      <label htmlFor="1km" className="text-sm cursor-pointer">
                        Within 1 km
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="3km" />
                      <label htmlFor="3km" className="text-sm cursor-pointer">
                        Within 3 km
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="5km" />
                      <label htmlFor="5km" className="text-sm cursor-pointer">
                        Within 5 km
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button onClick={applyFilters} className="w-full bg-green-600 hover:bg-green-700">
                    Apply Filters
                  </Button>
                  <Button variant="outline" onClick={resetFilters} className="w-full">
                    Reset Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Area */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-foreground mb-1">
                  Student Housing in Riyadh
                </h2>
                <p className="text-muted-foreground text-sm">
                  {items.length} properties found
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowMap(!showMap)}
                >
                  <MapIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {error && (
              <div className="mb-4 text-red-600 text-sm">{error}</div>
            )}

            {loading && (
              <div className="mb-4 text-muted-foreground text-sm">Loading...</div>
            )}

            {/* Map Preview */}
            {showMap && (
              <Card className="mb-6 overflow-hidden">
                <div className="h-64 bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <MapIcon className="w-12 h-12 mx-auto mb-2" />
                    <p>Map View</p>
                    <p className="text-sm">Google Maps integration would display here</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Property Grid */}
            <div
              className={
                viewMode === "grid"
                  ? "grid md:grid-cols-2 xl:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {items.map((property) => (
                <PropertyCard
                  key={property.id}
                  {...property}
                  onClick={() => onNavigate("listing", property.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
