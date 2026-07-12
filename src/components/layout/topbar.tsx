"use client";

import { usePathname } from "next/navigation";
import { Search, Bell, Menu, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUIStore } from "@/store/ui-store";

// Build a breadcrumb from pathname
function getPageTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  if (!last) return "Dashboard";

  // Handle dynamic segments
  if (last.length === 36 && last.includes("-")) {
    const parent = segments[segments.length - 2];
    return parent ? capitalize(parent) + " Detail" : "Detail";
  }

  return capitalize(last.replace(/-/g, " "));
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function Topbar() {
  const pathname = usePathname();
  const { setSearchOpen, toggleSidebar } = useUIStore();
  const { setTheme, theme } = useTheme();

  const title = getPageTitle(pathname);

  return (
    <header className="h-14 border-b border-border flex items-center px-4 gap-3 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
      <button
        onClick={toggleSidebar}
        className="p-1.5 rounded-md hover:bg-muted transition-colors md:hidden"
      >
        <Menu className="w-4 h-4" />
      </button>

      <h1 className="text-sm font-semibold text-foreground">{title}</h1>

      <div className="flex-1" />

      {/* Search trigger */}
      <button
        onClick={() => setSearchOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-muted/50 text-muted-foreground hover:bg-muted transition-colors text-xs"
        id="global-search-trigger"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline text-xs bg-background border border-border rounded px-1">⌘K</kbd>
      </button>

      {/* Theme toggle */}
      <DropdownMenu>
        <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "icon", className: "w-8 h-8" })}>
          {theme === "dark" ? (
            <Moon className="w-4 h-4" />
          ) : theme === "light" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Monitor className="w-4 h-4" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setTheme("light")}>
            <Sun className="w-4 h-4 mr-2" /> Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            <Moon className="w-4 h-4 mr-2" /> Dark
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>
            <Monitor className="w-4 h-4 mr-2" /> System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
