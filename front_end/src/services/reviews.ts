import { api } from "./api";
import type { User } from "./auth";

export type Review = {
  id: string; // UUID from backend
  target_type: "USER" | "LISTING";
  target_id?: number | string; // client-side convenience when creating
  rating: number;
  comment: string;
  author: User; // serialized author object
  target_user?: User | null;
  target_listing?: string | null;
  created_at: string;
};

export async function listReviews(params?: { target_type?: "USER" | "LISTING"; target_id?: string | number }) {
  const { data } = await api.get("/reviews/", { params });
  return data as Review[];
}

export async function createReview(payload: Omit<Review, "id" | "created_at" | "author">) {
  // Route to specialized endpoints so backend sets correct target fields
  const { target_type, target_id, rating, comment } = payload as any;
  if (!target_type || !target_id) {
    throw new Error("target_type and target_id are required");
  }
  let url = "/reviews/";
  if (target_type === "USER") {
    url = `/reviews/users/${target_id}/`;
  } else if (target_type === "LISTING") {
    url = `/reviews/listings/${target_id}/`;
  }
  const { data } = await api.post(url, { rating, comment });
  return data as Review;
}

export async function updateReview(id: string, payload: Partial<Pick<Review, "rating" | "comment">>) {
  const { data } = await api.patch(`/reviews/${id}/`, payload);
  return data as Review;
}

export async function deleteReview(id: string) {
  await api.delete(`/reviews/${id}/`);
}

