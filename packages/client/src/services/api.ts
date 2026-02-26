const API_BASE = "/api";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: number; message: string };
}

let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setOnUnauthorized(callback: () => void): void {
  onUnauthorized = callback;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data: ApiResponse<T> = await response.json();

  if (!response.ok || !data.success) {
    const message = data.error?.message || `HTTP ${response.status}`;
    const error = new Error(message);
    (error as Error & { status: number }).status = response.status;
    throw error;
  }

  return data.data as T;
}

async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
    credentials: "include",
  });

  // Auto-refresh on 401
  if (response.status === 401 && accessToken) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${accessToken}`;
      return fetch(`${API_BASE}${url}`, {
        ...options,
        headers,
        credentials: "include",
      });
    }

    // Refresh failed — trigger logout
    if (onUnauthorized) {
      onUnauthorized();
    }
  }

  return response;
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) return false;

    const data = await res.json();
    if (data.success && data.data?.accessToken) {
      accessToken = data.data.accessToken;
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export const api = {
  async get<T>(url: string): Promise<T> {
    const response = await fetchWithAuth(url);
    return handleResponse<T>(response);
  },

  async post<T>(url: string, body?: unknown): Promise<T> {
    const response = await fetchWithAuth(url, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  async put<T>(url: string, body?: unknown): Promise<T> {
    const response = await fetchWithAuth(url, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  async delete<T>(url: string): Promise<T> {
    const response = await fetchWithAuth(url, { method: "DELETE" });
    return handleResponse<T>(response);
  },
};
