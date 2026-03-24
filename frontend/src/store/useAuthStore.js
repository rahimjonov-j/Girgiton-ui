import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      sessionToken: null,
      tempToken: null,
      waiter: null,
      
      setTempToken: (token) => set({ tempToken: token }),
      setSessionToken: (token) => set({ sessionToken: token, tempToken: null }),
      setWaiter: (waiterData) => set({ waiter: waiterData }),
      logout: () => set({ sessionToken: null, tempToken: null, waiter: null }),
    }),
    {
      name: 'auth-storage',
      // Only persist session token and waiter info, not temp Token
      partialize: (state) => ({ sessionToken: state.sessionToken, waiter: state.waiter }),
    }
  )
);
