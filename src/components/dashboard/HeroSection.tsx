"use client";

import { useBotStatus, useDailyStats, useAllGrids, useRecentTrades } from "@/lib/hooks";
import { formatUsd } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  const { status, isLoading: statusLoading } = useBotStatus();
  const { stats, isLoading: statsLoading } = useDailyStats();
  
  // Trades for the mini trend line under Total Profit (we need to compute cumulative profit)
  const { trades, isLoading: tradesLoading } = useRecentTrades(50);
  
  const activeTokens = status ? Object.keys(status.grid_tokens) : [];
  const { grids, isLoading: gridsLoading } = useAllGrids(activeTokens);

  const [uptime, setUptime] = useState<string>("0h 0m");

  useEffect(() => {
    if (!status?.started_at) return;
    
    const interval = setInterval(() => {
      // Backend timestamp in seconds
      const now = Math.floor(Date.now() / 1000);
      let diff = now - status.started_at;
      if (diff < 0) diff = 0;
      
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      setUptime(`${hours}h ${minutes}m`);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [status?.started_at]);

  if (statusLoading || statsLoading || gridsLoading) {
    return (
      <Card className="bg-[var(--bg-elevated)] border-border/40 mb-6 h-[200px] animate-pulse">
        <CardContent className="h-full flex items-center justify-center text-muted-foreground">
          Initializing Hero Section...
        </CardContent>
      </Card>
    );
  }

  if (!status || !stats) {
    return null;
  }

  // Calculate Exposure
  let activeExposure = 0;
  grids.forEach(g => {
    if (g?.orders && g.orders.length > 0) {
      activeExposure += g.total_bullets * (g.orders[0]?.bullet_size_usd || 0);
    }
  });

  // Calculate mini trend line data
  const profitCurve = trades
    .sort((a, b) => a.timestamp - b.timestamp)
    .reduce((acc, trade) => {
      const prev = acc.length > 0 ? acc[acc.length - 1].profit : 0;
      acc.push({
        time: trade.timestamp,
        profit: prev + trade.profit_usd,
      });
      return acc;
    }, [] as { time: number; profit: number }[]);

  const isPositive = stats.total_profit_usd >= 0;

  return (
    <Card className="bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-darkest)] border-border/40 relative overflow-hidden mb-6">
      <CardContent className="p-8 pb-6 flex flex-col justify-between h-full relative z-10">
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-8">
          
          {/* Main Total Profit Area */}
          <div className="flex-1">
            <h2 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2">Total Profit</h2>
            <div 
              className={cn(
                "text-5xl md:text-6xl font-bold font-mono tracking-tighter",
                isPositive ? "text-[var(--green)]" : "text-[var(--red)]"
              )}
              style={isPositive ? { textShadow: "0 0 30px rgba(0, 214, 143, 0.4)" } : undefined}
            >
              {isPositive && "+"}{formatUsd(stats.total_profit_usd)}
            </div>
            
            {/* Sparkline for Total Profit */}
            <div className="h-10 w-full max-w-[300px] mt-2 opacity-80">
               {profitCurve.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={profitCurve}>
                     <defs>
                       <linearGradient id="heroProfitGrad" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor={isPositive ? "var(--green)" : "var(--red)"} stopOpacity={0.8}/>
                         <stop offset="95%" stopColor={isPositive ? "var(--green)" : "var(--red)"} stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <Area 
                       type="monotone" 
                       dataKey="profit" 
                       stroke={isPositive ? "var(--green)" : "var(--red)"} 
                       fill="url(#heroProfitGrad)" 
                       strokeWidth={2}
                       isAnimationActive={false}
                     />
                   </AreaChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="w-full h-full bg-gradient-to-r from-transparent via-[var(--bg-card)] to-transparent opacity-20" />
               )}
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="flex gap-12 pt-2">
            <div>
              <h3 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">Today's P&L</h3>
              <div className={cn(
                "text-2xl font-bold font-mono mt-1",
                stats.today_profit_usd > 0 ? "text-[var(--green)]" : 
                stats.today_profit_usd < 0 ? "text-[var(--red)]" : "text-white"
              )}>
                {stats.today_profit_usd > 0 && "+"}{formatUsd(stats.today_profit_usd)}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">Trades</h3>
              <div className="text-2xl font-bold font-mono mt-1 text-white">
                {stats.today_trades}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">Bot Uptime</h3>
              <div className="text-2xl font-bold font-mono mt-1 text-white">
                {uptime}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="flex items-center gap-6 mt-8 pt-6 border-t border-[var(--border)]/50">
          <div className="text-sm text-[var(--text-secondary)]">
            Exposure: <span className="font-mono text-white ml-2">{formatUsd(activeExposure)} / {formatUsd(status.max_exposure_usd)}</span>
          </div>
          
          <div className="w-px h-4 bg-[var(--border)]" />
          
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            Mode: 
            <Badge variant="outline" className={cn(
              "ml-1 font-bold tracking-wider",
              status.mode === "live" ? "border-[var(--red)] text-[var(--red)] bg-[var(--red)]/10" : "border-[var(--blue)] text-[var(--blue)] bg-[var(--blue)]/10"
            )}>
              {status.mode.toUpperCase()}
            </Badge>
          </div>
          
          <div className="w-px h-4 bg-[var(--border)]" />

          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            Status: 
            <div className="flex items-center gap-1.5 ml-1">
              <div className="relative flex size-2">
                 <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--green)] opacity-75"></span>
                 <span className="relative inline-flex size-2 rounded-full bg-[var(--green)]"></span>
              </div>
              <span className="font-bold text-white">ON</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
