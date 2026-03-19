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
  const { trades, isLoading: tradesLoading } = useRecentTrades(50);
  const activeTokens = status ? Object.keys(status.grid_tokens) : [];
  const { grids, isLoading: gridsLoading } = useAllGrids(activeTokens);
  const [uptime, setUptime] = useState<string>("0h 0m");

  useEffect(() => {
    if (!status?.bot_started_at) return;
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      let diff = now - status.bot_started_at;
      if (diff < 0) diff = 0;
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      setUptime(`${hours}h ${minutes}m`);
    }, 1000);
    return () => clearInterval(interval);
  }, [status?.bot_started_at]);

  if (statusLoading || statsLoading || gridsLoading || tradesLoading) {
    return (
      <Card className="bg-[var(--bg-elevated)] border-border/40 h-[200px] animate-pulse">
        <CardContent className="h-full flex items-center justify-center text-muted-foreground">
          Initializing...
        </CardContent>
      </Card>
    );
  }

  if (!status || !stats) return null;

  let activeExposure = 0;
  grids.forEach(g => {
    if (g?.orders && g.orders.length > 0) {
      const bulletSize = g.orders[0]?.bullet_size_usd || 0;
      // Exposure = bullets that have been bought (waiting_sell + limit_sell_open)
      const sellBulletsCount = g.orders.filter(
        (o) => o.status === "limit_sell_open" || o.status === "waiting_sell"
      ).length;
      activeExposure += sellBulletsCount * bulletSize;
    }
  });

  const profitCurve = trades
    .sort((a, b) => a.timestamp - b.timestamp)
    .reduce((acc, trade) => {
      const prev = acc.length > 0 ? acc[acc.length - 1].profit : 0;
      const actualProfit = (trade.actual_xmd_received !== undefined && trade.actual_xmd_received !== null &&
                            trade.actual_xmd_spent !== undefined && trade.actual_xmd_spent !== null)
        ? (trade.actual_xmd_received - trade.actual_xmd_spent)
        : trade.profit_usd;
      acc.push({ time: trade.timestamp, profit: prev + actualProfit });
      return acc;
    }, [] as { time: number; profit: number }[]);

  const isPositive = stats.total_profit_usd >= 0;

  const totalRoi = status.max_exposure_usd > 0 ? (stats.total_profit_usd / status.max_exposure_usd * 100) : 0;
  const todayRoi = status.max_exposure_usd > 0 ? (stats.today_profit_usd / status.max_exposure_usd * 100) : 0;
  const exposurePct = status.max_exposure_usd > 0 ? (activeExposure / status.max_exposure_usd * 100) : 0;

  return (
    <Card className="bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-darkest)] border border-[var(--border)]/50 relative overflow-hidden shadow-sm">
      <CardContent className="p-6 relative z-10 flex flex-col gap-6 h-full justify-between">
        
        {/* Row 1: Command & Status */}
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-[var(--text-secondary)] tracking-widest uppercase">
            Bot Overview
          </h2>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-start gap-1.5">
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest leading-none">
                Mode
              </span>
              <Badge variant="outline" className={cn(
                "font-bold tracking-wider px-2 py-0.5 border border-white/20",
                status.mode === "live" ? "text-[var(--red)] border-[var(--red)]/50 bg-[var(--red)]/10" : "text-[var(--blue)] border-[var(--blue)]/50 bg-[var(--blue)]/10"
              )}>
                {status.mode.toUpperCase()}
              </Badge>
            </div>

            <div className="flex flex-col items-start gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest leading-none flex gap-1">
                <span className="text-[var(--text-secondary)]">Status:</span>
                <span className={(!status.grid_paused && status.bot_started_at > 0) ? "text-[var(--green)]" : "text-[var(--text-muted)] border-b border-[var(--text-muted)] border-dashed px-0.5"}>
                  {(!status.grid_paused && status.bot_started_at > 0) ? "ON" : "OFF"}
                </span>
              </span>
              <div 
                className={cn(
                  "w-10 h-5 rounded-full relative flex items-center p-0.5 border shadow-sm transition-colors",
                  (!status.grid_paused && status.bot_started_at > 0) ? "bg-[var(--green)]/20 border-[var(--green)]/50 cursor-default" : "bg-[var(--bg-elevated)] border-[var(--border)] cursor-default"
                )}
              >
                 <div 
                   className={cn(
                     "w-4 h-4 rounded-full absolute shadow-sm transition-all",
                     (!status.grid_paused && status.bot_started_at > 0) ? "bg-[var(--green)] right-0.5" : "bg-[var(--text-muted)] left-0.5"
                   )} 
                 />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Finance Visual Focus */}
        <div className="grid grid-cols-2 gap-6 items-start mt-2">
          {/* TOTAL */}
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">Total Profit</h3>
            <div className="flex items-baseline gap-3 flex-wrap">
              <div
                className={cn(
                  "text-4xl sm:text-5xl lg:text-6xl font-bold font-mono tracking-tighter",
                  isPositive ? "text-[var(--green)]" : "text-[var(--red)]"
                )}
                style={isPositive ? { textShadow: "0 0 30px rgba(0, 214, 143, 0.2)" } : undefined}
              >
                {isPositive && "+"}{formatUsd(stats.total_profit_usd)}
              </div>
              <div className={cn(
                "text-sm font-bold px-2 py-0.5 rounded-full",
                totalRoi >= 0 ? "bg-[var(--green)]/15 text-[var(--green)]" : "bg-[var(--red)]/15 text-[var(--red)]"
              )}>
                {totalRoi >= 0 && "+"}{totalRoi.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* TODAY */}
          <div className="flex flex-col gap-1 pl-4 border-l border-[var(--border)]/50">
            <h3 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">Today's P&L</h3>
            <div className="flex items-baseline gap-3 flex-wrap mt-1">
              <div className={cn(
                "text-2xl sm:text-3xl font-bold font-mono tracking-tight",
                stats.today_profit_usd > 0 ? "text-[var(--green)]" :
                stats.today_profit_usd < 0 ? "text-[var(--red)]" : "text-white"
              )}>
                {stats.today_profit_usd > 0 && "+"}{formatUsd(stats.today_profit_usd)}
              </div>
              <div className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-full hidden sm:block",
                todayRoi >= 0 ? "bg-[var(--green)]/15 text-[var(--green)]" : "bg-[var(--red)]/15 text-[var(--red)]"
              )}>
                {todayRoi >= 0 && "+"}{todayRoi.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Operations & Risk (Mini-cards) */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[var(--border)]/50">
           {/* Block 1: Exposure */}
           <div className="bg-[var(--bg-darkest)]/40 rounded-lg p-3 border border-[var(--border)]/30 flex flex-col justify-center gap-2">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider">
                 <span>Exposure</span>
                 <span className="text-white font-mono">{exposurePct.toFixed(0)}%</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-gradient-to-r from-[var(--blue)] to-[var(--green)] rounded-full transition-all duration-500" 
                   style={{ width: `${Math.min(100, Math.max(0, exposurePct))}%` }} 
                 />
              </div>
           </div>

           {/* Block 2: Activity */}
           <div className="bg-[var(--bg-darkest)]/40 rounded-lg p-3 border border-[var(--border)]/30 flex flex-col justify-center">
              <span className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider mb-1">Trades (24h)</span>
              <span className="text-lg font-bold font-mono text-white">{stats.today_trades}</span>
           </div>

           {/* Block 3: System */}
           <div className="bg-[var(--bg-darkest)]/40 rounded-lg p-3 border border-[var(--border)]/30 flex flex-col justify-center">
              <span className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider mb-1">Uptime</span>
              <span className="text-lg font-bold font-mono text-white">{uptime}</span>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
