"use client";

import useSWR from "swr";
import { API_BASE, fetcher } from "@/lib/api";
import { timeAgo, formatUsd, formatPrice } from "@/lib/utils";
import { Activity, ShoppingCart, DollarSign } from "lucide-react";

interface PaperLogEntry {
  id: number;
  timestamp: number;
  engine: string;
  token: string;
  action: string;
  price: number;
  amount_token: number;
  amount_usd: number;
  details: string;
}

export function ActivityFeed() {
  const { data, isLoading } = useSWR<{ entries: PaperLogEntry[] }>(
    `${API_BASE}/api/paper-log?limit=50`, // fetch more before filtering
    fetcher,
    { refreshInterval: 10000 }
  );

  const logs = data?.entries?.filter(
    (e) => e.action.toUpperCase() === "BUY" || e.action.toUpperCase() === "SELL"
  ).slice(0, 20); // Keep max 20 for feed

  if (isLoading) {
    return (
      <div className="w-full rounded-xl border border-[var(--border)]/40 bg-[var(--bg-card)] p-6 min-h-[300px] flex items-center justify-center">
        <div className="flex animate-pulse items-center gap-2 text-[var(--text-muted)]">
          <Activity className="size-4 animate-spin" /> Fetching live trade feed...
        </div>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="w-full rounded-xl border border-[var(--border)]/40 bg-[var(--bg-card)] p-8 text-center text-[var(--text-muted)] h-[300px] flex flex-col items-center justify-center">
        No recent buy/sell activity.
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-[var(--border)]/50 bg-[var(--bg-card)] overflow-hidden flex flex-col h-[400px]">
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]/50 bg-[var(--bg-card-hover)]/30 shrink-0">
        <div className="flex items-center gap-2">
           <div className="relative flex size-2">
             <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--green)] opacity-75"></span>
             <span className="relative inline-flex size-2 rounded-full bg-[var(--green)]"></span>
           </div>
           <h3 className="font-semibold text-sm uppercase tracking-wider text-[var(--text-primary)]">Live Trade Feed</h3>
        </div>
      </div>
      
      <div className="overflow-y-auto flex-1 p-2 space-y-1">
        {logs.map((log) => {
          const isBuy = log.action.toUpperCase() === "BUY";
          return (
            <div key={log.id} className="flex items-center gap-3 p-2 hover:bg-[var(--bg-elevated)]/30 transition-colors rounded-lg">
              <div className="mt-0.5 shrink-0">
                 {isBuy ? (
                   <span className="text-[var(--green)]">🟢</span>
                 ) : (
                   <span className="text-[var(--orange)]">💰</span>
                 )}
              </div>
              
              <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                 <div className="flex items-center gap-2 text-sm">
                    <span className={isBuy ? "text-[var(--green)] font-bold" : "text-[var(--orange)] font-bold"}>
                      {log.action.toUpperCase()}
                    </span>
                    <span className="font-bold text-[var(--text-primary)]">{log.token}</span>
                    
                    <span className="text-[var(--text-secondary)] hidden sm:inline-block ml-1">
                      {isBuy ? (
                        `${log.amount_token.toLocaleString(undefined, { maximumFractionDigits: 0 })} @ ${formatPrice(log.price, log.token)}`
                      ) : (
                        <span className="text-[var(--green)] font-mono">{log.amount_usd > 0 ? "+" : ""}{formatUsd(log.amount_usd)}</span>
                      )}
                    </span>
                 </div>
                 
                 <span className="text-xs text-[var(--text-muted)] whitespace-nowrap font-medium shrink-0">
                   {timeAgo(log.timestamp)}
                 </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
