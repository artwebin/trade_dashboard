"use client";

import { useDailyStats } from "@/lib/hooks";
import { formatUsd } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, WalletCards, ActivitySquare } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProfitCards() {
  const { stats, isLoading } = useDailyStats();

  const SkeletonCards = () => (
    <>
      {[1, 2, 3].map((i) => (
        <Card key={i} className="animate-pulse bg-muted/50 border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 rounded bg-muted"></div>
            <div className="size-4 rounded-full bg-muted"></div>
          </CardHeader>
          <CardContent>
            <div className="h-8 w-32 rounded bg-muted mb-1"></div>
            <div className="h-3 w-16 rounded bg-muted"></div>
          </CardContent>
        </Card>
      ))}
    </>
  );

  if (isLoading || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <SkeletonCards />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Today's P&L</CardTitle>
          <DollarSign className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={cn(
            "text-2xl font-bold font-mono tracking-tight",
            stats.today_profit_usd > 0 ? "text-primary text-green-500" : 
            stats.today_profit_usd < 0 ? "text-destructive" : ""
          )}>
            {stats.today_profit_usd > 0 && "+"}
            {formatUsd(stats.today_profit_usd)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Realized profit today
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total P&L</CardTitle>
          <WalletCards className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={cn(
            "text-2xl font-bold font-mono tracking-tight",
            stats.total_profit_usd > 0 ? "text-primary text-green-500" : 
            stats.total_profit_usd < 0 ? "text-destructive" : ""
          )}>
            {stats.total_profit_usd > 0 && "+"}
            {formatUsd(stats.total_profit_usd)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Lifetime realized profit
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Trades Today</CardTitle>
          <ActivitySquare className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono tracking-tight">
            {stats.today_trades}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Total completed roundtrips
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
