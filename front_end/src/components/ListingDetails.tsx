import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
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
import { listReviews, createReview, updateReview, deleteReview } from "../services/reviews";
import { profile, type User } from "../services/auth";
import { getAmenitiesForListing } from "../services/amenitiesLocal";
import { Skeleton } from "./ui/skeleton";
import UserProfileDialog from "./UserProfileDialog";
import { isFavorite as isFavoriteLocal, toggleFavorite } from "../services/favoritesLocal";
import { openOrCreateByUserId, sendMessage as sendMessageAPI } from "../services/messaging";

interface ListingDetailsProps {
  propertyId: string;
  onNavigate: (page: string) => void;
}

const propertyImagesFallback = [
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
  const [ownerReviews, setOwnerReviews] = useState<Review[]>([]);
  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOwnerProfile, setShowOwnerProfile] = useState(false);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewRating, setReviewRating] = useState<number>(0);
  const [reviewHover, setReviewHover] = useState<number>(0);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    (async () => {
      if (!propertyId) return;
      try {
        setLoading(true);
        const { details } = await import("../services/listings");
        const d = await details(propertyId);
        setData(d);
      } catch (_) {
        // ignore
      } finally {
        setLoading(false);
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

  // Fetch reviews for the landlord (owner) to display accurate stats
  useEffect(() => {
    (async () => {
      try {
        const ownerId = (data?.owner_details?.id as any) ?? (data?.owner as any);
        if (!ownerId) return;
        const list = await listReviews({ target_type: "USER", target_id: ownerId });
        setOwnerReviews(Array.isArray(list) ? list : []);
      } catch (_) {}
    })();
  }, [data]);

  useEffect(() => {
    (async () => {
      try {
        const u = await profile();
        setMe(u);
      } catch (_) {
        setMe(null);
      }
    })();
  }, []);

  const myReview = useMemo(() => {
    if (!me) return null;
    return reviews.find((r) => (r.author?.id ?? null) === me.id) || null;
  }, [reviews, me]);

  const [isEditingReview, setIsEditingReview] = useState(false);

  const ownerInitials = useMemo(() => {
    const fn = data?.owner_details?.first_name || "";
    const ln = data?.owner_details?.last_name || "";
    const initials = `${fn.slice(0, 1)}${ln.slice(0, 1)}`.toUpperCase();
    return initials || "US";
  }, [data]);

  useEffect(() => {
    try {
      setIsFavorite(isFavoriteLocal(propertyId));
    } catch (_) {}
  }, [propertyId]);

  const shareUrl = useMemo(() => {
    try {
      const origin = window.location.origin;
      return `${origin}/?listing=${propertyId}`;
    } catch (_) {
      return `/?listing=${propertyId}`;
    }
  }, [propertyId]);

  // Apply small Cloudinary transformation for avatar thumbnails if the URL is Cloudinary
  function transformAvatar(url?: string | null): string | undefined {
    if (!url) return undefined;
    try {
      const u = new URL(url);
      const idx = u.pathname.indexOf("/upload/");
      if (idx !== -1) {
        const before = u.pathname.slice(0, idx + "/upload/".length);
        const after = u.pathname.slice(idx + "/upload/".length);
        // Small square thumbnail for sidebar
        u.pathname = `${before}c_fill,w_64,h_64,dpr_auto/${after}`;
        return u.toString();
      }
      return url;
    } catch (_) {
      return url;
    }
  }

  const carouselImages = useMemo(() => {
    const imgs = Array.isArray(data?.images) ? data!.images : [];
    if (imgs.length > 0) {
      return imgs.map((i: any) => i.url);
    }
    return propertyImagesFallback;
  }, [data]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  const districtLabel = useMemo(() => {
    if (!data?.district) return "";
    const map = Object.fromEntries(districtOptions.map((o) => [o.value, o.label]));
    return map[data.district] || (data.district || "").replace(/_/g, " ");
  }, [districtOptions, data]);

  const amenities = useMemo(() => {
    try {
      return getAmenitiesForListing(propertyId);
    } catch (_) {
      return [];
    }
  }, [propertyId]);

  async function submitListingReview() {
    if (!propertyId || !reviewRating) return;
    try {
      setReviewSubmitting(true);
      setReviewError(null);
      if (myReview) {
        const updated = await updateReview(myReview.id, { rating: reviewRating, comment: reviewComment });
        setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      } else {
        const created = await createReview({ target_type: "LISTING", target_id: propertyId, rating: reviewRating, comment: reviewComment });
        setReviews((prev) => [created, ...prev]);
      }
      setReviewRating(0);
      setReviewHover(0);
      setReviewComment("");
      setIsEditingReview(false);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) {
        setReviewError("Please log in to submit a review.");
      } else {
        const backendMsg = e?.response?.data?.detail || e?.response?.data?.non_field_errors?.[0];
        setReviewError(backendMsg ?? e?.message ?? "Failed to submit review");
      }
    } finally {
      setReviewSubmitting(false);
    }
  }

  async function handleDeleteMyReview() {
    if (!myReview) return;
    try {
      setReviewSubmitting(true);
      await deleteReview(myReview.id);
      setReviews((prev) => prev.filter((r) => r.id !== myReview.id));
      setReviewRating(0);
      setReviewHover(0);
      setReviewComment("");
      setIsEditingReview(false);
      setReviewError(null);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) setReviewError("Please log in to delete your review.");
      else setReviewError(e?.response?.data?.detail ?? e?.message ?? "Failed to delete review");
    } finally {
      setReviewSubmitting(false);
    }
  }

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
            {/* Prefetch adjacent carousel images for snappier navigation */}
            {(() => {
              const next = carouselImages[currentImageIndex + 1];
              const prev = carouselImages[currentImageIndex - 1];
              if (next) new Image().src = next;
              if (prev) new Image().src = prev;
              return null;
            })()}
            <ImageWithFallback
              src={carouselImages[currentImageIndex] ?? propertyImagesFallback[0]}
              alt=""
              loading="eager"
              fetchPriority="high"
              data-cloudinary-transform="c_fill,w_1440,dpr_auto"
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
              {(Array.isArray(carouselImages) ? carouselImages : propertyImagesFallback).map((_, index) => (
                <button
                  type="button"
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
              <Button
                size="icon"
                variant="secondary"
                className={`rounded-full ${isFavorite ? "text-red-600" : ""}`}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                onClick={() => {
                  try {
                    const nowFav = toggleFavorite(propertyId);
                    setIsFavorite(nowFav);
                  } catch (_) {}
                }}
              >
                <Heart className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="rounded-full"
                aria-label="Share listing"
                onClick={() => setShowShareDialog(true)}
              >
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
                        <Badge variant="success">Available</Badge>
                      )}
                      {data?.status === "RESERVED" && (
                        <Badge variant="danger">Reserved</Badge>
                      )}
                      {data?.status === "DRAFT" && (
                        <Badge variant="gray">Draft</Badge>
                      )}
                      {data?.female_only && (
                        <Badge className="bg-purple-600 hover:bg-purple-700">Female Only</Badge>
                      )}
                      {data?.roommates_allowed && (
                        <Badge variant="warning">Roommates Allowed</Badge>
                      )}
                      {data?.student_discount && (
                        <Badge className="bg-blue-600 hover:bg-blue-700">Student Discount</Badge>
                      )}
                    </div>
                    <h1 className="mb-2 text-foreground">
                      {loading ? <Skeleton className="h-6 w-56" /> : data?.title}
                    </h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {loading ? <Skeleton className="h-4 w-40" /> : <span>{districtLabel}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl text-primary mb-1">
                      {loading ? (
                        <Skeleton className="h-8 w-32" />
                      ) : data?.price != null ? (
                        `${Number(data.price).toLocaleString()} SAR`
                      ) : (
                        "N/A"
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">per month</div>
                  </div>
                </div>

                <div className="flex gap-6 py-4 border-y border-border">
                  <div className="flex items-center gap-2">
                    <Bed className="w-5 h-5 text-muted-foreground" />
                    {loading ? (
                      <Skeleton className="h-4 w-24" />
                    ) : (
                      <span>{data?.bedrooms ?? "-"} Bedroom{(data?.bedrooms ?? 0) > 1 ? "s" : ""}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="w-5 h-5 text-muted-foreground" />
                    {loading ? (
                      <Skeleton className="h-4 w-24" />
                    ) : (
                      <span>{data?.bathrooms ?? "-"} Bathroom{(data?.bathrooms ?? 0) > 1 ? "s" : ""}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Square className="w-5 h-5 text-muted-foreground" />
                    {loading ? (
                      <Skeleton className="h-4 w-16" />
                    ) : (
                      <span>{data?.area ?? "-"} m²</span>
                    )}
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
                      {loading ? (
                        <Skeleton className="h-5 w-full" />
                      ) : (
                        data?.description || "No description provided."
                      )}
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
                                    <AvatarFallback>
                                      {`${rev.author?.first_name?.[0] || ''}${rev.author?.last_name?.[0] || ''}`.toUpperCase() || (rev.author?.username || 'US').slice(0,2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <span>
                                        {`${(rev.author?.first_name || '')} ${(rev.author?.last_name || '')}`.trim() || rev.author?.username}
                                      </span>
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
                                    {me && rev.author?.id === me.id && (
                                      <div className="flex gap-2 mt-2">
                                        <Button variant="outline" size="sm" onClick={() => { setReviewRating(rev.rating); setReviewComment(rev.comment || ""); setIsEditingReview(true); }}>
                                          Edit
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={handleDeleteMyReview}>
                                          Delete
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* Write/Edit my review */}
                          <div className="mt-6">
                            <h3 className="mb-2 text-foreground">Reviews</h3>
                            {reviewError && (<div className="text-sm text-destructive mb-2">{reviewError}</div>)}
                            {/* Trigger to open editor */}
                            {!isEditingReview && (
                              <div className="flex items-center justify-between">
                                {myReview ? (
                                  <div className="text-sm text-muted-foreground">You have already reviewed this listing.</div>
                                ) : (
                                  <div className="text-sm text-muted-foreground">
                                    {me && data?.owner && me.id === (data.owner as any) ? "You cannot review your own listing." : "Share your experience by leaving a review."}
                                  </div>
                                )}
                                <div className="flex gap-2">
                                  {!myReview && (!me || !data?.owner || me.id !== (data.owner as any)) && (
                                    <Button size="sm" onClick={() => { setIsEditingReview(true); setReviewRating(0); setReviewComment(""); }}>
                                      Write a Review
                                    </Button>
                                  )}
                                  {myReview && (
                                    <>
                                      <Button variant="outline" size="sm" onClick={() => { setIsEditingReview(true); setReviewRating(myReview.rating); setReviewComment(myReview.comment || ""); }}>
                                        Edit Your Review
                                      </Button>
                                      <Button variant="destructive" size="sm" onClick={handleDeleteMyReview}>
                                        Delete
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                            {/* Editor */}
                            {isEditingReview && (
                              <div className="mt-3">
                                <div className="flex items-center gap-1 mb-2">
                                  {Array.from({ length: 5 }).map((_, i) => {
                                    const idx = i + 1;
                                    const filled = (reviewHover || reviewRating) >= idx;
                                    return (
                                      <button
                                        key={idx}
                                        type="button"
                                        onMouseEnter={() => setReviewHover(idx)}
                                        onMouseLeave={() => setReviewHover(0)}
                                        onClick={() => setReviewRating(idx)}
                                        className="p-0"
                                      >
                                        <Star className={`w-5 h-5 ${filled ? "fill-primary text-primary" : "text-primary"}`} />
                                      </button>
                                    );
                                  })}
                                </div>
                                <Textarea
                                  placeholder="Share your experience..."
                                  value={reviewComment}
                                  onChange={(e) => setReviewComment(e.target.value)}
                                  rows={4}
                                />
                                <div className="flex justify-end mt-2 gap-2">
                                  <Button variant="outline" onClick={() => { setIsEditingReview(false); setReviewRating(0); setReviewHover(0); setReviewComment(""); }}>
                                    Cancel
                                  </Button>
                                  <Button onClick={submitListingReview} disabled={reviewSubmitting || reviewRating === 0}>
                                    {reviewSubmitting ? (myReview ? "Saving..." : "Submitting...") : (myReview ? "Save Changes" : "Submit Review")}
                                  </Button>
                                </div>
                              </div>
                            )}
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
                    {((data?.owner_details as any)?.avatar_url || (data?.owner_details as any)?.avatar) ? (
                      <AvatarImage
                        src={
                          transformAvatar(
                            ((data?.owner_details as any)?.avatar_url || (data?.owner_details as any)?.avatar) as string
                          )
                        }
                        alt={data?.owner_details?.username || "Owner"}
                      />
                    ) : null}
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
                      {(() => {
                        const count = ownerReviews.length;
                        const avg = count
                          ? Math.round(
                              (ownerReviews.reduce((s, r) => s + (Number((r as any).rating) || 0), 0) / count) * 10
                            ) / 10
                          : 0;
                        return count > 0 ? (
                          <span className="text-sm">{avg.toFixed(1)} ({count} review{count === 1 ? "" : "s"})</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">No reviews yet</span>
                        );
                      })()}
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

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowOwnerProfile(true)}
                >
                  View Owner Profile
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
                onClick={async () => {
                  try {
                    const ownerId = (data?.owner_details?.id as any) ?? (data?.owner as any);
                    const sid = ownerId ? await openOrCreateByUserId(Number(ownerId)) : null;
                    if (sid && message.trim()) {
                      await sendMessageAPI(sid, message.trim());
                    }
                    setMessage("");
                    setShowContactDialog(false);
                    if (sid) {
                      onNavigate(`messages?conversation=${sid}`);
                    } else {
                      onNavigate("messages");
                    }
                  } catch (_) {
                    setShowContactDialog(false);
                    onNavigate("messages");
                  }
                }}
              >
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Listing</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">Copy and share this link:</div>
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="flex-1" />
              <Button
                onClick={async () => {
                  try { await navigator.clipboard.writeText(shareUrl); } catch (_) {}
                }}
              >
                Copy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Owner Profile Dialog */}
      <UserProfileDialog user={data?.owner_details || null} open={showOwnerProfile} onOpenChange={setShowOwnerProfile} />
    </div>
  );
}

// Favorites tab removed as requested; heart toggle at the header remains.
