"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Menu, Activity } from "lucide-react";

const NO_LAYOUT_PATHS = ["/login"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullscreen = NO_LAYOUT_PATHS.includes(pathname);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isFullscreen) {
    return <>{children}</>;
  }

  return (
    <div className="flex w-full">
      <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <main className="flex-1 md:pl-[240px] flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-[var(--bg-darkest)]/95 backdrop-blur-md border-b border-border/50 md:hidden">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)] transition-colors"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Activity className="size-4" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white">MetalX Bot</span>
          </div>
        </div>

        <div className="flex-1 p-4 sm:p-6 lg:p-10 w-full max-w-screen-2xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
