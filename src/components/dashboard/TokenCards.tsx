"use client";

import { useBotStatus, useAllGrids, usePriceHistory, useMarketData } from "@/lib/hooks";
import { formatUsd, formatPrice } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Grid2X2, AlertTriangle, Activity } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

function TokenCardItem({ token, status, gridData, isEnabled, tokenMarket }: { token: string, status: any, gridData: any, isEnabled: boolean, tokenMarket: any }) {
  const data = status.grid_tokens[token];
  const { history, isLoading } = usePriceHistory(token, 24);
  
  // Real 24h change from xprdata API
  const changePercent = tokenMarket?.change_24h || 0;
  const isUp = changePercent >= 0;

  const isOOR = data?.grid_status === "oor";
  const isActive = isEnabled && data?.active;

  // Recalculate bullets from orders to include limit orders as requested
  let buyBulletsCount = data?.bullets_buy || 0;
  let sellBulletsCount = data?.bullets_sell || 0;

  if (gridData?.orders) {
    buyBulletsCount = gridData.orders.filter(
      (o: any) => o.status === "limit_buy_open" || o.status === "waiting_buy"
    ).length;
    sellBulletsCount = gridData.orders.filter(
      (o: any) => o.status === "limit_sell_open" || o.status === "waiting_sell"
    ).length;
  }
  
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
     : isEnabled ? "Loading range..." : "Grid Disabled";

  const color = isUp ? "var(--green)" : "var(--red)";

  return (
    <Link href={`/grids?token=${token}`} key={token} className={cn("block group", !isEnabled && "opacity-75 grayscale")}>
      <Card className="h-full bg-[var(--bg-card)] border-[var(--border)] transition-all hover:border-[var(--border-active)] hover:bg-[var(--bg-card-hover)] relative overflow-hidden">
        {/* Decorative active indicator */}
        {isActive && !isOOR && (
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--blue)] to-[var(--green)] opacity-70"></div>
        )}
        {isOOR && (
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--orange)] to-[var(--red)] opacity-90"></div>
        )}
        
        <CardContent className="p-5 flex flex-col justify-between h-full">
          <div className="flex justify-between items-start mb-4">
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-[var(--text-secondary)] tracking-wider">
                  {token}
                </span>
                {!isEnabled ? (
                  <span className="shrink-0 text-[10px] bg-[var(--bg-darkest)] border border-[var(--border)] text-[var(--text-muted)] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Inactive</span>
                ) : !data.active ? (
                  <span className="shrink-0 text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Paused</span>
                ) : isOOR ? (
                  <span className="shrink-0 text-[10px] bg-[var(--orange)]/20 text-[var(--orange)] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider flex items-center gap-1">
                    <AlertTriangle className="size-3" /> OOR
                  </span>
                ) : null}
              </div>
              <h3 className="font-bold text-3xl tracking-tight font-mono text-white truncate">
                {data?.current_price ? formatPrice(data.current_price, token) : "$---"}
              </h3>
              <div className="text-xs font-mono text-[var(--text-secondary)] mt-1 truncate">
                {rangeString}
              </div>
            </div>
            
            <div className={cn(
              "shrink-0 flex items-center gap-1 text-sm font-medium px-2 py-1 rounded transition-opacity",
              isLoading ? "opacity-0" : "opacity-100",
              isUp ? "text-[var(--green)] bg-[var(--green)]/10" : "text-[var(--red)] bg-[var(--red)]/10"
            )}>
              {isUp ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {isUp && "+"}{changePercent.toFixed(2)}%
            </div>
          </div>

          <div className="h-10 w-full flex items-end my-2">
             {isLoading ? (
                <div className="w-full h-full flex items-center justify-center opacity-30"><Activity className="size-3 animate-spin text-[var(--text-muted)]" /></div>
             ) : (!history || history.length === 0) ? (
                <div className="w-full h-full bg-gradient-to-r from-transparent via-[var(--bg-card)] to-transparent opacity-20" />
             ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id={`spark-${token}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={color} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke={color} 
                      fill={`url(#spark-${token})`} 
                      strokeWidth={1.5}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
             )}
          </div>

          <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-[var(--border)]/50">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                <Grid2X2 className="size-3.5" />
                <span>{isEnabled ? (buyBulletsCount + sellBulletsCount) : 0} bullets</span>
              </div>
              <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                 {!isEnabled ? (
                    <><span className="size-1.5 rounded-full bg-[var(--border)]" /> Inactive</>
                 ) : isOOR ? (
                    <><span className="size-1.5 rounded-full bg-[var(--orange)] animate-pulse" /> Out of Range</>
                 ) : data.active ? (
                    <><span className="size-1.5 rounded-full bg-[var(--green)]" /> Active</>
                 ) : (
                    <><span className="size-1.5 rounded-full bg-[var(--text-muted)]" /> Idle</>
                 )}
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs sm:text-sm font-mono mt-1">
              <span className={isEnabled && data.today_profit > 0 ? "text-[var(--green)]" : "text-[var(--text-secondary)]"}>
                Today: {isEnabled && data.today_profit > 0 ? `+${formatUsd(data.today_profit)}` : "$0.00"}
              </span>
              <span className={(gridData?.total_profit_usd || 0) > 0 ? "text-[var(--green)]" : "text-[var(--text-secondary)]"}>
                Total: {(gridData?.total_profit_usd || 0) > 0 ? `+${formatUsd(gridData!.total_profit_usd)}` : "$0.00"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
export function TokenCards() {
  const { status, isLoading } = useBotStatus();
  const { market } = useMarketData();
  
  const activeTokens = status ? Object.keys(status.grid_tokens) : [];
  const { grids } = useAllGrids(activeTokens);

  if (isLoading || !status) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse bg-[var(--bg-card)] border-border/40 min-h-[120px]" />
        ))}
      </div>
    );
  }

  const DISPLAY_TOKENS = ["XPR", "METAL", "LOAN"];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
      {DISPLAY_TOKENS.map((token) => {
         const data = status.grid_tokens[token];
         const isEnabled = !!data;
         const gridData = grids.find(g => g?.token === token);
         return (
           <TokenCardItem 
             key={token} 
             token={token} 
             status={status} 
             gridData={gridData} 
             isEnabled={isEnabled} 
             tokenMarket={market[token]}
           />
         );
      })}
    </div>
  );
}
