"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, LayoutDashboard, Grid2X2, History, LineChart, Settings, LogOut, User } from "lucide-react";
import { useBotStatus } from "@/lib/hooks";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Grids", href: "/grids", icon: Grid2X2 },
  { name: "Trades", href: "/trades", icon: History },
  { name: "Chart", href: "/chart", icon: LineChart },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { status, isLoading, isError } = useBotStatus();
  const { session, logout } = useAuth();

  // Don't render sidebar on login page
  if (pathname === "/login") return null;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-[240px] flex flex-col bg-[var(--bg-darkest)] border-r border-border transition-transform max-md:-translate-x-full">
      {/* Logo Area */}
      <div className="flex h-16 items-center px-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Activity className="size-5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">MetalX Bot</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-[var(--bg-elevated)] text-white border-l-4 border-l-[var(--blue)] pl-3"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-white"
              )}
            >
              <item.icon className={cn("size-5", isActive ? "text-[var(--blue)]" : "")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Account Widget */}
      {session && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]/50 px-3 py-2.5">
            <div className="flex size-8 items-center justify-center rounded-full bg-[var(--blue)]/20 border border-[var(--blue)]/30 shrink-0">
              <User className="size-4 text-[var(--blue)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">@{session.actor}</p>
              <p className={cn(
                "text-[10px] uppercase font-bold tracking-wider",
                session.role === 'admin' ? "text-[var(--green)]" : "text-[var(--text-muted)]"
              )}>
                {session.role}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="shrink-0 p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--red)] hover:bg-[var(--red)]/10 transition-colors"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom Status Area */}
      <div className="p-4 border-t border-border/50 bg-[var(--bg-darkest)] mt-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">System Status</span>
          <span className="text-xs font-mono text-[var(--text-muted)]">v1.0.1</span>
        </div>

        <div className="flex items-center justify-between rounded-md bg-[var(--bg-card)] p-3 border border-border/50">
          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="size-2 rounded-full bg-[var(--text-muted)] animate-pulse" />
            ) : isError ? (
              <div className="size-2 rounded-full bg-[var(--red)]" />
            ) : (
              <div className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--green)] opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-[var(--green)]"></span>
              </div>
            )}
            <span className="text-sm font-medium text-white">
              {isLoading ? "Connecting" : isError ? "Offline" : "Online"}
            </span>
          </div>

          {!isLoading && status && (
            <span className={cn(
              "text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-[var(--bg-elevated)]",
              status.mode === 'live' ? "text-[var(--green)]" : "text-[var(--orange)]"
            )}>
              {status.mode} TEST
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}

