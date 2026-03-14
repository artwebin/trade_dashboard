"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";

const NO_LAYOUT_PATHS = ["/login"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullscreen = NO_LAYOUT_PATHS.includes(pathname);

  if (isFullscreen) {
    return <>{children}</>;
  }

  return (
    <div className="flex w-full">
      <Sidebar />
      <main className="flex-1 md:pl-[240px] flex flex-col min-h-screen">
        <div className="flex-1 p-6 lg:p-10 w-full max-w-screen-2xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
