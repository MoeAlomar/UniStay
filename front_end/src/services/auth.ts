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
};

export async function login(email: string, password: string) {
  const { data } = await api.post("/users/login/", { email, password });
  setTokens(data.access, data.refresh);
  return data as { access: string; refresh: string; user: User; redirect_url: string };
}

export async function register(payload: {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: "student" | "landlord";
  gender: string;
  phone: string;
}) {
  const { data } = await api.post("/users/register/", payload);
  return data as User;
}

export async function profile() {
  const { data } = await api.get("/users/profile/");
  return data as User;
}

