import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { api, setAccessToken, setOnUnauthorized } from "../services/api";

interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  setUser: (user: User) => void;
  setTokenFromCallback: (token: string) => void;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

interface AuthResponse {
  user: User;
  accessToken: string;
}

export const useAuthStore = create<AuthStore>()(
  immer((set) => {
    // Set up unauthorized handler
    setOnUnauthorized(() => {
      set((state) => {
        state.user = null;
        state.isAuthenticated = false;
      });
      setAccessToken(null);
    });

    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const data = await api.post<AuthResponse>("/auth/login", {
            email,
            password,
          });

          setAccessToken(data.accessToken);

          set((state) => {
            state.user = data.user;
            state.isAuthenticated = true;
            state.isLoading = false;
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Login failed";
          set((state) => {
            state.isLoading = false;
            state.error = message;
          });
          throw err;
        }
      },

      register: async (email: string, password: string, name?: string) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const data = await api.post<AuthResponse>("/auth/register", {
            email,
            password,
            name,
          });

          setAccessToken(data.accessToken);

          set((state) => {
            state.user = data.user;
            state.isAuthenticated = true;
            state.isLoading = false;
          });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Registration failed";
          set((state) => {
            state.isLoading = false;
            state.error = message;
          });
          throw err;
        }
      },

      logout: async () => {
        try {
          await api.post("/auth/logout");
        } catch {
          // Logout even if server call fails
        }

        setAccessToken(null);

        set((state) => {
          state.user = null;
          state.isAuthenticated = false;
        });
      },

      refreshToken: async () => {
        set((state) => {
          state.isLoading = true;
        });

        try {
          const data = await api.post<AuthResponse>("/auth/refresh");

          setAccessToken(data.accessToken);

          set((state) => {
            state.user = data.user;
            state.isAuthenticated = true;
            state.isLoading = false;
          });
        } catch {
          setAccessToken(null);
          set((state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.isLoading = false;
          });
        }
      },

      setUser: (user: User) => {
        set((state) => {
          state.user = user;
        });
      },

      setTokenFromCallback: (token: string) => {
        setAccessToken(token);
        set((state) => {
          state.isAuthenticated = true;
        });
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },
    };
  }),
);
