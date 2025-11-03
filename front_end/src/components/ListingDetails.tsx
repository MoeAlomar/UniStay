import { useEffect, useState } from "react";
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
    })();
  }, [propertyId]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % propertyImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + propertyImages.length) % propertyImages.length
    );
  };

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
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-secondary transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-secondary transition-colors"
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
                      ? "bg-white w-8"
                      : "bg-white/50"
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
                      <Badge className="bg-green-600 hover:bg-green-700">
                        Verified
                      </Badge>
                      <Badge className="bg-purple-600 hover:bg-purple-700">
                        Female Only
                      </Badge>
                      <Badge className="bg-blue-600 hover:bg-blue-700">
                        Student Discount
                      </Badge>
                    </div>
                    <h1 className="mb-2 text-foreground">{data?.title || "Modern Studio Apartment"}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{data?.district || "Riyadh"}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl text-primary mb-1">{data?.price ? `${data.price} SAR` : "1,800 SAR"}</div>
                    <div className="text-sm text-muted-foreground">per month</div>
                  </div>
                </div>

                <div className="flex gap-6 py-4 border-y border-border">
                  <div className="flex items-center gap-2">
                    <Bed className="w-5 h-5 text-muted-foreground" />
                    <span>1 Bedroom</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="w-5 h-5 text-muted-foreground" />
                    <span>1 Bathroom</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Square className="w-5 h-5 text-muted-foreground" />
                    <span>45 m²</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="overview">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="rules">Rules</TabsTrigger>
                    <TabsTrigger value="amenities">Amenities</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-6">
                    <h3 className="mb-3 text-foreground">About this property</h3>
                    <p className="text-muted-foreground mb-4">
                      Beautiful modern studio apartment perfect for female students.
                      Located in a safe, quiet neighborhood close to King Saud
                      University. The apartment is fully furnished with modern
                      amenities including high-speed internet, air conditioning, and
                      secure parking.
                    </p>
                    <p className="text-muted-foreground">
                      The building features 24/7 security, elevator access, and is
                      within walking distance of supermarkets, cafes, and public
                      transportation. Utilities are included in the rent (electricity,
                      water, and internet).
                    </p>
                  </TabsContent>

                  <TabsContent value="rules" className="mt-6">
                    <h3 className="mb-3 text-foreground">House Rules</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>✓ No smoking inside the apartment</li>
                      <li>✓ No pets allowed</li>
                      <li>✓ Quiet hours: 10 PM - 7 AM</li>
                      <li>✓ Maximum 2 guests at a time</li>
                      <li>✓ Female tenants only</li>
                      <li>✓ Minimum 6-month lease required</li>
                      <li>✓ One month security deposit</li>
                    </ul>
                  </TabsContent>

                  <TabsContent value="amenities" className="mt-6">
                    <h3 className="mb-4 text-foreground">Amenities & Features</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Wifi className="w-5 h-5 text-primary" />
                        </div>
                        <span>High-speed WiFi</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <AirVent className="w-5 h-5 text-primary" />
                        </div>
                        <span>Air Conditioning</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Car className="w-5 h-5 text-primary" />
                        </div>
                        <span>Free Parking</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="text-primary">🔒</span>
                        </div>
                        <span>24/7 Security</span>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="reviews" className="mt-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-3xl text-primary mb-1">4.8</div>
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className="w-4 h-4 fill-primary text-primary"
                            />
                          ))}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          12 reviews
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="border-b border-border pb-4">
                        <div className="flex items-start gap-3 mb-2">
                          <Avatar>
                            <AvatarFallback>SA</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span>Sarah Ahmed</span>
                              <span className="text-sm text-muted-foreground">
                                2 weeks ago
                              </span>
                            </div>
                            <div className="flex gap-1 mb-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className="w-3 h-3 fill-primary text-primary"
                                />
                              ))}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Great apartment! Very clean and the landlord is
                              responsive. Perfect location for students.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="border-b border-border pb-4">
                        <div className="flex items-start gap-3 mb-2">
                          <Avatar>
                            <AvatarFallback>NA</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span>Nora Ali</span>
                              <span className="text-sm text-muted-foreground">
                                1 month ago
                              </span>
                            </div>
                            <div className="flex gap-1 mb-2">
                              {[1, 2, 3, 4].map((star) => (
                                <Star
                                  key={star}
                                  className="w-3 h-3 fill-primary text-primary"
                                />
                              ))}
                              <Star className="w-3 h-3 text-primary" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Nice place, good amenities. Only minor issue was some
                              noise from neighbors.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
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
                    <p className="text-sm">Al Malqa, Riyadh</p>
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
                    <AvatarFallback>AF</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span>Ahmed Farsi</span>
                      <Badge className="bg-green-600 hover:bg-green-700 text-xs">
                        Verified
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-primary text-primary" />
                      <span className="text-sm">4.9 (34 reviews)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Response rate:</span>
                    <span>98%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Response time:</span>
                    <span>Within 1 hour</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Member since:</span>
                    <span>Jan 2023</span>
                  </div>
                </div>

                <Button
                  className="w-full mb-3"
                  onClick={() => setShowContactDialog(true)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact Landlord
                </Button>

                <Button variant="outline" className="w-full">
                  Schedule Viewing
                </Button>
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
                Send a message to Ahmed Farsi about this property
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
