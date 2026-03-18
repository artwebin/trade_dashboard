"use client";

import { useState, useEffect, useRef } from "react";
import { Clock } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Any value that changes when fresh data arrives (e.g. status object ref, timestamp, etc.) */
  lastUpdate?: unknown;
}

export function PageHeader({ title, description, lastUpdate }: PageHeaderProps) {
  const [secondsAgo, setSecondsAgo] = useState(0);
  const lastFetchedAt = useRef<number>(Date.now());

  // Reset the clock whenever the upstream data changes
  useEffect(() => {
    if (lastUpdate !== undefined && lastUpdate !== null) {
      lastFetchedAt.current = Date.now();
      setSecondsAgo(0);
    }
  }, [lastUpdate]);

  // Tick every second so the display counts up naturally
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastFetchedAt.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatElapsed = (s: number): string => {
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-border/40">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">{title}</h1>
        {description && (
          <p className="text-sm text-[var(--text-secondary)] mt-1.5">{description}</p>
        )}
      </div>
      
      {lastUpdate !== undefined && lastUpdate !== null && (
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] bg-[var(--bg-elevated)]/50 px-3 py-1.5 rounded-full border border-border/50">
          <Clock className="size-3.5" />
          <span>Last updated: {formatElapsed(secondsAgo)}</span>
        </div>
      )}
    </div>
  );
}
