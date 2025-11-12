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
      <DialogContent className="sm:max-w-[900px] md:max-w-5xl lg:max-w-6xl min-w-[320px] w-auto h-auto max-h-[90vh] flex flex-col border-2 border-border shadow-xl px-10 py-8 overflow-y-auto">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl">Profile</DialogTitle>
        </DialogHeader>
        {!user ? (
          <div className="text-base text-muted-foreground p-4">No user selected.</div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center gap-6 md:gap-8 p-6 rounded-lg bg-secondary/30">
          <Avatar className="w-24 h-24 border-2 border-primary/20">
            {(user?.avatar_url || (user as any)?.avatar) ? (
              <AvatarImage src={transformAvatar((user?.avatar_url || (user as any)?.avatar) as string)} alt={user?.username || "User"} />
            ) : null}
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
              <div className="space-y-2 pl-2">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold">{`${user.first_name} ${user.last_name}`.trim() || user.username}</span>
                  {user.is_email_verified && (
                    <Badge variant="success" className="px-3 py-1">Verified</Badge>
                  )}
                </div>
                <div className="text-base text-muted-foreground">@{user.username}</div>
                <div className="text-sm text-muted-foreground capitalize">Role: {user.role}</div>
              </div>
            </div>

            {/* Reviews section - stars for each review are already below the name */}
            <div className="flex-1">
              <h3 className="mb-6 text-base font-semibold text-foreground">Reviews</h3>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <div className="space-y-5">
                  {reviews.length === 0 && (
                    <div className="text-sm text-muted-foreground p-5 text-center bg-secondary/20 rounded-lg">
                      No reviews yet. Be the first to share your experience!
                    </div>
                  )}
                  {reviews.map((r) => (
                    <div key={r.id} className="border border-border rounded-lg p-5 hover:shadow-md transition-shadow bg-card">
                      <div className="flex items-center gap-1.5 mb-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${r.rating >= i + 1 ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                        ))}
                      </div>
                      <div className="text-sm mb-3">
                        <span className="font-semibold mr-2">{`${(r.author?.first_name || '') } ${(r.author?.last_name || '')}`.trim() || r.author?.username}</span>
                        <span className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="text-sm text-foreground whitespace-pre-wrap break-words">{r.comment}</div>
                      {me && r.author?.id === me.id && (
                        <div className="flex gap-3 mt-4">
                          <Button variant="outline" size="sm" className="h-8 px-4 text-sm" onClick={() => { setRating(r.rating); setComment(r.comment || ""); setIsEditing(true); }}>
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" className="h-8 px-4 text-sm" onClick={deleteMyReview}>
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-border pt-8">
              <h3 className="mb-6 text-base font-semibold text-foreground">Write a Review</h3>
              {error && <div className="text-sm text-destructive mb-4 p-4 bg-destructive/10 rounded-md">{error}</div>}
              {!isEditing && (
                <div className="flex items-center justify-between p-5 bg-secondary/20 rounded-lg">
                  {myReview ? (
                    <div className="text-sm text-muted-foreground">You have already reviewed this user.</div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {me && user && me.id === user.id ? "You cannot review yourself." : "Share your experience by leaving a review."}
                    </div>
                  )}
                  <div>
                  </div>
                   {!myReview && (!me || !user || me.id !== user.id) && (
                      <Button className="h2 px-2 text-sm" onClick={() => { setIsEditing(true); setRating(0); setComment(""); }}>
                        Write a Reviews
                      </Button>
                    )}
                    
                    {myReview && (
                      <>
                        <Button variant="outline" className="h-9 px-5 text-sm" onClick={() => { setIsEditing(true); setRating(myReview.rating); setComment(myReview.comment || ""); }}>
                          Edit Your Review
                        </Button>
                        <Button variant="destructive" className="h-9 px-5 text-sm" onClick={deleteMyReview}>
                          Delete
                        </Button>
                      </>
                    )}
                </div>
              )}
              {isEditing && (
                <div className="mt-5 p-6 border border-border rounded-lg bg-card space-y-5">
                  <div>
                    <label className="text-sm font-medium mb-3 block">Rating</label>
                    <div className="flex items-center gap-2">
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
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star className={`w-6 h-6 ${filled ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-3 block">Comment</label>
                    <Textarea
                      placeholder="Share your experience..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[100px] text-sm p-3"
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" className="h-9 px-5 text-sm" onClick={() => { setIsEditing(false); setRating(0); setHoverRating(0); setComment(""); }}>
                      Cancel
                    </Button>
                    <Button className="h-9 px-5 text-sm" onClick={submitReview} disabled={submitting || rating === 0}>
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