import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token:           string | null;
  user:            { id: number; email: string; full_name: string; country_code?: string } | null;
  isAuthenticated: boolean;
  setAuth:         (user: AuthState['user'], token: string) => void;
  logout:          () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token:           null,
      user:            null,
      isAuthenticated: false,
      setAuth:         (user, token) => set({ user, token, isAuthenticated: true }),
      logout:          ()            => set({ user: null, token: null, isAuthenticated: false }),
    }),
    { name: 'dl-auth' }
  )
);
