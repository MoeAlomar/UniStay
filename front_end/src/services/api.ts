import axios from "axios";

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const storage = {
  get access() {
    return localStorage.getItem("accessToken");
  },
  set access(v: string | null) {
    if (v) localStorage.setItem("accessToken", v);
    else localStorage.removeItem("accessToken");
  },
  get refresh() {
    return localStorage.getItem("refreshToken");
  },
  set refresh(v: string | null) {
    if (v) localStorage.setItem("refreshToken", v);
    else localStorage.removeItem("refreshToken");
  },
};

export const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  if (storage.access) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${storage.access}`;
  }
  return config;
});

let refreshing = false;
let waiters: Array<() => void> = [];

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const status = error?.response?.status;
    const original = error.config || {};
    if (status === 401 && !original._retry && storage.refresh) {
      original._retry = true;
      if (refreshing) {
        await new Promise<void>((resolve) => waiters.push(resolve));
        return api(original);
      }
      try {
        refreshing = true;
        const { data } = await axios.post(`${API_BASE_URL}/users/refresh/`, {
          refresh: storage.refresh,
        });
        storage.access = data.access;
        waiters.forEach((w) => w());
        waiters = [];
        return api(original);
      } catch (e) {
        storage.access = null;
        storage.refresh = null;
        waiters = [];
        throw e;
      } finally {
        refreshing = false;
      }
    }
    throw error;
  }
);

export function setTokens(access: string, refresh?: string) {
  storage.access = access;
  if (refresh) storage.refresh = refresh;
}

export function clearTokens() {
  storage.access = null;
  storage.refresh = null;
}

