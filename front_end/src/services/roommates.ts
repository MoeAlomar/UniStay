import { api } from "./api";
import type { User } from "./auth";
import type { Listing } from "./listings";

export type RoommatePost = {
  id: string;
  author: User; // read-only populated by backend
  max_budget: number;
  preferred_type?: "APARTMENT" | "STUDIO" | "OTHER" | null;
  notes?: string | null;
  female_only: boolean;
  university?: string | null;
  district?: string | null;
  created_at: string;
  updated_at: string;
};

export async function posts(params?: Partial<{
  female_only: boolean;
  university: string;
  district: string;
  preferred_type: "APARTMENT" | "STUDIO" | "OTHER";
}>) {
  const { data } = await api.get("/roommates/posts/", { params });
  return data as RoommatePost[];
}

export async function createPost(payload: Omit<RoommatePost, "id" | "author" | "created_at" | "updated_at">) {
  const { data } = await api.post("/roommates/posts/", payload);
  return data as RoommatePost;
}

export type RoommateGroup = {
  id: string;
  name: string;
  members: User[];
  leader: User;
  listing?: Listing | null;
  address?: string | null;
  university?: string | null;
  max_members: number;
  cost_per_member?: number | null;
  female_only: boolean;
  status: "OPEN" | "CLOSED";
  created_at: string;
  updated_at: string;
};

export async function groups() {
  const { data } = await api.get("/roommates/groups/");
  return data as RoommateGroup[];
}

// Create a roommate request to the post author
export async function createRequest(payload: {
  receiver: number;
  post?: string;
  notes?: string;
}) {
  const { data } = await api.post("/roommates/requests/", payload);
  return data as { id: string; status: "PENDING" | "ACCEPTED" | "REJECTED" };
}

