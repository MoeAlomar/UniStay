import { api } from "./api";

export type Review = {
  id: number;
  target_type: "USER" | "LISTING";
  target_id: number | string;
  rating: number;
  comment: string;
  author: number;
  created_at: string;
};

export async function listReviews(params?: { target_type?: "USER" | "LISTING"; target_id?: string | number }) {
  const { data } = await api.get("/reviews/", { params });
  return data as Review[];
}

export async function createReview(payload: Omit<Review, "id" | "created_at" | "author">) {
  const { data } = await api.post("/reviews/", payload);
  return data as Review;
}

