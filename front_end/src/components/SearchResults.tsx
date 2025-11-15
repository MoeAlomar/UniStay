import { useEffect, useMemo, useState } from "react";
import { PropertyCard } from "./PropertyCard";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { SlidersHorizontal, Grid3x3, List, MapIcon } from "lucide-react";
import { profile, type User } from "../services/auth";
import {
  list as listListings,
  districtOptions as fetchDistrictOptions,
  details as listingDetails,
} from "../services/listings";
import { getFavoriteIds } from "../services/favoritesLocal";

interface SearchResultsProps {
  onNavigate: (page: string, propertyId?: string) => void;
}

type PropertyItem = {
  id: string;
  image: string;
  price: number;
  title: string;
  location: string;
  distance: string;
  status: string;
  femaleOnly: boolean;
  studentDiscount: boolean;
  roommatesAllowed?: boolean;
};

export function SearchResults({ onNavigate }: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [showMap, setShowMap] = useState(false);

  // start empty – no mock flash
  const [items, setItems] = useState<PropertyItem[]>([]);

  const [districtOptions, setDistrictOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tabValue, setTabValue] = useState<"find" | "favorites">("find");

  const [favItems, setFavItems] = useState<PropertyItem[]>([]);
  const [favLoading, setFavLoading] = useState(false);
  const [favError, setFavError] = useState<string | null>(null);

  // Controlled filter states
  const [typeStudio, setTypeStudio] = useState(false);
  const [typeShared, setTypeShared] = useState(false); // maps to OTHER
  const [typeApartment, setTypeApartment] = useState(false);
  const [femaleOnly, setFemaleOnly] = useState(false);
  const [studentDiscount, setStudentDiscount] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [roommatesOnly, setRoommatesOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // control mobile filters overlay
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    // Initialize tab from URL, e.g., /?tab=favorites
    try {
      const params = new URLSearchParams(window.location.search);
      const initialTab = params.get("tab");
      if (initialTab === "favorites") setTabValue("favorites");
    } catch (_) {}

    (async () => {
      try {
        const u = await profile();
        setCurrentUser(u);
        setError(null);
        setLoading(true);
        const params: Record<string, any> = {};
        const [data, opts] = await Promise.all([
          listListings(params),
          fetchDistrictOptions(),
        ]);
        setDistrictOptions(opts);
        const labelMap = Object.fromEntries(
          opts.map((o) => [o.value, o.label])
        );
        setItems(
          data.map(
            (l: any): PropertyItem => {
              const placeholder =
                "https://images.unsplash.com/photo-1515263487990-61b07816b324?auto=format&fit=crop&w=720&q=60";
              const primary = Array.isArray(l.images)
                ? (l.images.find((i: any) => i.is_primary) || null)
                : null;
              const first =
                Array.isArray(l.images) && l.images.length
                  ? l.images[0]
                  : null;
              const imageUrl = primary?.url || first?.url || placeholder;
              return {
                id: String(l.id),
                image: imageUrl,
                price: Number(l.price),
                title: l.title,
                location: labelMap[l.district] || l.district || "",
                distance: "N/A",
                status: l.status,
                femaleOnly: !!l.female_only,
                roommatesAllowed: !!l.roommates_allowed,
                studentDiscount: !!l.student_discount,
              };
            }
          )
        );
      } catch (_) {
        // leave items as [] on error
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function loadFavorites() {
    try {
      setFavLoading(true);
      setFavError(null);
      const ids = getFavoriteIds();
      if (!ids.length) {
        setFavItems([]);
        return;
      }
      const [opts, list] = await Promise.all([
        fetchDistrictOptions(),
        Promise.all(
          ids.map(async (id) => {
            try {
              return await listingDetails(id);
            } catch (_) {
              return null;
            }
          })
        ),
      ]);
      const labelMap = Object.fromEntries(opts.map((o) => [o.value, o.label]));
      const transformed: PropertyItem[] = (list.filter(Boolean) as any[]).map(
        (l: any) => {
          const placeholder =
            "https://images.unsplash.com/photo-1515263487990-61b07816b324?auto=format&fit=crop&w=720&q=60";
          const primary = Array.isArray(l.images)
            ? (l.images.find((i: any) => i.is_primary) || null)
            : null;
          const first =
            Array.isArray(l.images) && l.images.length
              ? l.images[0]
              : null;
          const imageUrl = primary?.url || first?.url || placeholder;
          return {
            id: String(l.id),
            image: imageUrl,
            price: Number(l.price),
            title: l.title,
            location: labelMap[l.district] || l.district || "",
            distance: "N/A",
            status: l.status,
            femaleOnly: !!l.female_only,
            roommatesAllowed: !!l.roommates_allowed,
            studentDiscount: !!l.student_discount,
          };
        }
      );
      setFavItems(transformed);
    } catch (e: any) {
      setFavError("Failed to load favorites.");
    } finally {
      setFavLoading(false);
    }
  }

  useEffect(() => {
    if (tabValue === "favorites") {
      loadFavorites();
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("tab", "favorites");
        window.history.replaceState(null, "", url.toString());
      } catch (_) {}
    } else {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete("tab");
        window.history.replaceState(null, "", url.toString());
      } catch (_) {}
    }
  }, [tabValue]);

  const selectedTypes = useMemo(() => {
    const t: string[] = [];
    if (typeStudio) t.push("STUDIO");
    if (typeApartment) t.push("APARTMENT");
    if (typeShared) t.push("OTHER");
    return t;
  }, [typeStudio, typeShared, typeApartment]);

  async function applyFilters(overrides?: {
    priceRange?: [number, number];
    selectedTypes?: string[];
    femaleOnly?: boolean;
    studentDiscount?: boolean;
    availableOnly?: boolean;
    roommatesOnly?: boolean;
  }) {
    try {
      setLoading(true);
      setError(null);
      const effectivePriceRange = overrides?.priceRange ?? priceRange;
      const effectiveSelectedTypes = overrides?.selectedTypes ?? selectedTypes;
      const effectiveAvailableOnly =
        overrides?.availableOnly ?? availableOnly;
      const effectiveFemaleOnly =
        overrides?.femaleOnly ?? femaleOnly;
      const effectiveStudentDiscount =
        overrides?.studentDiscount ?? studentDiscount;
      const effectiveRoommatesOnly =
        overrides?.roommatesOnly ?? roommatesOnly;

      const params: Record<string, any> = {
        max_price: effectivePriceRange[1],
      };
      if (effectiveAvailableOnly) params.status = "AVAILABLE";
      if (effectiveFemaleOnly) params.female_only = true;
      if (effectiveStudentDiscount) params.student_discount = true;
      if (effectiveRoommatesOnly) params.roommates_allowed = true;

      const data = await listListings(params);
      const filtered = data.filter((l: any) => {
        if (
          effectivePriceRange[0] != null &&
          Number(l.price) < effectivePriceRange[0]
        )
          return false;
        if (
          effectivePriceRange[1] != null &&
          Number(l.price) > effectivePriceRange[1]
        )
          return false;
        if (
          effectiveSelectedTypes.length > 0 &&
          !effectiveSelectedTypes.includes(l.type)
        )
          return false;
        return true;
      });
      const labelMap = Object.fromEntries(
        districtOptions.map((o) => [o.value, o.label])
      );
      setItems(
        filtered.map(
          (l: any): PropertyItem => {
            const placeholder =
              "https://images.unsplash.com/photo-1515263487990-61b07816b324?auto=format&fit=crop&w=720&q=60";
            const primary = Array.isArray(l.images)
              ? (l.images.find((i: any) => i.is_primary) || null)
              : null;
            const first =
              Array.isArray(l.images) && l.images.length
                ? l.images[0]
                : null;
            const imageUrl = primary?.url || first?.url || placeholder;
            return {
              id: String(l.id),
              image: imageUrl,
              price: Number(l.price),
              title: l.title,
              location: labelMap[l.district] || l.district || "",
              status: l.status,
              femaleOnly: !!l.female_only,
              roommatesAllowed: !!l.roommates_allowed,
              studentDiscount: !!l.student_discount,
              distance: "N/A",
            };
          }
        )
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
    setAvailableOnly(false);
    setRoommatesOnly(false);
    setPriceRange([0, 5000]);
    await applyFilters({
      priceRange: [0, 5000],
      selectedTypes: [],
      femaleOnly: false,
      studentDiscount: false,
      availableOnly: false,
      roommatesOnly: false,
    });
  }

  return (
    <div className="min-h-screen bg-secondary">
      <div className="container mx-auto px-4 py-8">
        <Tabs
          value={tabValue}
          onValueChange={(v: string) => setTabValue(v as "find" | "favorites")}
        >
          <TabsList className="w-full mb-6">
            <TabsTrigger value="find">Find</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
          </TabsList>

          {/* FIND TAB */}
          <TabsContent value="find">
            <div className="flex gap-6">
              {/* Filter Sidebar (desktop) */}
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

                    {/* Property Type */}
                    <div className="mb-6">
                      <Label className="mb-3 block">Property Type</Label>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="studio"
                            checked={typeStudio}
                            onCheckedChange={(v: boolean | "indeterminate") =>
                              setTypeStudio(!!v)
                            }
                          />
                          <label
                            htmlFor="studio"
                            className="text-sm cursor-pointer"
                          >
                            Studio
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="other"
                            checked={typeShared}
                            onCheckedChange={(v: boolean | "indeterminate") =>
                              setTypeShared(!!v)
                            }
                          />
                          <label
                            htmlFor="other"
                            className="text-sm cursor-pointer"
                          >
                            Other
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="apartment"
                            checked={typeApartment}
                            onCheckedChange={(v: boolean | "indeterminate") =>
                              setTypeApartment(!!v)
                            }
                          />
                          <label
                            htmlFor="apartment"
                            className="text-sm cursor-pointer"
                          >
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
                          <Checkbox
                            id="available-only"
                            checked={availableOnly}
                            onCheckedChange={(v: boolean | "indeterminate") =>
                              setAvailableOnly(!!v)
                            }
                          />
                          <label
                            htmlFor="available-only"
                            className="text-sm cursor-pointer"
                          >
                            Available Only
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="female"
                            checked={femaleOnly}
                            onCheckedChange={(v: boolean | "indeterminate") =>
                              setFemaleOnly(!!v)
                            }
                          />
                          <label
                            htmlFor="female"
                            className="text-sm cursor-pointer"
                          >
                            Female Only
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="discount"
                            checked={studentDiscount}
                            onCheckedChange={(v: boolean | "indeterminate") =>
                              setStudentDiscount(!!v)
                            }
                          />
                          <label
                            htmlFor="discount"
                            className="text-sm cursor-pointer"
                          >
                            Student Discount
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="roommates"
                            checked={roommatesOnly}
                            onCheckedChange={(v: boolean | "indeterminate") =>
                              setRoommatesOnly(!!v)
                            }
                          />
                          <label
                            htmlFor="roommates"
                            className="text-sm cursor-pointer"
                          >
                            Roommates Allowed
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button
                        onClick={applyFilters}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        Apply Filters
                      </Button>
                      <Button
                        variant="outline"
                        onClick={resetFilters}
                        className="w-full"
                      >
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
                    {/* Mobile Filters trigger */}
                    <div className="md:hidden">
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => setMobileFiltersOpen(true)}
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                        Filters
                      </Button>
                    </div>

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

                {/* Mobile Filters Overlay */}
                {mobileFiltersOpen && (
                  <div className="fixed inset-0 z-50 bg-black/40 flex justify-start md:hidden">
                    <div className="h-full w-[85vw] max-w-sm bg-card shadow-xl p-4 overflow-y-auto">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Filters</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setMobileFiltersOpen(false)}
                        >
                          ✕
                        </Button>
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

                      {/* Property Type */}
                      <div className="mb-6">
                        <Label className="mb-3 block">Property Type</Label>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="m-studio"
                              checked={typeStudio}
                              onCheckedChange={(
                                v: boolean | "indeterminate"
                              ) => setTypeStudio(!!v)}
                            />
                            <label htmlFor="m-studio" className="text-sm">
                              Studio
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="m-other"
                              checked={typeShared}
                              onCheckedChange={(
                                v: boolean | "indeterminate"
                              ) => setTypeShared(!!v)}
                            />
                            <label htmlFor="m-other" className="text-sm">
                              Other
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="m-apartment"
                              checked={typeApartment}
                              onCheckedChange={(
                                v: boolean | "indeterminate"
                              ) => setTypeApartment(!!v)}
                            />
                            <label htmlFor="m-apartment" className="text-sm">
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
                            <Checkbox
                              id="m-available-only"
                              checked={availableOnly}
                              onCheckedChange={(
                                v: boolean | "indeterminate"
                              ) => setAvailableOnly(!!v)}
                            />
                            <label
                              htmlFor="m-available-only"
                              className="text-sm"
                            >
                              Available Only
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="m-female"
                              checked={femaleOnly}
                              onCheckedChange={(
                                v: boolean | "indeterminate"
                              ) => setFemaleOnly(!!v)}
                            />
                            <label htmlFor="m-female" className="text-sm">
                              Female Only
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="m-discount"
                              checked={studentDiscount}
                              onCheckedChange={(
                                v: boolean | "indeterminate"
                              ) => setStudentDiscount(!!v)}
                            />
                            <label htmlFor="m-discount" className="text-sm">
                              Student Discount
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="m-roommates"
                              checked={roommatesOnly}
                              onCheckedChange={(
                                v: boolean | "indeterminate"
                              ) => setRoommatesOnly(!!v)}
                            />
                            <label htmlFor="m-roommates" className="text-sm">
                              Roommates Allowed
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-3">
                        <Button
                          onClick={async () => {
                            await applyFilters();
                            setMobileFiltersOpen(false);
                          }}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          Apply Filters
                        </Button>
                        <Button
                          variant="outline"
                          onClick={async () => {
                            await resetFilters();
                            setMobileFiltersOpen(false);
                          }}
                          className="w-full"
                        >
                          Reset Filters
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mb-4 text-red-600 text-sm">{error}</div>
                )}

                {loading && (
                  <div className="mb-4 text-muted-foreground text-sm">
                    Loading...
                  </div>
                )}

                {/* Map Preview */}
                {showMap && (
                  <Card className="mb-6 overflow-hidden">
                    <div className="h-64 bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <MapIcon className="w-12 h-12 mx-auto mb-2" />
                        <p>Map View</p>
                        <p className="text-sm">
                          Google Maps integration would display here
                        </p>
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
          </TabsContent>

          {/* FAVORITES TAB */}
          <TabsContent value="favorites">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-foreground mb-1">Favorites</h2>
                  <p className="text-muted-foreground text-sm">
                    {favItems.length} saved listings
                  </p>
                </div>
                <Button variant="outline" onClick={() => setTabValue("find")}>
                  Back to Find
                </Button>
              </div>

              {favError && (
                <div className="mb-4 text-red-600 text-sm">{favError}</div>
              )}
              {favLoading && (
                <div className="mb-4 text-muted-foreground text-sm">
                  Loading...
                </div>
              )}

              {!favLoading && favItems.length === 0 && (
                <Card className="p-8 text-center text-muted-foreground">
                  No favorites yet. Tap the heart on any listing.
                </Card>
              )}

              {favItems.length > 0 && (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {favItems.map((property) => (
                    <PropertyCard
                      key={property.id}
                      {...property}
                      onClick={() => onNavigate("listing", property.id)}
                      onFavoriteToggle={(favorited) => {
                        if (!favorited) {
                          setFavItems((prev) =>
                            prev.filter((it) => it.id !== property.id)
                          );
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
