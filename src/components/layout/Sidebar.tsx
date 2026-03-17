"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, LayoutDashboard, Grid2X2, History, LineChart, Settings, LogOut, User, Shield, BarChart3 } from "lucide-react";
import { useBotStatus } from "@/lib/hooks";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const BASE_NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Grids", href: "/grids", icon: Grid2X2 },
  { name: "Trades", href: "/trades", icon: History },
  { name: "Chart", href: "/chart", icon: LineChart },
  { name: "Settings", href: "/settings", icon: Settings },
];

const ADMIN_NAV_ITEMS = [
  { name: "Analytics", href: "/analytics", icon: BarChart3, adminOnly: true },
  { name: "Admin", href: "/admin", icon: Shield, adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { status, isLoading, isError } = useBotStatus();
  const { session, logout } = useAuth();

  const navItems = session?.role === 'admin'
    ? [...BASE_NAV_ITEMS, ...ADMIN_NAV_ITEMS]
    : BASE_NAV_ITEMS;

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href));

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Don't render sidebar on login page
  if (pathname === "/login") return null;

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
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-[var(--bg-elevated)] text-white border-l-4 border-l-[var(--blue)] pl-3"
                  : (item as any).adminOnly
                  ? "text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-white"
              )}
            >
              <item.icon className={cn(
                "size-5",
                active ? "text-[var(--blue)]" : (item as any).adminOnly ? "text-purple-400" : ""
              )} />
              {item.name}
              {item.name === 'Admin' && (
                <span className="ml-auto text-[9px] font-bold uppercase bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">Admin</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* System Version — above the border */}
      <div className="px-4 pt-2 pb-1 flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">System Version</span>
        <span className="text-xs font-mono text-[var(--text-muted)]">v1.0.3</span>
      </div>

      {/* User Profile — bottom anchored */}
      {session && (
        <div className="mt-0 px-4 pb-4 pt-3 border-t border-border/50">
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
    </aside>
  );
}

