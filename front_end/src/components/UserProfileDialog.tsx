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
      <DialogContent className="w-[95vw] sm:w-[640px] max-w-[640px] min-w-[320px] min-h-[520px] max-h-[85vh] flex flex-col border-2 border-border shadow-xl px-12 py-10 overflow-y-auto">
        <DialogHeader className="mb-8">
          <DialogTitle className="text-2xl">Profile</DialogTitle>
        </DialogHeader>
        {!user ? (
          <div className="text-base text-muted-foreground p-4">No user selected.</div>
        ) : (
          <div className="space-y-10">
            <div className="flex items-center gap-8 p-8 rounded-lg bg-secondary/30">
              <Avatar className="w-32 h-32 border-2 border-primary/20 flex-shrink-0">
                {(user?.avatar_url || (user as any)?.avatar) ? (
                  <AvatarImage className="object-cover" src={transformAvatar((user?.avatar_url || (user as any)?.avatar) as string)} alt={user?.username || "User"} />
                ) : null}
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="space-y-2 pl-2">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl font-semibold">{`${user.first_name} ${user.last_name}`.trim() || user.username}</span>
                  {user.is_email_verified && (
                    <Badge variant="success" className="px-3 py-1">Verified</Badge>
                  )}
                </div>
                <div className="text-base text-muted-foreground">@{user.username}</div>
                <div className="text-sm text-muted-foreground capitalize">Role: {user.role}</div>
              </div>
            </div>

            <div className="flex-1">
              <h3 className="mb-7 text-lg font-semibold text-foreground">Reviews</h3>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.length === 0 && (
                    <div className="text-sm text-muted-foreground p-6 text-center bg-secondary/20 rounded-lg">
                      No reviews yet. Be the first to share your experience!
                    </div>
                  )}
                  {reviews.map((r) => (
                    <div key={r.id} className="border border-border rounded-lg p-6 hover:shadow-md transition-shadow bg-card">
                      <div className="flex items-center gap-2 mb-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-5 h-5 ${r.rating >= i + 1 ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                        ))}
                      </div>
                      <div className="text-sm mb-4">
                        <span className="font-semibold mr-2">{`${(r.author?.first_name || '') } ${(r.author?.last_name || '')}`.trim() || r.author?.username}</span>
                        <span className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="text-sm text-foreground whitespace-pre-wrap break-words max-w-full">{r.comment}</div>
                      {me && r.author?.id === me.id && (
                        <div className="flex gap-3 mt-5">
                          <Button variant="outline" size="sm" className="h-9 px-5 text-sm" onClick={() => { setRating(r.rating); setComment(r.comment || ""); setIsEditing(true); }}>
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" className="h-9 px-5 text-sm" onClick={deleteMyReview}>
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-border pt-10">
              <h3 className="mb-7 text-lg font-semibold text-foreground">Write a Review</h3>
              {error && <div className="text-sm text-destructive mb-5 p-4 bg-destructive/10 rounded-md">{error}</div>}
              {!isEditing && (
                <div className="p-6 bg-secondary/20 rounded-lg">
                  {myReview ? (
                    <div className="text-sm text-muted-foreground">You have already reviewed this user.</div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {me && user && me.id === user.id ? "You cannot review yourself." : "Share your experience by leaving a review."}
                    </div>
                  )}
                  <div className="mt-6 flex justify-end">
                    {!myReview && (!me || !user || me.id !== user.id) && (
                      <Button className="h-10 px-6 text-sm" onClick={() => { setIsEditing(true); setRating(0); setComment(""); }}>
                        Write a Review
                      </Button>
                    )}
                    {myReview && (
                      <div className="flex gap-3">
                        <Button variant="outline" className="h-10 px-6 text-sm" onClick={() => { setIsEditing(true); setRating(myReview.rating); setComment(myReview.comment || ""); }}>
                          Edit Your Review
                        </Button>
                        <Button variant="destructive" className="h-10 px-6 text-sm" onClick={deleteMyReview}>
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {isEditing && (
                <div className="mt-6 p-7 border border-border rounded-lg bg-card space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-4 block">Rating</label>
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
                    <label className="text-sm font-medium mb-4 block">Comment</label>
                    <Textarea
                      placeholder="Share your experience..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[120px] text-sm p-4"
                      rows={5}
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-3">
                    <Button variant="outline" className="h-10 px-6 text-sm" onClick={() => { setIsEditing(false); setRating(0); setHoverRating(0); setComment(""); }}>
                      Cancel
                    </Button>
                    <Button className="h-10 px-6 text-sm" onClick={submitReview} disabled={submitting || rating === 0}>
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
