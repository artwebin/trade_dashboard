"use client";

import { useBotStatus } from "@/lib/hooks";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle } from "lucide-react";

export function HeaderBar() {
  const { status, isLoading, isError } = useBotStatus();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Activity className="size-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">MetalX Bot</span>
          </div>

          <div className="flex items-center gap-4">
            {isLoading ? (
               <div className="h-5 w-20 animate-pulse rounded bg-muted"></div>
            ) : isError ? (
               <Badge variant="destructive" className="gap-1 animate-pulse">
                 <AlertTriangle className="size-3" /> API Disconnected
               </Badge>
            ) : status ? (
               <>
                 {status.grid_paused && (
                   <Badge variant="outline" className="border-accent text-accent animate-pulse">
                     Paused
                   </Badge>
                 )}
                 <Badge 
                   variant={status.mode === "live" ? "destructive" : "default"}
                   className="uppercase tracking-wider font-bold"
                 >
                   {status.mode}
                 </Badge>
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                   <span className="relative flex h-3 w-3">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                   </span>
                   Online
                 </div>
               </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
