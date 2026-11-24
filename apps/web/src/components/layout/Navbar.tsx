"use client";

import { useWorkspaceStore } from "@/lib/store";
import {
  BarChart3,
  BookOpen,
  Calendar,
  Compass,
  Database,
  Droplets,
  FolderHeart,
  GitCompare,
  Layers,
  Menu,
  Settings,
  Sliders,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: Compass },
  { href: "/explore", label: "Explorer", icon: Layers },
  { href: "/events", label: "Event Catalog", icon: Calendar },
  { href: "/compare", label: "Compare", icon: GitCompare },
  { href: "/similarity", label: "Similar Events", icon: Sparkles },
  { href: "/seasonality", label: "Seasonality", icon: BarChart3 },
  { href: "/relationships", label: "Relationships", icon: Sliders },
  { href: "/detection", label: "Workbench", icon: Sliders },
  { href: "/datasets", label: "Datasets", icon: Database },
  { href: "/methodology", label: "Methodology", icon: BookOpen },
  { href: "/workspace", label: "Workspace", icon: FolderHeart },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { comparisonEventIds } = useWorkspaceStore();

  return (
    <header className="sticky top-0 z-50 bg-hydro-bg/95 border-b border-hydro-border backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#46B5F5] to-[#5C82FF] flex items-center justify-center text-white shadow-md">
            <Droplets className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-hydro-text flex items-center gap-1.5">
              <span>HydroEventLab</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-hydro-elevated text-hydro-streamflow font-mono font-medium">
                v1.0
              </span>
            </div>
            <div className="text-[10px] text-hydro-muted tracking-tight font-medium hidden sm:block">
              Every catchment responds differently.
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  isActive
                    ? "bg-hydro-surface text-hydro-streamflow border border-hydro-border"
                    : "text-hydro-muted hover:text-hydro-text hover:bg-hydro-elevated/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.href === "/compare" && comparisonEventIds.length > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-hydro-streamflow/20 text-hydro-streamflow font-mono font-bold">
                    {comparisonEventIds.length}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Utility Buttons */}
        <div className="flex items-center space-x-2">
          <Link
            href="/settings"
            title="Application Preferences"
            className="p-1.5 rounded-md text-hydro-muted hover:text-hydro-text hover:bg-hydro-elevated border border-transparent hover:border-hydro-border transition-colors"
          >
            <Settings className="w-4 h-4" />
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-md text-hydro-muted hover:text-hydro-text hover:bg-hydro-elevated transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-hydro-border bg-hydro-surface px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium ${
                  isActive
                    ? "bg-hydro-elevated text-hydro-streamflow border border-hydro-border"
                    : "text-hydro-muted hover:text-hydro-text hover:bg-hydro-elevated/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.href === "/compare" && comparisonEventIds.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-hydro-streamflow/20 text-hydro-streamflow font-mono font-bold">
                    {comparisonEventIds.length} selected
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
