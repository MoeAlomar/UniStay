import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Progress } from "./ui/progress";
import {
  Home,
  MessageSquare,
  PlusCircle,
  Edit,
  Trash2,
} from "lucide-react";
import { PropertyCard } from "./PropertyCard";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { districtOptions as fetchDistrictOptions } from "../services/listings";
import { getAmenitiesForListing, setAmenitiesForListing, removeAmenitiesForListing } from "../services/amenitiesLocal";
import { bulkUploadImages, listImagesForListing } from "../services/listingImages";

interface OwnerDashboardProps {
  onNavigate: (page: string, propertyId?: string) => void;
}


export function OwnerDashboard({ onNavigate }: OwnerDashboardProps) {
  const [showNewListing, setShowNewListing] = useState(false);
  const [femaleOnly, setFemaleOnly] = useState(false);
  const [roommatesAllowed, setRoommatesAllowed] = useState(false);
  const [studentDiscount, setStudentDiscount] = useState(false);
  const [stats, setStats] = useState<{ total_listings: number; available: number; reserved: number; draft: number } | null>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<any | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [districtValue, setDistrictValue] = useState<string>("");
  const [districtOptions, setDistrictOptions] = useState<{ value: string; label: string }[]>([]);
  const [locationLink, setLocationLink] = useState<string>("");
  const [idType, setIdType] = useState<string>("");
  const [idNumber, setIdNumber] = useState<string>("");
  const [deedNumber, setDeedNumber] = useState<string>("");
  const [description, setDescription] = useState("");
  const [bedrooms, setBedrooms] = useState<number | "">("");
  const [bathrooms, setBathrooms] = useState<number | "">("");
  const [area, setArea] = useState<number | "">("");
  const [formError, setFormError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [statusValue, setStatusValue] = useState<"AVAILABLE" | "RESERVED" | "DRAFT">("DRAFT");
  const [typeValue, setTypeValue] = useState<string>("APARTMENT");
  const [amenities, setAmenities] = useState<{ title: string; symbol: string }[]>([]);
  const [amenityTitle, setAmenityTitle] = useState<string>("");
  const [amenitySymbol, setAmenitySymbol] = useState<string>("");

  // Photo upload state
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper: reset the new-listing form to initial defaults to avoid stale values
  const resetNewListingForm = () => {
    setFemaleOnly(false);
    setRoommatesAllowed(false);
    setStudentDiscount(false);
    setTitle("");
    setPrice("");
    setDistrictValue("");
    setLocationLink("");
    setIdType("");
    setIdNumber("");
    setDeedNumber("");
    setDescription("");
    setBedrooms("");
    setBathrooms("");
    setArea("");
    setFormError(null);
    setStatusValue("DRAFT");
    setTypeValue("APARTMENT");
    setAmenities([]);
    setAmenityTitle("");
    setAmenitySymbol("");
    setPhotoFiles([]);
    setPhotoPreviews([]);
    setUploadProgress(0);
    setPhotoError(null);
  };

  // Photo helpers: drag-drop, validation, and removal
  const MAX_FILES = 10;
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  function handleAddFiles(files: File[]) {
    if (!files || files.length === 0) return;
    setPhotoError(null);
    const remaining = Math.max(0, MAX_FILES - photoFiles.length);
    const accepted: File[] = [];
    const previews: string[] = [];
    for (const f of files) {
      const okType = f.type?.startsWith("image/") ?? true;
      const okSize = typeof f.size === "number" ? f.size <= MAX_SIZE : true;
      if (!okType) {
        setPhotoError(`Unsupported file type: ${f.name}`);
        continue;
      }
      if (!okSize) {
        setPhotoError(`File exceeds 5MB: ${f.name}`);
        continue;
      }
      accepted.push(f);
      previews.push(URL.createObjectURL(f));
      if (accepted.length >= remaining) break;
    }
    if (accepted.length === 0) return;
    if (files.length > remaining) {
      setPhotoError(`Only ${remaining} more images allowed (max ${MAX_FILES}).`);
    }
    setPhotoFiles((prev) => [...prev, ...accepted]);
    setPhotoPreviews((prev) => [...prev, ...previews]);
  }

  function removePhotoAt(index: number) {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => {
      const next = prev.filter((_, i) => i !== index);
      const removed = prev[index];
      try { if (removed) URL.revokeObjectURL(removed); } catch (_) {}
      return next;
    });
    setPhotoError(null);
  }

  // Common amenity presets for quick selection in tabs
  const COMMON_AMENITIES: { title: string; symbol: string }[] = [
    { title: "Wi‑Fi", symbol: "📶" },
    { title: "Air Conditioning", symbol: "❄️" },
    { title: "Parking", symbol: "🚗" },
    { title: "Furnished", symbol: "🛋️" },
    { title: "Washer", symbol: "🧺" },
    { title: "Private Bathroom", symbol: "🚿" },
    { title: "Heating", symbol: "🔥" },
    { title: "Security", symbol: "🔒" },
  ];
  const AMENITY_SYMBOL_PRESETS = ["📶", "❄️", "🚗", "🛋️", "🔒", "🧺", "🚿", "🔥", "🍽️"];

  useEffect(() => {
    (async () => {
      try {
        const { dashboard } = await import("../services/listings");
        const d = await dashboard();
        setStats({ total_listings: d.total_listings, available: d.available, reserved: d.reserved, draft: d.draft });
        setListings(
          d.listings.map((l: any) => {
            const primary = Array.isArray(l.images) ? (l.images.find((i: any) => i.is_primary) || null) : null;
            const first = Array.isArray(l.images) && l.images.length ? l.images[0] : null;
            const imageUrl = (primary?.url || first?.url || "https://images.unsplash.com/photo-1515263487990-61b07816b324");
            return {
              id: String(l.id),
              image: imageUrl,
              price: Number(l.price),
              title: l.title,
              location: l.district || "",
              description: l.description || "",
              type: l.type || "",
              femaleOnly: !!l.female_only,
              roommatesAllowed: !!l.roommates_allowed,
              studentDiscount: !!l.student_discount,
              status: l.status,
              locationLink: l.location_link || "",
              bedrooms: l.bedrooms ?? null,
              bathrooms: l.bathrooms ?? null,
              area: l.area ?? null,
              idType: l.id_type || "",
              idNumber: l.owner_identification_id || "",
              deedNumber: l.deed_number || "",
              amenities: getAmenitiesForListing(l.id),
            };
          })
        );
      } catch (_) {
        // keep mock
      }
      try {
        const opts = await fetchDistrictOptions();
        // Ensure alphabetical ordering by label on the client as well
        setDistrictOptions(opts.sort((a, b) => a.label.localeCompare(b.label)));
      } catch (_) {}
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
              {/* Verification and Settings removed */}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-foreground">My Listings</h1>
              <Button onClick={() => {
                // When opening the form, ensure it's pristine
                if (!showNewListing) resetNewListingForm();
                setShowNewListing(!showNewListing);
              }}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Add New Listing
              </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
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
                    Verified Listings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl text-foreground">{stats ? stats.available + stats.reserved : 10}</div>
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
                  <Tabs defaultValue="details">
                    <TabsList className="mb-4 gap-3">
                      <TabsTrigger value="details" className="px-5 py-3 text-sm font-medium">Details</TabsTrigger>
                      <TabsTrigger value="amenities" className="px-5 py-3 text-sm font-medium">Amenities</TabsTrigger>
                    </TabsList>
                    <TabsContent value="details">
                      <div className="space-y-8">
                        <div className="grid md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <Label htmlFor="title">Property Title</Label>
                            <Input id="title" placeholder="e.g., Modern Apartment" value={title} onChange={(e) => setTitle(e.target.value)} />
                          </div>
                          <div className="space-y-3">
                            <Label htmlFor="price">Monthly Rent (SAR)</Label>
                            <Input id="price" type="number" placeholder="2000" value={price as any} onChange={(e) => setPrice(Number(e.target.value))} />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 mt-6">
                          <div className="space-y-3">
                            <Label>District</Label>
                            <Select value={districtValue} onValueChange={setDistrictValue}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                {districtOptions.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-3">
                            <Label htmlFor="location_link">Location Link</Label>
                            <Input id="location_link" type="url" placeholder="https://maps.google.com/..." value={locationLink} onChange={(e) => setLocationLink(e.target.value)} />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 mt-6">
                          <div className="space-y-3">
                            <Label>ID Type</Label>
                            <Select value={idType} onValueChange={setIdType}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select ID Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="National_ID">National ID</SelectItem>
                                <SelectItem value="Resident_ID">Resident ID</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-3">
                            <Label htmlFor="id_number">ID Number</Label>
                            <Input
                              id="id_number"
                              inputMode="numeric"
                              placeholder="10 digits"
                              value={idNumber}
                              onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                            />
                            <p className="text-xs text-muted-foreground mt-1">Exactly 10 digits</p>
                          </div>
                          <div className="space-y-3">
                            <Label htmlFor="deed_number">Deed Number</Label>
                            <Input
                              id="deed_number"
                              inputMode="numeric"
                              placeholder="10 digits"
                              value={deedNumber}
                              onChange={(e) => setDeedNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                            />
                            <p className="text-xs text-muted-foreground mt-1">Exactly 10 digits</p>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 mt-6">
                          <div className="space-y-3">
                            <Label>Status</Label>
                            <Select value={statusValue} onValueChange={(v: "DRAFT" | "AVAILABLE" | "RESERVED") => setStatusValue(v)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="DRAFT">Draft</SelectItem>
                                <SelectItem value="AVAILABLE">Available</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-3">
                            <Label>Property Type</Label>
                            <Select value={typeValue} onValueChange={setTypeValue}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="APARTMENT">Apartment</SelectItem>
                                <SelectItem value="STUDIO">Studio</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="mt-6 space-y-3">
                          <Label htmlFor="description">Description</Label>
                          <Textarea id="description" placeholder="Describe your property..." rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 mt-6">
                          <div className="space-y-3">
                            <Label htmlFor="bedrooms">Bedrooms</Label>
                            <Input id="bedrooms" type="number" placeholder="1" value={bedrooms as any} onChange={(e) => setBedrooms(Number(e.target.value))} />
                          </div>
                          <div className="space-y-3">
                            <Label htmlFor="bathrooms">Bathrooms</Label>
                            <Input id="bathrooms" type="number" placeholder="1" value={bathrooms as any} onChange={(e) => setBathrooms(Number(e.target.value))} />
                          </div>
                          <div className="space-y-3">
                            <Label htmlFor="area">Area (m²)</Label>
                            <Input id="area" type="number" placeholder="45" value={area as any} onChange={(e) => setArea(Number(e.target.value))} />
                          </div>
                        </div>

                        <div>
                          <Label>Property Photos</Label>
                          <div
                            className="mt-2 border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => {
                              e.preventDefault();
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              const files = Array.from(e.dataTransfer.files || []);
                              handleAddFiles(files);
                            }}
                          >
                            <PlusCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Click or drag to upload photos</p>
                            <p className="text-xs text-muted-foreground mt-1">Up to 10 images, max 5MB each</p>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                handleAddFiles(files);
                                e.currentTarget.value = ""; // reset for re-selecting same files
                              }}
                            />
                          </div>
                          {photoError && (
                            <div className="mt-2 text-red-600 text-sm">{photoError}</div>
                          )}
                          {photoPreviews.length > 0 && (
                            <div className="mt-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {photoPreviews.map((src, idx) => (
                                  <div key={src} className="relative group">
                                    <img src={src} alt={`Selected ${idx + 1}`} className="w-full h-24 object-cover rounded-md border" />
                                    <button
                                      type="button"
                                      className="absolute top-2 right-2 bg-card/80 hover:bg-card text-foreground text-xs px-2 py-1 rounded-md border opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => removePhotoAt(idx)}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-2 text-xs text-muted-foreground">{photoFiles.length} selected</div>
                              {uploadProgress > 0 && uploadProgress < 100 && (
                                <div className="mt-3"><Progress value={uploadProgress} /></div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-6 pt-6 border-t mt-8">
                          <div className="flex items-center gap-3">
                            <Switch
                              id="female-only"
                              checked={femaleOnly}
                              onCheckedChange={setFemaleOnly}
                            />
                            <Label htmlFor="female-only" className="cursor-pointer font-medium">Female Only</Label>
                          </div>

                          <div className="flex items-center gap-3">
                            <Switch
                              id="student-discount"
                              checked={studentDiscount}
                              onCheckedChange={setStudentDiscount}
                            />
                            <Label htmlFor="student-discount" className="cursor-pointer font-medium">Student Discount</Label>
                          </div>

                          <div className="flex items-center gap-3">
                            <Switch
                              id="roommates-allowed"
                              checked={roommatesAllowed}
                              onCheckedChange={setRoommatesAllowed}
                            />
                            <Label htmlFor="roommates-allowed" className="cursor-pointer font-medium">Roommates Allowed</Label>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          {formError && (
                            <div className="text-red-600 text-sm mb-2">{formError}</div>
                          )}
                          <Button className="flex-1" disabled={publishing} onClick={async () => {
                            try {
                              // Frontend validation aligned with DB constraints
                              if (!idType) {
                                setFormError("Please select an ID type.");
                                return;
                              }
                              if (statusValue !== "DRAFT") {
                                if (idNumber.length !== 10 || !/^\d{10}$/.test(idNumber)) {
                                  setFormError("ID number must be exactly 10 digits.");
                                  return;
                                }
                                if (deedNumber.length !== 10 || !/^\d{10}$/.test(deedNumber)) {
                                  setFormError("Deed number must be exactly 10 digits.");
                                  return;
                                }
                              }
                              setFormError(null);
                              setPublishing(true);
                              const { create } = await import("../services/listings");
                              const created = await create({
                                id_type: idType, // 'National_ID' or 'Resident_ID'
                                owner_identification_id: statusValue === "DRAFT" ? "0000000000" : idNumber,
                                deed_number: statusValue === "DRAFT" ? "0000000000" : deedNumber,
                                title,
                                description,
                                price: typeof price === "number" ? price : 0,
                                type: typeValue,
                                female_only: femaleOnly,
                                roommates_allowed: roommatesAllowed,
                                student_discount: studentDiscount,
                                status: statusValue,
                                district: districtValue,
                                location_link: locationLink,
                                bedrooms: bedrooms === "" ? undefined : Number(bedrooms),
                                bathrooms: bathrooms === "" ? undefined : Number(bathrooms),
                                area: area === "" ? undefined : Number(area),
                              });
                              // Upload photos if any selected
                              let firstUploadedUrl: string | undefined;
                              if (photoFiles.length > 0) {
                                try {
                                  setUploadProgress(10);
                                  const res = await bulkUploadImages(created.id, photoFiles, (p) => setUploadProgress(p));
                                  firstUploadedUrl = (Array.isArray(res.images) && res.images.length) ? (res.images.find((i: any) => i.is_primary)?.url || res.images[0]?.url) : undefined;
                                  setUploadProgress(100);
                                } catch (err: any) {
                                  const msg = err?.response?.data?.images || err?.message || "Failed to upload images.";
                                  setPhotoError(typeof msg === "string" ? msg : JSON.stringify(msg));
                                }
                              }
                              // Persist amenities client-side since backend doesn't yet support them
                              try { setAmenitiesForListing(created.id, amenities); } catch (_) {}
                              // Close and reset the form so no stale values remain
                              setShowNewListing(false);
                              resetNewListingForm();
                              const label = districtOptions.find((o) => o.value === districtValue)?.label || created.district;
                              // Refresh dashboard from backend to reflect DB state
                              try {
                                const { dashboard } = await import("../services/listings");
                                const d = await dashboard();
                                setStats({ total_listings: d.total_listings, available: d.available, reserved: d.reserved, draft: d.draft });
                                const mapped = await Promise.all(
                                  d.listings.map(async (l: any) => {
                                    let imageUrl = (Array.isArray(l.images) && l.images.length) ? (l.images.find((i: any) => i.is_primary)?.url || l.images[0]?.url) : "https://images.unsplash.com/photo-1515263487990-61b07816b324";
                                    if (!(Array.isArray(l.images) && l.images.length)) {
                                      try {
                                        const imgs = await listImagesForListing(l.id);
                                        imageUrl = imgs?.[0]?.url || imageUrl;
                                      } catch (_) {}
                                    }
                                    return {
                                      id: String(l.id),
                                      image: imageUrl,
                                      price: Number(l.price),
                                      title: l.title,
                                      location: l.district || label,
                                      description: l.description || "",
                                      type: l.type || "",
                                      femaleOnly: !!l.female_only,
                                      roommatesAllowed: !!l.roommates_allowed,
                                      studentDiscount: !!l.student_discount,
                                      status: l.status,
                                      locationLink: l.location_link || "",
                                      bedrooms: l.bedrooms ?? null,
                                      bathrooms: l.bathrooms ?? null,
                                      area: l.area ?? null,
                                      amenities: getAmenitiesForListing(l.id),
                                    };
                                  })
                                );
                                setListings(mapped);
                              } catch (_) {
                                setListings((prev) => [{ id: String(created.id), image: firstUploadedUrl || "https://images.unsplash.com/photo-1515263487990-61b07816b324", price: created.price, title: created.title, location: label, roommatesAllowed, type: typeValue, status: statusValue, femaleOnly, studentDiscount, amenities }, ...prev]);
                              }
                            } catch (e: any) {
                              // Show detailed backend errors
                              let msg = "Failed to publish listing.";
                          const data = e?.response?.data;
                          if (data) {
                            if (typeof data === "string") {
                              msg = data;
                            } else if (typeof data === "object") {
                              const parts: string[] = [];
                              for (const [key, val] of Object.entries(data)) {
                                if (Array.isArray(val)) {
                                  parts.push(`${key}: ${val.join(", ")}`);
                                } else if (typeof val === "string") {
                                  parts.push(`${key}: ${val}`);
                                } else {
                                  try {
                                    parts.push(`${key}: ${JSON.stringify(val)}`);
                                  } catch {
                                    // ignore
                                  }
                                }
                              }
                              if (parts.length) msg = parts.join("\n");
                            }
                          } else if (e?.message) {
                            msg = e.message;
                          }
                          setFormError(msg);
                        } finally {
                          setPublishing(false);
                        }
                      }}>Publish Listing</Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowNewListing(false);
                          resetNewListingForm();
                        }}
                      >
                        Cancel
                      </Button>
                      </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="amenities">
                      <div className="space-y-6">
                        <div>
                          <Label>Common amenities</Label>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {COMMON_AMENITIES.map((opt) => {
                              const selected = amenities.some((a) => a.title === opt.title);
                              return (
                                <Button
                                  key={opt.title}
                                  type="button"
                                  variant={selected ? "default" : "outline"}
                                  className={selected ? "bg-primary text-primary-foreground" : ""}
                                  onClick={() => {
                                    setAmenities((prev) => {
                                      const exists = prev.find((a) => a.title === opt.title);
                                      if (exists) return prev.filter((a) => a.title !== opt.title);
                                      return [...prev, { title: opt.title, symbol: opt.symbol }];
                                    });
                                  }}
                                >
                                  <span className="mr-2">{opt.symbol}</span>
                                  {opt.title}
                                </Button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <Label>Add custom amenity</Label>
                          <div className="mt-2 space-y-3">
                            <div className="grid md:grid-cols-2 gap-2">
                              <Input
                                placeholder="Amenity title (≤ 30 chars)"
                                maxLength={30}
                                value={amenityTitle}
                                onChange={(e) => setAmenityTitle(e.target.value)}
                              />
                              <Input
                                placeholder="Symbol (emoji or short text)"
                                value={amenitySymbol}
                                onChange={(e) => setAmenitySymbol(e.target.value.slice(0, 6))}
                              />
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {AMENITY_SYMBOL_PRESETS.map((s) => (
                                <Button
                                  key={s}
                                  type="button"
                                  variant={amenitySymbol === s ? "default" : "outline"}
                                  className={amenitySymbol === s ? "bg-primary text-primary-foreground" : ""}
                                  onClick={() => setAmenitySymbol(s)}
                                >
                                  {s}
                                </Button>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                onClick={() => {
                                  const t = amenityTitle.trim();
                                  const s = amenitySymbol.trim();
                                  if (!t) return;
                                  if (t.length > 30) return;
                                  setAmenities((prev) => [...prev, { title: t, symbol: s || "•" }]);
                                  setAmenityTitle("");
                                  setAmenitySymbol("");
                                }}
                              >
                                Add Amenity
                              </Button>
                              <Button type="button" variant="outline" onClick={() => { setAmenityTitle(""); setAmenitySymbol(""); }}>Clear</Button>
                            </div>
                          </div>
                        </div>

                        {Array.isArray(amenities) && amenities.length > 0 && (
                          <div>
                            <Label>Selected amenities</Label>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {amenities.map((a, idx) => (
                                <div key={`${a.title}-${idx}`} className="flex items-center gap-2 px-2 py-1 rounded-md border border-border text-sm">
                                  <span className="text-primary">{a.symbol || "•"}</span>
                                  <span>{a.title}</span>
                                  <Button size="sm" variant="ghost" onClick={() => setAmenities((prev) => prev.filter((_, i) => i !== idx))}>Remove</Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3">
                          {formError && (
                            <div className="text-red-600 text-sm mb-2">{formError}</div>
                          )}
                          <Button className="flex-1" disabled={publishing} onClick={async () => {
                            try {
                              if (!idType) { setFormError("Please select an ID type."); return; }
                              if (statusValue !== "DRAFT") {
                                if (idNumber.length !== 10 || !/^\d{10}$/.test(idNumber)) { setFormError("ID number must be exactly 10 digits."); return; }
                                if (deedNumber.length !== 10 || !/^\d{10}$/.test(deedNumber)) { setFormError("Deed number must be exactly 10 digits."); return; }
                              }
                              setFormError(null);
                              setPublishing(true);
                              const { create } = await import("../services/listings");
                              const created = await create({
                                id_type: idType,
                                owner_identification_id: statusValue === "DRAFT" ? "0000000000" : idNumber,
                                deed_number: statusValue === "DRAFT" ? "0000000000" : deedNumber,
                                title,
                                description,
                                price: typeof price === "number" ? price : 0,
                                type: typeValue,
                                female_only: femaleOnly,
                                roommates_allowed: roommatesAllowed,
                                student_discount: studentDiscount,
                                status: statusValue,
                                district: districtValue,
                                location_link: locationLink,
                                bedrooms: bedrooms === "" ? undefined : Number(bedrooms),
                                bathrooms: bathrooms === "" ? undefined : Number(bathrooms),
                                area: area === "" ? undefined : Number(area),
                              });
                              // Upload photos if any selected
                              let firstUploadedUrl: string | undefined;
                              if (photoFiles.length > 0) {
                                try {
                                  setUploadProgress(10);
                                  const res = await bulkUploadImages(created.id, photoFiles, (p) => setUploadProgress(p));
                                  firstUploadedUrl = (Array.isArray(res.images) && res.images.length) ? (res.images.find((i: any) => i.is_primary)?.url || res.images[0]?.url) : undefined;
                                  setUploadProgress(100);
                                } catch (err: any) {
                                  const msg = err?.response?.data?.images || err?.message || "Failed to upload images.";
                                  setPhotoError(typeof msg === "string" ? msg : JSON.stringify(msg));
                                }
                              }
                              // Reset photo selection
                              setPhotoFiles([]);
                              setPhotoPreviews([]);
                              setUploadProgress(0);
                              setPhotoError(null);
                              setShowNewListing(false);
                              const label = districtOptions.find((o) => o.value === districtValue)?.label || created.district;
                              try {
                                const { dashboard } = await import("../services/listings");
                                const d = await dashboard();
                                setStats({ total_listings: d.total_listings, available: d.available, reserved: d.reserved, draft: d.draft });
                                const mapped = await Promise.all(
                                  d.listings.map(async (l: any) => {
                                    let imageUrl = (Array.isArray(l.images) && l.images.length) ? (l.images.find((i: any) => i.is_primary)?.url || l.images[0]?.url) : "https://images.unsplash.com/photo-1515263487990-61b07816b324";
                                    if (!(Array.isArray(l.images) && l.images.length)) {
                                      try {
                                        const imgs = await listImagesForListing(l.id);
                                        imageUrl = imgs?.[0]?.url || imageUrl;
                                      } catch (_) {}
                                    }
                                    return {
                                      id: String(l.id),
                                      image: imageUrl,
                                      price: Number(l.price),
                                      title: l.title,
                                      location: l.district || label,
                                      description: l.description || "",
                                      type: l.type || "",
                                      femaleOnly: !!l.female_only,
                                      roommatesAllowed: !!l.roommates_allowed,
                                      studentDiscount: !!l.student_discount,
                                      status: l.status,
                                      locationLink: l.location_link || "",
                                      bedrooms: l.bedrooms ?? null,
                                      bathrooms: l.bathrooms ?? null,
                                      area: l.area ?? null,
                                      amenities: l.amenities ?? [],
                                    };
                                  })
                                );
                                setListings(mapped);
                              } catch (_) {
                                setListings((prev) => [{ id: String(created.id), image: firstUploadedUrl || "https://images.unsplash.com/photo-1515263487990-61b07816b324", price: created.price, title: created.title, location: label, roommatesAllowed, type: typeValue, status: statusValue, femaleOnly, studentDiscount, amenities }, ...prev]);
                              }
                            } catch (e: any) {
                              let msg = "Failed to publish listing.";
                              const data = e?.response?.data;
                              if (data) {
                                if (typeof data === "string") { msg = data; }
                                else if (typeof data === "object") {
                                  const parts: string[] = [];
                                  for (const [key, val] of Object.entries(data)) {
                                    if (Array.isArray(val)) parts.push(`${key}: ${val.join(", ")}`);
                                    else if (typeof val === "string") parts.push(`${key}: ${String(val)}`);
                                    else {
                                      try { parts.push(`${key}: ${JSON.stringify(val)}`); } catch {}
                                    }
                                  }
                                  if (parts.length) msg = parts.join("\n");
                                }
                              } else if (e?.message) { msg = String(e.message); }
                              setFormError(msg);
                            } finally {
                              setPublishing(false);
                            }
                          }}>Publish Listing</Button>
                          <Button variant="outline" onClick={() => setShowNewListing(false)}>Cancel</Button>
                        </div>
                      </div>
                    </TabsContent>
                    
                  </Tabs>
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
                  {listings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No properties yet. Create your first listing above.</p>
                  ) : null}
                  {listings.length > 0 && listings.map((listing) => (
                    <div
                      key={listing.id}
                      className={`flex items-start gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow ${
                        listing.status === "RESERVED" ? "bg-red-600/15 border-red-700" : "border-border"
                      }`}
                    >
                      <ImageWithFallback
                        src={listing.image}
                        alt=""
                        data-cloudinary-transform="c_fill,w_320,dpr_auto"
                        className="w-24 h-20 sm:w-28 sm:h-24 md:w-32 md:h-24 object-cover rounded-lg cursor-pointer"
                        onClick={() => onNavigate("listing", String(listing.id))}
                      />
                      <div className="flex-1">
                        <h3 className="text-foreground mb-1">{listing.title}</h3>
                        <p className="text-sm text-muted-foreground mb-1">
                          {districtOptions.find((opt) => opt.value === listing.location)?.label || listing.location}
                        </p>
                        {listing.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {String(listing.description).slice(0, 140)}
                            {String(listing.description).length > 140 ? "..." : ""}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          {listing.bedrooms != null && <span>{listing.bedrooms} BR</span>}
                          {listing.bathrooms != null && <span>{listing.bathrooms} Bath</span>}
                          {listing.area != null && <span>{listing.area} m²</span>}
                        </div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {listing.type && (
                            <Badge variant="type">
                              {listing.type}
                            </Badge>
                          )}
                          {listing.femaleOnly && <Badge className="bg-purple-600 text-white hover:bg-purple-700">Female only</Badge>}
                          {listing.roommatesAllowed && <Badge variant="warning">Roommates allowed</Badge>}
                          {listing.studentDiscount && <Badge className="bg-blue-600 text-white hover:bg-blue-700">Student discount</Badge>}
                          {listing.status && (
                            <Badge
                              variant={
                                listing.status === "AVAILABLE"
                                  ? "success"
                                  : listing.status === "RESERVED"
                                  ? "danger"
                                  : listing.status === "DRAFT"
                                  ? "gray"
                                  : "secondary"
                              }
                            >
                              {listing.status}
                            </Badge>
                          )}
                        </div>
                        {Array.isArray(listing.amenities) && listing.amenities.length > 0 && (
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {listing.amenities.map((a: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 px-2 py-1 rounded-md border border-border text-sm">
                                <span className="text-primary">{a.symbol || "•"}</span>
                                <span>{a.title}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-primary">
                          {listing.price.toLocaleString()} SAR/mo
                        </p>
                        {listing.locationLink && (
                          <a
                            href={listing.locationLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-primary underline mt-1 inline-block"
                          >
                            View location
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0 self-start">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setEditingListing(listing);
                            setEditOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={async () => {
                            try {
                              if (confirm("Delete this listing?")) {
                                const { remove } = await import("../services/listings");
                                await remove(listing.id);
                                setListings((prev) => prev.filter((l) => l.id !== listing.id));
                                try { removeAmenitiesForListing(listing.id); } catch (_) {}
                                // Refresh dashboard stats after deletion
                                try {
                                  const { dashboard } = await import("../services/listings");
                                  const d = await dashboard();
                                  setStats({ total_listings: d.total_listings, available: d.available, reserved: d.reserved, draft: d.draft });
                                } catch (_) {}
                              }
                            } catch (e) {
                              // optionally surface error
                            }
                          }}
                        >
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

      {/* Edit Listing Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[900px] md:max-w-5xl lg:max-w-6xl min-w-[320px] w-auto max-h-[90vh] flex flex-col border-2 border-border shadow-xl px-10 py-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl">Edit Listing</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">Update your property listing details and amenities.</p>
          </DialogHeader>
          {editingListing && (
            <div className="flex-1 overflow-y-auto pr-2">
              <Tabs defaultValue="details" className="space-y-8">
                <div className="max-w-full mx-auto">
                  <TabsList className="inline-flex h-auto gap-3 rounded-lg bg-secondary/50 p-1.5">
                    <TabsTrigger 
                      value="details" 
                      className="px-6 py-3 rounded-md text-base font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                    >
                      Details
                    </TabsTrigger>
                    <TabsTrigger 
                      value="amenities" 
                      className="px-6 py-3 rounded-md text-base font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                    >
                      Amenities
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="details" className="space-y-6 mt-8">
                  {/* Basic Information Section */}
                  <div className="p-6 border border-border rounded-lg bg-card space-y-5">
                    <h3 className="text-base font-semibold text-foreground">Basic Information</h3>
                    <div className="grid grid-cols-1 gap-5">
                      <div className="space-y-2">
                        <div className="p-0.2"></div>
                        <Label htmlFor="edit_title" className="text-sm font-medium block">Property Title</Label>
                        <Input
                          id="edit_title"
                          defaultValue={editingListing.title}
                          className="h-9 px-3 text-sm"
                          onChange={(e) => (editingListing.title = e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="p-0.5"></div>
                        <Label htmlFor="edit_price" className="text-sm font-medium block">Monthly Rent (SAR)</Label>
                        <Input
                          id="edit_price"
                          type="number"
                          defaultValue={editingListing.price}
                          className="h-9 px-3 text-sm"
                          onChange={(e) => (editingListing.price = Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="p-0.5"></div>
                        <Label className="text-sm font-medium block">District</Label>
                        <Select
                          value={editingListing.location || ""}
                          onValueChange={(v: string) => (editingListing.location = v)}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Select district" />
                          </SelectTrigger>
                          <SelectContent>
                            {districtOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2"><div className="p-0.5"></div>
                        <Label htmlFor="edit_location_link" className="text-sm font-medium block">Location Link</Label>
                        <Input
                          id="edit_location_link"
                          type="url"
                          defaultValue={editingListing.locationLink}
                          className="h-9 px-3 text-sm"
                          placeholder="https://maps.google.com/..."
                          onChange={(e) => (editingListing.locationLink = e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                   <Label
                     htmlFor="edit_description"
                     className="text-sm font-medium block"
                   >
                    <div className="p-1"></div>
                     Description
                   </Label>

                   <Textarea
                     id="edit_description"
                     defaultValue={editingListing.description || ""}
                     placeholder="  Describe your property..."
                     onChange={(e) => (editingListing.description = e.target.value)}
                     rows={5}
                     className="
                       resize-none
                       overflow-y-auto
                       max-h-[8rem]
                       w-full
                       p-3
                       leading-6
                     "
                   />
                  </div>
                  </div>

                                   {/* Documentation Section */}
                  <div className="p-6 border border-border rounded-lg bg-card space-y-5">
                    <h3 className="text-base font-semibold text-foreground">Documentation</h3>
                    <div className="grid md:grid-cols-3 gap-x-[2px] gap-y-5">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium block">ID Type</Label>
                        <Select
                          value={editingListing.idType || ""}
                          onValueChange={(v: "National_ID" | "Resident_ID") => setEditingListing((prev: any) => ({ ...prev, idType: v }))}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Select ID Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="National_ID">National ID</SelectItem>
                            <SelectItem value="Resident_ID">Resident ID</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit_id_number" className="text-sm font-medium block">ID Number</Label>
                        <Input
                          id="edit_id_number"
                          inputMode="numeric"
                          value={editingListing.idNumber || ""}
                          className="h-9 px-3 text-sm"
                          placeholder="10 digits"
                          onChange={(e) => setEditingListing((prev: any) => ({ ...prev, idNumber: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit_deed_number" className="text-sm font-medium block">Deed Number</Label>
                        <Input
                          id="edit_deed_number"
                          inputMode="numeric"
                          value={editingListing.deedNumber || ""}
                          className="h-9 px-3 text-sm"
                          placeholder="10 digits"
                          onChange={(e) => setEditingListing((prev: any) => ({ ...prev, deedNumber: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Property Details Section */}
                  <div className="p-6 border border-border rounded-lg bg-card space-y-5">
                    <h3 className="text-base font-semibold text-foreground">Property Details</h3>
                    <div className="flex gap-3">
                      <div className="space-y-2 flex-1">
                        <Label htmlFor="edit_bedrooms" className="text-sm font-medium block">Bedrooms</Label>
                        <Input
                          id="edit_bedrooms"
                          type="number"
                          defaultValue={editingListing.bedrooms ?? ""}
                          className="h-9 px-3 text-sm"
                          onChange={(e) => (editingListing.bedrooms = Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2 flex-1">
                        <Label htmlFor="edit_bathrooms" className="text-sm font-medium block">Bathrooms</Label>
                        <Input
                          id="edit_bathrooms"
                          type="number"
                          defaultValue={editingListing.bathrooms ?? ""}
                          className="h-9 px-3 text-sm"
                          onChange={(e) => (editingListing.bathrooms = Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2 flex-1">
                        <Label htmlFor="edit_area" className="text-sm font-medium block">Area (m²)</Label>
                        <Input
                          id="edit_area"
                          type="number"
                          defaultValue={editingListing.area ?? ""}
                          className="h-9 px-3 text-sm"
                          onChange={(e) => (editingListing.area = Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium block">Property Type</Label>
                      <Select
                        value={editingListing.type || "APARTMENT"}
                        onValueChange={(v: "APARTMENT" | "STUDIO" | "OTHER") => setEditingListing((prev: any) => ({ ...prev, type: v }))}
                      >
                        <SelectTrigger className="h-9 text-sm max-w-md">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="APARTMENT">Apartment</SelectItem>
                          <SelectItem value="STUDIO">Studio</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Options Section */}
                  <div className="p-6 border border-border rounded-lg bg-card space-y-2">
                    <h3 className="text-base font-semibold text-foreground">Options</h3>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3">
                        <Switch
                          id="edit_female_only"
                          checked={!!editingListing.femaleOnly}
                          onCheckedChange={(v: boolean) => setEditingListing((prev: any) => ({ ...prev, femaleOnly: v }))}
                        />
                        <Label htmlFor="edit_female_only" className="text-sm font-medium cursor-pointer">Female Only</Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          id="edit_student_discount"
                          checked={!!editingListing.studentDiscount}
                          onCheckedChange={(v: boolean) => setEditingListing((prev: any) => ({ ...prev, studentDiscount: v }))}
                        />
                        <Label htmlFor="edit_student_discount" className="text-sm font-medium cursor-pointer">Student Discount</Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          id="edit_roommates_allowed"
                          checked={!!editingListing.roommatesAllowed}
                          onCheckedChange={(v: boolean) => setEditingListing((prev: any) => ({ ...prev, roommatesAllowed: v }))}
                        />
                        <Label htmlFor="edit_roommates_allowed" className="text-sm font-medium cursor-pointer">Roommates Allowed</Label>
                      </div>
                    </div>
                  </div>
              </TabsContent>
              <TabsContent value="amenities" className="space-y-6 mt-8">
                <div className="space-y-6">
                  {/* Common Amenities Card */}
                  <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                    <div>
                      <h3 className="text-base font-semibold text-foreground mb-2">Common Amenities</h3>
                      <p className="text-sm text-muted-foreground">Select from popular options</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {COMMON_AMENITIES.map((opt) => {
                        const selected = Array.isArray(editingListing.amenities) && editingListing.amenities.some((a: any) => a.title === opt.title);
                        return (
                          <Button
                            key={opt.title}
                            type="button"
                            size="sm"
                            variant={selected ? "default" : "outline"}
                            className={selected ? "bg-primary text-primary-foreground h-8 text-sm" : "h-8 text-sm"}
                            onClick={() => {
                              setEditingListing((prev: any) => {
                                const exists = (prev.amenities || []).find((a: any) => a.title === opt.title);
                                const next = exists
                                  ? (prev.amenities || []).filter((a: any) => a.title !== opt.title)
                                  : [...(prev.amenities || []), { title: opt.title, symbol: opt.symbol }];
                                return { ...prev, amenities: next };
                              });
                            }}
                          >
                            <span className="mr-2">{opt.symbol}</span>
                            {opt.title}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Amenity Creator Card */}
                  <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                    <div>
                      <h3 className="text-base font-semibold text-foreground mb-2">Add Custom Amenity</h3>
                      <p className="text-sm text-muted-foreground">Create your own amenity</p>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="amenity_title" className="text-sm font-medium block">Amenity Title</Label>
                          <Input
                            id="amenity_title"
                            placeholder="Max 30 chars"
                            maxLength={30}
                            className="h-9 px-3 text-sm"
                            onChange={(e) => setAmenityTitle(e.target.value)}
                            value={amenityTitle}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="amenity_symbol" className="text-sm font-medium block">Symbol</Label>
                          <Input
                            id="amenity_symbol"
                            placeholder="Emoji or icon"
                            className="h-9 px-3 text-sm"
                            value={amenitySymbol}
                            onChange={(e) => setAmenitySymbol(e.target.value.slice(0, 6))}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium block mb-2">Symbol Presets</Label>
                        <div className="flex flex-wrap gap-2">
                          {AMENITY_SYMBOL_PRESETS.map((s) => (
                            <Button
                              key={s}
                              type="button"
                              size="sm"
                              variant={amenitySymbol === s ? "default" : "outline"}
                              className={amenitySymbol === s ? "bg-primary text-primary-foreground h-8" : "h-8"}
                              onClick={() => setAmenitySymbol(s)}
                            >
                              {s}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap md:flex-nowrap gap-3 pt-1">
                        <Button
                          type="button"
                          className="flex-1 h-9 text-sm"
                          onClick={() => {
                            const t = amenityTitle.trim();
                            const s = amenitySymbol.trim();
                            if (!t) return;
                            if (t.length > 30) return;
                            setEditingListing((prev: any) => ({ ...prev, amenities: [...(prev.amenities || []), { title: t, symbol: s || "•" }] }));
                            setAmenityTitle("");
                            setAmenitySymbol("");
                          }}
                        >
                          Add Amenity
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="flex-1 h-9 text-sm"
                          onClick={() => { setAmenityTitle(""); setAmenitySymbol(""); }}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Selected Amenities Preview */}
                  {Array.isArray(editingListing.amenities) && editingListing.amenities.length > 0 && (
                    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                      <h3 className="text-base font-semibold text-foreground">Selected Amenities</h3>
                      <div className="flex flex-wrap gap-2">
                        {editingListing.amenities.map((a: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-sm bg-secondary/20">
                            <span className="text-primary">{a.symbol || "•"}</span>
                            <span className="font-medium">{a.title}</span>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-5 w-5 p-0 ml-1 text-xs"
                              onClick={() => setEditingListing((prev: any) => ({ ...prev, amenities: (prev.amenities || []).filter((_: any, i: number) => i !== idx) }))}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              </Tabs>
              
              {/* Status and Action Buttons */}
              <div className="">
                  <div className="w-1 h-2"></div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    className="h-10 px-6" 
                    onClick={() => setEditOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="h-10 px-6"
                    onClick={async () => {
                    try {
                      const { update } = await import("../services/listings");
                      const isDraft = editingListing.status === "DRAFT";
                      const payload: any = {
                        title: editingListing.title,
                        price: Number(editingListing.price),
                        district: editingListing.location,
                        location_link: editingListing.locationLink,
                        description: editingListing.description,
                        bedrooms: editingListing.bedrooms ?? null,
                        bathrooms: editingListing.bathrooms ?? null,
                        area: editingListing.area ?? null,
                        type: editingListing.type,
                        female_only: !!editingListing.femaleOnly,
                        roommates_allowed: !!editingListing.roommatesAllowed,
                        student_discount: !!editingListing.studentDiscount,
                        // Pass Wathq fields to satisfy backend validation during partial update
                        id_type: editingListing.idType || undefined,
                        owner_identification_id: isDraft ? "0000000000" : (editingListing.idNumber || undefined),
                        deed_number: isDraft ? "0000000000" : (editingListing.deedNumber || undefined),
                        status: editingListing.status,
                      };
                      if (!isDraft) {
                        // Basic client-side validation for active statuses
                        if (!editingListing.idNumber || editingListing.idNumber.length !== 10 || !/^\d{10}$/.test(editingListing.idNumber)) {
                          alert("ID number must be exactly 10 digits to set Available/Reserved.");
                          return;
                        }
                        if (!editingListing.deedNumber || editingListing.deedNumber.length !== 10 || !/^\d{10}$/.test(editingListing.deedNumber)) {
                          alert("Deed number must be exactly 10 digits to set Available/Reserved.");
                          return;
                        }
                        if (editingListing.idNumber === "0000000000" || editingListing.deedNumber === "0000000000") {
                          alert("ID and Deed cannot be all zeros for Available/Reserved status.");
                          return;
                        }
                        if (!editingListing.idType) {
                          alert("Please select an ID Type for Available/Reserved status.");
                          return;
                        }
                      }
                      const updated = await update(editingListing.id, payload);
                      // Persist amenities client-side alongside backend update
                      try { setAmenitiesForListing(editingListing.id, editingListing.amenities || []); } catch (_) {}
                        setListings((prev) => prev.map((l) => (l.id === editingListing.id ? {
                          ...l,
                          title: updated.title,
                          price: Number(updated.price),
                          location: updated.district,
                          description: updated.description,
                          type: updated.type,
                          bedrooms: updated.bedrooms ?? null,
                          bathrooms: updated.bathrooms ?? null,
                          area: updated.area ?? null,
                          femaleOnly: !!updated.female_only,
                          roommatesAllowed: !!updated.roommates_allowed,
                          studentDiscount: !!updated.student_discount,
                          status: updated.status,
                          idType: updated.id_type,
                          idNumber: updated.owner_identification_id,
                          deedNumber: updated.deed_number,
                          amenities: editingListing.amenities || l.amenities,
                        } : l)));
                      // Refresh dashboard stats to reflect DB state
                      try {
                        const { dashboard } = await import("../services/listings");
                        const d = await dashboard();
                        setStats({ total_listings: d.total_listings, available: d.available, reserved: d.reserved, draft: d.draft });
                      } catch (_) {}
                      setEditOpen(false);
                    } catch (e: any) {
                      let msg = "Failed to save changes";
                      try {
                        const data = e?.response?.data;
                        if (typeof data === "string") msg = data;
                        else if (data?.detail) msg = String(data.detail);
                        else if (data && typeof data === "object") {
                          const parts: string[] = [];
                          for (const [k, v] of Object.entries(data)) {
                            if (Array.isArray(v)) parts.push(`${k}: ${v.join(", ")}`);
                            else parts.push(`${k}: ${String(v)}`);
                          }
                          if (parts.length) msg = parts.join("\n");
                        } else if (e?.message) {
                          msg = String(e.message);
                        }
                      } catch (_) {}
                      alert(msg);
                    }
                  }}
                >
                  Save Changes
                </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


