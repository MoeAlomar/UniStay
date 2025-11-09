import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Star } from "lucide-react";
import type { User } from "../services/auth";
import { profile } from "../services/auth";
import { listReviews, createReview, updateReview, deleteReview, type Review } from "../services/reviews";
import { Skeleton } from "./ui/skeleton";

interface Props {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileDialog({ user, open, onOpenChange }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    (async () => {
      if (!open || !user) return;
      try {
        setLoading(true);
        const list = await listReviews({ target_type: "USER", target_id: user.id });
        setReviews(Array.isArray(list) ? list : []);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load reviews");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, user]);

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

  // Do not auto-initialize edit fields; only when user clicks Edit/Write

  const initials = useMemo(() => {
    const fn = user?.first_name || "";
    const ln = user?.last_name || "";
    const i = `${fn.slice(0, 1)}${ln.slice(0, 1)}`.toUpperCase();
    return i || "US";
  }, [user]);

  function transformAvatar(url?: string | null): string | undefined {
    const src = typeof url === "string" ? url : undefined;
    if (!src || !src.includes("res.cloudinary.com") || !src.includes("/image/upload/")) return src;
    try {
      const marker = "/image/upload/";
      const idx = src.indexOf(marker);
      const before = src.slice(0, idx + marker.length);
      const after = src.slice(idx + marker.length);
      const hasTransforms = after[0] !== 'v' && after.includes('/');
      const transform = "c_fill,w_64,h_64,dpr_auto";
      if (hasTransforms) {
        return `${before}f_auto,q_auto,${transform},${after}`;
      }
      return `${before}f_auto,q_auto,${transform}/${after}`;
    } catch {
      return src;
    }
  }

  async function submitReview() {
    if (!user || !rating) return;
    try {
      setSubmitting(true);
      if (myReview) {
        const updated = await updateReview(myReview.id, { rating, comment });
        setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      } else {
        const created = await createReview({ target_type: "USER", target_id: user.id, rating, comment });
        setReviews((prev) => [created, ...prev]);
      }
      setRating(0);
      setComment("");
      setError(null);
      setIsEditing(false);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) {
        setError("Please log in to submit a review.");
      } else {
        const backendMsg = e?.response?.data?.detail || e?.response?.data?.non_field_errors?.[0];
        setError(backendMsg ?? e?.message ?? "Failed to submit review");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteMyReview() {
    if (!myReview) return;
    try {
      setSubmitting(true);
      await deleteReview(myReview.id);
      setReviews((prev) => prev.filter((r) => r.id !== myReview.id));
      setRating(0);
      setComment("");
      setIsEditing(false);
      setError(null);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) setError("Please log in to delete your review.");
      else setError(e?.response?.data?.detail ?? e?.message ?? "Failed to delete review");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>
        {!user ? (
          <div className="text-sm text-muted-foreground">No user selected.</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
          <Avatar className="w-16 h-16">
            {(user?.avatar_url || (user as any)?.avatar) ? (
              <AvatarImage src={transformAvatar((user?.avatar_url || (user as any)?.avatar) as string)} alt={user?.username || "User"} />
            ) : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span>{`${user.first_name} ${user.last_name}`.trim() || user.username}</span>
                  {user.is_email_verified && (
                    <Badge variant="success">Verified</Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
                <div className="text-sm text-muted-foreground">Role: {user.role}</div>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-foreground">Reviews</h3>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.length === 0 && (
                    <div className="text-sm text-muted-foreground">No reviews yet.</div>
                  )}
                  {reviews.map((r) => (
                    <div key={r.id} className="border-b border-border pb-2">
                      <div className="flex items-center gap-1 mb-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${r.rating >= i + 1 ? "fill-primary text-primary" : "text-primary"}`} />
                        ))}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium mr-2">{`${(r.author?.first_name || '')} ${(r.author?.last_name || '')}`.trim() || r.author?.username}</span>
                        <span className="text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                      </div>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap break-all">{r.comment}</div>
                      {me && r.author?.id === me.id && (
                        <div className="flex gap-2 mt-2">
                          <Button variant="outline" size="sm" onClick={() => { setRating(r.rating); setComment(r.comment || ""); setIsEditing(true); }}>
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={deleteMyReview}>
                            Delete
                          </Button>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-foreground">Reviews</h3>
              {error && <div className="text-sm text-destructive mb-2">{error}</div>}
              {!isEditing && (
                <div className="flex items-center justify-between">
                  {myReview ? (
                    <div className="text-sm text-muted-foreground">You have already reviewed this user.</div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {me && user && me.id === user.id ? "You cannot review yourself." : "Share your experience by leaving a review."}
                    </div>
                  )}
                  <div className="flex gap-2">
                    {!myReview && (!me || !user || me.id !== user.id) && (
                      <Button size="sm" onClick={() => { setIsEditing(true); setRating(0); setComment(""); }}>
                        Write a Review
                      </Button>
                    )}
                    {myReview && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => { setIsEditing(true); setRating(myReview.rating); setComment(myReview.comment || ""); }}>
                          Edit Your Review
                        </Button>
                        <Button variant="destructive" size="sm" onClick={deleteMyReview}>
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
              {isEditing && (
                <div className="mt-3">
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const idx = i + 1;
                      const filled = (hoverRating || rating) >= idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onMouseEnter={() => setHoverRating(idx)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(idx)}
                          className="p-0"
                        >
                          <Star className={`w-5 h-5 ${filled ? "fill-primary text-primary" : "text-primary"}`} />
                        </button>
                      );
                    })}
                  </div>
                  <Textarea
                    placeholder="Share your experience..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                  />
                  <div className="flex justify-end mt-2 gap-2">
                    <Button variant="outline" onClick={() => { setIsEditing(false); setRating(0); setHoverRating(0); setComment(""); }}>
                      Cancel
                    </Button>
                    <Button onClick={submitReview} disabled={submitting || rating === 0}>
                      {submitting ? (myReview ? "Saving..." : "Submitting...") : (myReview ? "Save Changes" : "Submit Review")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default UserProfileDialog;
