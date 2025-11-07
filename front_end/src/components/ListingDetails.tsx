import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import {
  MapPin,
  Bed,
  Bath,
  Square,
  Wifi,
  Car,
  AirVent,
  ChevronLeft,
  ChevronRight,
  Star,
  MessageSquare,
  Share2,
  Heart,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { districtOptions as fetchDistrictOptions } from "../services/listings";
import type { Review } from "../services/reviews";
import { listReviews } from "../services/reviews";
import { getAmenitiesForListing } from "../services/amenitiesLocal";

interface ListingDetailsProps {
  propertyId: string;
  onNavigate: (page: string) => void;
}

const propertyImages = [
  "https://images.unsplash.com/photo-1515263487990-61b07816b324?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBidWlsZGluZ3xlbnwxfHx8fDE3NjAzNjMxMTl8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1555662328-4c2c27e7e4c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwZG9ybWl0b3J5JTIwcm9vbXxlbnwxfHx8fDE3NjAzNDE0MDB8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1649429710616-dad56ce9a076?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwYXBhcnRtZW50JTIwaW50ZXJpb3J8ZW58MXx8fHwxNzYwMzcyNzczfDA&ixlib=rb-4.1.0&q=80&w=1080",
];

export function ListingDetails({ propertyId, onNavigate }: ListingDetailsProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [message, setMessage] = useState("");
  const [data, setData] = useState<any | null>(null);
  const [districtOptions, setDistrictOptions] = useState<{ value: string; label: string }[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    (async () => {
      if (!propertyId) return;
      try {
        const { details } = await import("../services/listings");
        const d = await details(propertyId);
        setData(d);
      } catch (_) {
        // ignore
      }
      try {
        const opts = await fetchDistrictOptions();
        setDistrictOptions(opts);
      } catch (_) {}
    })();
  }, [propertyId]);

  useEffect(() => {
    (async () => {
      try {
        if (!propertyId) return;
        const list = await listReviews({ target_type: "LISTING", target_id: propertyId });
        setReviews(Array.isArray(list) ? list : []);
      } catch (_) {}
    })();
  }, [propertyId]);

  const ownerInitials = useMemo(() => {
    const fn = data?.owner_details?.first_name || "";
    const ln = data?.owner_details?.last_name || "";
    const initials = `${fn.slice(0, 1)}${ln.slice(0, 1)}`.toUpperCase();
    return initials || (data?.owner_details?.username || "").slice(0, 2).toUpperCase() || "US";
  }, [data]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % propertyImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + propertyImages.length) % propertyImages.length
    );
  };

  const districtLabel = useMemo(() => {
    const map = Object.fromEntries(districtOptions.map((o) => [o.value, o.label]));
    return map[data?.district] || data?.district || "Riyadh";
  }, [districtOptions, data]);

  const amenities = useMemo(() => {
    try {
      return getAmenitiesForListing(propertyId);
    } catch (_) {
      return [];
    }
  }, [propertyId]);

  return (
    <div className="min-h-screen bg-secondary">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => onNavigate("search")}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Results
        </Button>

        {/* Image Carousel */}
        <Card className="mb-6 overflow-hidden">
          <div className="relative h-96">
            <ImageWithFallback
              src={propertyImages[currentImageIndex]}
              alt="Property"
              className="w-full h-full object-cover"
            />
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-card rounded-full p-2 shadow-lg hover:bg-secondary transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-card rounded-full p-2 shadow-lg hover:bg-secondary transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {propertyImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentImageIndex
                      ? "bg-card w-8"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <div className="absolute top-4 right-4 flex gap-2">
              <Button size="icon" variant="secondary" className="rounded-full">
                <Heart className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="secondary" className="rounded-full">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex gap-2 mb-3">
                      {data?.status === "AVAILABLE" && (
                        <Badge className="bg-green-600 hover:bg-green-700">Available</Badge>
                      )}
                      {data?.female_only && (
                        <Badge className="bg-purple-600 hover:bg-purple-700">Female Only</Badge>
                      )}
                      {data?.roommates_allowed && (
                        <Badge className="bg-yellow-600 hover:bg-yellow-700">Roommates Allowed</Badge>
                      )}
                      {data?.student_discount && (
                        <Badge className="bg-blue-600 hover:bg-blue-700">Student Discount</Badge>
                      )}
                    </div>
                    <h1 className="mb-2 text-foreground">{data?.title || "Modern Studio Apartment"}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{districtLabel}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl text-primary mb-1">{data?.price ? `${Number(data.price).toLocaleString()} SAR` : "1,800 SAR"}</div>
                    <div className="text-sm text-muted-foreground">per month</div>
                  </div>
                </div>

                <div className="flex gap-6 py-4 border-y border-border">
                  <div className="flex items-center gap-2">
                    <Bed className="w-5 h-5 text-muted-foreground" />
                    <span>{data?.bedrooms ?? "-"} Bedroom{(data?.bedrooms ?? 0) > 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="w-5 h-5 text-muted-foreground" />
                    <span>{data?.bathrooms ?? "-"} Bathroom{(data?.bathrooms ?? 0) > 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Square className="w-5 h-5 text-muted-foreground" />
                    <span>{data?.area ?? "-"} m²</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="overview">
                  <TabsList className="w-full">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="amenities">Amenities</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-6">
                    <h3 className="mb-3 text-foreground">About this property</h3>
                    <p className="text-muted-foreground mb-4">
                      {data?.description || "No description provided."}
                    </p>
                  </TabsContent>

                  

                  <TabsContent value="amenities" className="mt-6">
                    <h3 className="mb-4 text-foreground">Amenities & Features</h3>
                    {Array.isArray(amenities) && amenities.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {amenities.map((a, idx) => (
                          <div key={`${a.title}-${idx}`} className="flex items-center gap-2 px-2 py-1 rounded-md border border-border text-sm">
                            <span className="text-primary">{a.symbol || "•"}</span>
                            <span>{a.title}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No amenities provided.</div>
                    )}
                  </TabsContent>

                  <TabsContent value="reviews" className="mt-6">
                    {(() => {
                      const count = reviews.length;
                      const avg = count ? Math.round((reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / count) * 10) / 10 : 0;
                      return (
                        <>
                          <div className="flex items-center gap-4 mb-6">
                            <div className="text-center">
                              <div className="text-3xl text-primary mb-1">{count ? avg.toFixed(1) : "-"}</div>
                              <div className="flex gap-1 mb-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={`w-4 h-4 ${avg >= i + 1 ? "fill-primary text-primary" : "text-primary"}`} />
                                ))}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {count} review{count === 1 ? "" : "s"}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            {count === 0 && (
                              <div className="text-sm text-muted-foreground">No reviews yet.</div>
                            )}
                            {reviews.map((rev) => (
                              <div key={rev.id} className="border-b border-border pb-4">
                                <div className="flex items-start gap-3 mb-2">
                                  <Avatar>
                                    <AvatarFallback>US</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <span>User {String(rev.author)}</span>
                                      <span className="text-sm text-muted-foreground">
                                        {new Date(rev.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <div className="flex gap-1 mb-2">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} className={`w-3 h-3 ${rev.rating >= i + 1 ? "fill-primary text-primary" : "text-primary"}`} />
                                      ))}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{rev.comment}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Map */}
            <Card className="mt-6">
              <CardContent className="p-6">
                <h3 className="mb-4 text-foreground">Location</h3>
                <div className="h-64 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <MapPin className="w-12 h-12 mx-auto mb-2" />
                    <p>Map View</p>
                    <p className="text-sm">{districtLabel}</p>
                    {data?.location_link && (
                      <a
                        href={data.location_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline mt-2 inline-block"
                      >
                        Open location
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h3 className="mb-4 text-foreground">Property Owner</h3>

                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback>{ownerInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span>{data?.owner_details ? `${data.owner_details.first_name} ${data.owner_details.last_name}` : "Owner"}</span>
                      {data?.owner_details?.is_email_verified && (
                        <Badge className="bg-green-600 hover:bg-green-700 text-xs">Verified</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-primary text-primary" />
                      <span className="text-sm">4.9 (34 reviews)</span>
                    </div>
                  </div>
                </div>

                {/* Removed response rate/time for now */}

                <Button
                  className="w-full mb-3"
                  onClick={() => setShowContactDialog(true)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact Landlord
                </Button>

                {/* Removed Schedule Viewing for now */}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Landlord</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Send a message to {data?.owner_details ? `${data.owner_details.first_name} ${data.owner_details.last_name}` : "the landlord"} about this property
              </p>
              <Textarea
                placeholder="Hi, I'm interested in this property..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowContactDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setShowContactDialog(false);
                  onNavigate("messages");
                }}
              >
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
