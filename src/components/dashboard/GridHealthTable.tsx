"use client";

import { useBotStatus, useAllGrids } from "@/lib/hooks";
import { formatUsd, formatPrice } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, AlertTriangle, Play, Pause, CircleDashed } from "lucide-react";
import { cn } from "@/lib/utils";

export function GridHealthTable() {
  const { status, isLoading } = useBotStatus();
  const activeTokens = status ? Object.keys(status.grid_tokens) : [];
  const { grids, isLoading: gridsLoading } = useAllGrids(activeTokens);

  if (isLoading || gridsLoading) {
    return (
      <Card className="bg-[var(--bg-card)] border-[var(--border)]/40 min-h-[200px] animate-pulse">
        <CardContent className="h-full flex items-center justify-center text-[var(--text-muted)]">
          <Activity className="size-5 animate-spin mr-2" /> Loading Grid Health...
        </CardContent>
      </Card>
    );
  }

  if (!status || activeTokens.length === 0) {
    return null;
  }

  return (
    <Card className="bg-[var(--bg-card)] border-[var(--border)]/50 overflow-hidden">
      <div className="p-5 border-b border-[var(--border)]/50 bg-[var(--bg-card-hover)]/30">
        <h3 className="font-semibold text-lg tracking-tight text-[var(--text-primary)]">Grid Health Overview</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[var(--bg-darkest)]/50 text-[var(--text-secondary)]">
            <tr>
              <th className="px-6 py-4 font-medium">Token</th>
              <th className="px-6 py-4 font-medium">Price</th>
              <th className="px-6 py-4 font-medium">Grid Range</th>
              <th className="px-6 py-4 font-medium">Buy/Sell</th>
              <th className="px-6 py-4 font-medium">Today</th>
              <th className="px-6 py-4 font-medium">Total</th>
              <th className="px-6 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]/30">
            {activeTokens.map((token) => {
               const gridData = grids.find(g => g?.token === token);
               const basicData = status.grid_tokens[token];
               
               const isOOR = basicData.grid_status === "oor";
               const isActive = basicData.grid_status === "active";
               
               let minGridPrice = Infinity;
               let maxGridPrice = 0;

               if (gridData?.orders && gridData.orders.length > 0) {
                 for (const order of gridData.orders) {
                   if (order.buy_price && order.buy_price < minGridPrice) minGridPrice = order.buy_price;
                   if (order.sell_price && order.sell_price > maxGridPrice) maxGridPrice = order.sell_price;
                 }
               }
               
               const rangeString = gridData?.orders && gridData.orders.length > 0 && isFinite(minGridPrice) && maxGridPrice > 0
                  ? `${formatPrice(minGridPrice, token)} - ${formatPrice(maxGridPrice, token)}`
                  : "N/A";

               let statusUI = null;
               
               if (!gridData?.orders || gridData.orders.length === 0) {
                 statusUI = <span className="flex items-center gap-1.5 text-[var(--text-muted)]"><CircleDashed className="size-3.5" /> No Grid</span>;
               } else if (!basicData.active) {
                 statusUI = <span className="flex items-center gap-1.5 text-[var(--red)]"><Pause className="size-3.5" /> Paused</span>;
               } else if (isOOR) {
                 statusUI = <span className="flex items-center gap-1.5 text-[var(--orange)] font-bold"><AlertTriangle className="size-3.5" /> OOR</span>;
               } else {
                 statusUI = <span className="flex items-center gap-1.5 text-[var(--green)]"><Play className="size-3.5" /> Active</span>;
               }

               return (
                 <tr key={token} className="hover:bg-[var(--bg-elevated)]/20 transition-colors">
                   <td className="px-6 py-4 font-bold text-[var(--text-primary)]">{token}</td>
                   <td className="px-6 py-4 font-mono text-[var(--text-primary)]">{formatPrice(basicData.current_price, token)}</td>
                   <td className="px-6 py-4 font-mono text-[var(--text-secondary)]">{rangeString}</td>
                   <td className="px-6 py-4 font-mono">
                     <span className="text-[var(--blue)]">{basicData.bullets_buy}</span> / <span className="text-[var(--green)]">{basicData.bullets_sell}</span>
                   </td>
                   <td className={cn("px-6 py-4 font-mono", basicData.today_profit > 0 ? "text-[var(--green)]" : "text-[var(--text-secondary)]")}>
                     {basicData.today_profit > 0 ? "+" : ""}{formatUsd(basicData.today_profit)}
                   </td>
                   <td className={cn("px-6 py-4 font-mono", (gridData?.total_profit_usd || 0) > 0 ? "text-[var(--green)]" : "text-[var(--text-secondary)]")}>
                     {(gridData?.total_profit_usd || 0) > 0 ? "+" : ""}{formatUsd(gridData?.total_profit_usd || 0)}
                   </td>
                   <td className="px-6 py-4">
                     {statusUI}
                   </td>
                 </tr>
               );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
