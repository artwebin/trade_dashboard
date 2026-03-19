"use client";

import { useRecentTrades } from "@/lib/hooks";
import { formatPrice, formatUsd, timeAgo } from "@/lib/utils";
import { History } from "lucide-react";

export function RecentTradesTable() {
  const { trades, isLoading } = useRecentTrades(20);

  if (isLoading) {
    return (
      <div className="w-full rounded-md border border-border/40 bg-card p-6 min-h-[300px] flex items-center justify-center">
        <div className="flex animate-pulse items-center gap-2 text-muted-foreground">
          Loading recent trades...
        </div>
      </div>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <div className="w-full rounded-md border border-border/40 bg-card p-6 mt-8">
        <div className="flex items-center gap-2 mb-4">
          <History className="size-5" />
          <h3 className="font-semibold text-lg tracking-tight">Recent Trades</h3>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          No recent trades found.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-md border border-border/40 bg-card mt-8 overflow-hidden">
      <div className="flex items-center gap-2 p-6 pb-4 border-b border-border/40 bg-muted/20">
        <History className="size-5" />
        <h3 className="font-semibold text-lg tracking-tight">Recent Trades</h3>
      </div>
      
      <div className="w-full overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 text-left text-muted-foreground bg-muted/10">
              <th className="px-6 py-3 font-medium">Token</th>
              <th className="px-6 py-3 font-medium text-right">Buy Price</th>
              <th className="px-6 py-3 font-medium text-right">Sell Price</th>
              <th className="px-6 py-3 font-medium text-right">Profit</th>
              <th className="px-6 py-3 font-medium text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {trades.map((trade) => (
              <tr 
                key={trade.id} 
                className="transition-colors hover:bg-muted/50 group animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <td className="px-6 py-4">
                   <div className="flex items-center gap-2">
                     <span className="font-bold">{trade.token}</span>
                     {trade.mode === "paper" && (
                       <span className="text-[10px] uppercase tracking-wider bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                         Paper
                       </span>
                     )}
                   </div>
                </td>
                <td className="px-6 py-4 text-right font-mono text-muted-foreground">
                  {formatPrice(trade.buy_price, trade.token)}
                </td>
                <td className="px-6 py-4 text-right font-mono">
                  {formatPrice(trade.sell_price, trade.token)}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-semibold text-primary font-mono bg-primary/10 px-2 py-1 rounded">
                    {(() => {
                      const actualProfit = (trade.actual_xmd_received !== undefined && trade.actual_xmd_received !== null &&
                                            trade.actual_xmd_spent !== undefined && trade.actual_xmd_spent !== null)
                        ? (trade.actual_xmd_received - trade.actual_xmd_spent)
                        : trade.profit_usd;
                      return (actualProfit >= 0 ? "+" : "") + formatUsd(actualProfit);
                    })()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-muted-foreground/70">
                  {timeAgo(trade.timestamp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
