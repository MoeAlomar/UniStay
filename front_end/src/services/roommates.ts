import { api } from "./api";

export type RoommatePost = {
  id: number;
  title: string;
  description: string;
  budget: number;
  preferred_district: string;
  author: number;
  created_at: string;
};

export async function posts() {
  const { data } = await api.get("/roommates/posts/");
  return data as RoommatePost[];
}

export async function createPost(payload: Omit<RoommatePost, "id" | "author" | "created_at">) {
  const { data } = await api.post("/roommates/posts/", payload);
  return data as RoommatePost;
}

