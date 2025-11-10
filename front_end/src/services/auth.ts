import { api, setTokens } from "./api";

export type User = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: "student" | "landlord" | "admin";
  gender: string;
  phone: string;
  is_email_verified: boolean;
  avatar_url?: string | null;
};

function normalizeUser(data: any): User {
  const avatar_url = (data?.avatar_url ?? null) || (data?.avatar ?? null) || null;
  return {
    id: Number(data.id),
    username: String(data.username || ""),
    first_name: String(data.first_name || ""),
    last_name: String(data.last_name || ""),
    email: String(data.email || ""),
    role: (data.role as any) ?? "student",
    gender: String(data.gender || ""),
    phone: String(data.phone || ""),
    is_email_verified: !!data.is_email_verified,
    avatar_url,
  };
}

export async function login(email: string, password: string) {
  const { data } = await api.post("/users/login/", { email, password });
  setTokens(data.access, data.refresh);
  const user = normalizeUser(data.user);
  try { localStorage.setItem("currentUserId", String(user.id)); } catch (_) {}
  return { access: data.access, refresh: data.refresh, user, redirect_url: data.redirect_url } as { access: string; refresh: string; user: User; redirect_url: string };
}

export async function register(payload: {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: "student" | "landlord" | "other";
  gender: string;
  phone: string;
}) {
  const { data } = await api.post("/users/register/", payload);
  return normalizeUser(data);
}

export async function profile() {
  const { data } = await api.get("/users/profile/");
  const user = normalizeUser(data);
  try { localStorage.setItem("currentUserId", String(user.id)); } catch (_) {}
  return user;
}

export async function getUserById(userId: number) {
  const { data } = await api.get(`/users/${userId}/`);
  return normalizeUser(data);
}

export async function getUserByUsername(username: string) {
  const { data } = await api.get(`/users/by-username/${encodeURIComponent(username)}/`);
  return normalizeUser(data);
}

export async function updateAvatar(file: File) {
  const form = new FormData();
  form.append("avatar", file);
  const { data } = await api.patch("/users/profile/", form, { headers: { "Content-Type": "multipart/form-data" } });
  return normalizeUser(data);
}

