import { create } from "zustand";
import { Profile, UserSettings } from "@/types";

interface AuthState {
  profile: Profile | null;
  settings: UserSettings | null;
  isLoading: boolean;
  setProfile: (profile: Profile | null) => void;
  setSettings: (settings: UserSettings | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  settings: null,
  isLoading: true,
  setProfile: (profile) => set({ profile }),
  setSettings: (settings) => set({ settings }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ profile: null, settings: null, isLoading: false }),
}));
