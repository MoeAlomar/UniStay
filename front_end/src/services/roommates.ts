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

export async function deletePost(id: string) {
  const { data } = await api.delete(`/roommates/posts/${id}/`);
  return data as unknown;
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

export async function leaveGroup(id: string) {
  const { data } = await api.post(`/roommates/groups/${id}/leave/`);
  return data as { success: string };
}

export async function kickMember(groupId: string, memberId: number) {
  const { data } = await api.post(`/roommates/groups/${groupId}/kick/`, { member_id: memberId });
  return data as { success: string };
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

export type RoommateRequest = {
  id: string;
  sender: User;
  receiver: User | number; // backend may return id
  receiver_details?: User; // backend now returns nested receiver details
  post?: RoommatePost | null;
  notes?: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  created_at: string;
};

export async function requests() {
  const { data } = await api.get("/roommates/requests/");
  return data as RoommateRequest[];
}

export async function acceptRequest(id: string) {
  const { data } = await api.post(`/roommates/requests/${id}/accept/`);
  return data as { success: string };
}

export async function rejectRequest(id: string) {
  const { data } = await api.post(`/roommates/requests/${id}/reject/`);
  return data as { success: string };
}

export async function deleteRequest(id: string) {
  const { data } = await api.delete(`/roommates/requests/${id}/`);
  return data as unknown;
}

