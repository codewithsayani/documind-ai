"use client";

import { useEffect } from "react";
import { Profile, UserSettings } from "@/types";
import { useAuthStore } from "@/store/auth-store";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { GlobalSearch } from "@/components/search/global-search";
import { useUIStore } from "@/store/ui-store";

interface DashboardShellProps {
  children: React.ReactNode;
  profile: Profile | null;
  settings: UserSettings | null;
}

export function DashboardShell({ children, profile, settings }: DashboardShellProps) {
  const { setProfile, setSettings, setLoading } = useAuthStore();
  const { searchOpen, setSearchOpen } = useUIStore();

  useEffect(() => {
    setProfile(profile);
    setSettings(settings);
    setLoading(false);
  }, [profile, settings, setProfile, setSettings, setLoading]);

  // Global keyboard shortcut for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setSearchOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-6 max-w-7xl mx-auto animate-in">
            {children}
          </div>
        </main>
      </div>
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
