"use client";

import { useBotStatus, useAllGrids, usePriceHistory } from "@/lib/hooks";
import { formatUsd, formatPrice } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Grid2X2, AlertTriangle, Activity } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

function TokenSparkline({ token, isUp }: { token: string, isUp: boolean }) {
  const { history, isLoading } = usePriceHistory(token, 24);
  const color = isUp ? "var(--green)" : "var(--red)";
  
  if (isLoading) {
     return <div className="w-full h-full flex items-center justify-center opacity-30"><Activity className="size-3 animate-spin text-[var(--text-muted)]" /></div>;
  }
  
  if (!history || history.length === 0) {
     return <div className="w-full h-full bg-gradient-to-r from-transparent via-[var(--bg-card)] to-transparent opacity-20" />;
  }

  return (
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
          dataKey="price" 
          stroke={color} 
          fill={`url(#spark-${token})`} 
          strokeWidth={1.5}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TokenCards() {
  const { status, isLoading } = useBotStatus();
  
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

  const getMock24h = (token: string) => {
    if (token === "XPR") return { val: -2.47, up: false };
    if (token === "METAL") return { val: -3.34, up: false };
    if (token === "LOAN") return { val: 5.12, up: true };
    return { val: 0.0, up: true };
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
      {Object.entries(status.grid_tokens).map(([token, data]) => {
         const mockChange = getMock24h(token);
         const gridData = grids.find(g => g?.token === token);
         
         const isOOR = data.grid_status === "oor";
         const isActive = data.grid_status === "active";
         
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
            : "Loading range...";

         return (
           <Link href={`/grids?token=${token}`} key={token} className="block group">
             <Card className="h-full bg-[var(--bg-card)] border-[var(--border)] transition-all hover:border-[var(--border-active)] hover:bg-[var(--bg-card-hover)] relative overflow-hidden">
               {/* Decorative active indicator */}
               {data.active && !isOOR && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--blue)] to-[var(--green)] opacity-70"></div>
               )}
               {isOOR && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--orange)] to-[var(--red)] opacity-90"></div>
               )}
               
               <CardContent className="p-5 flex flex-col justify-between h-full">
                 <div className="flex justify-between items-start mb-4">
                   <div className="min-w-0 pr-2">
                     <h3 className="font-bold text-lg tracking-tight flex items-center gap-2 truncate">
                       {token}
                       {!data.active ? (
                         <span className="shrink-0 text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Paused</span>
                       ) : isOOR ? (
                         <span className="shrink-0 text-[10px] bg-[var(--orange)]/20 text-[var(--orange)] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider flex items-center gap-1">
                           <AlertTriangle className="size-3" /> OOR
                         </span>
                       ) : null}
                     </h3>
                     <div className="font-mono text-xl mt-1 text-[var(--text-primary)] truncate">
                       {formatPrice(data.current_price, token)}
                     </div>
                     <div className="text-xs font-mono text-[var(--text-secondary)] mt-0.5 truncate">
                       {rangeString}
                     </div>
                   </div>
                   
                   <div className={cn(
                     "shrink-0 flex items-center gap-1 text-sm font-medium px-2 py-1 rounded",
                     mockChange.up ? "text-[var(--green)] bg-[var(--green)]/10" : "text-[var(--red)] bg-[var(--red)]/10"
                   )}>
                     {mockChange.up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                     {mockChange.up && "+"}{mockChange.val}%
                   </div>
                 </div>

                 {/* Real React Recharts Sparkline replacing CSS visual mockup */}
                 <div className="h-10 w-full flex items-end my-2">
                    <TokenSparkline token={token} isUp={mockChange.up} />
                 </div>

                 <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-[var(--border)]/50">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                        <Grid2X2 className="size-3.5" />
                        <span>{data.bullets_buy + data.bullets_sell} bullets</span>
                      </div>
                      <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                         {isOOR ? (
                            <><span className="size-1.5 rounded-full bg-[var(--orange)] animate-pulse" /> Out of Range</>
                         ) : data.active ? (
                            <><span className="size-1.5 rounded-full bg-[var(--green)]" /> Active</>
                         ) : (
                            <><span className="size-1.5 rounded-full bg-[var(--text-muted)]" /> Idle</>
                         )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs sm:text-sm font-mono mt-1">
                      <span className={data.today_profit > 0 ? "text-[var(--green)]" : "text-[var(--text-secondary)]"}>
                        Today: {data.today_profit > 0 ? `+${formatUsd(data.today_profit)}` : "$0.00"}
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
      })}
    </div>
  );
}
