"use client";

import { useBotStatus } from "@/lib/hooks";
import { PageHeader } from "@/components/layout/PageHeader";
import { HeroSection } from "@/components/dashboard/HeroSection";
import { TokenCards } from "@/components/dashboard/TokenCards";
import { ProfitChart } from "@/components/dashboard/ProfitChart";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { GridHealthTable } from "@/components/dashboard/GridHealthTable";

export default function Dashboard() {
  const { status } = useBotStatus();

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-8 mt-4">
      
      {/* 1. V3 Hero Section Banner */}
      <HeroSection />

      {/* 2. Token Cards with OOR logic */}
      <div>
        <TokenCards />
      </div>

      {/* 3. Portfolio Curve & Trade Feed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Main Chart Area (Spans 2 cols) */}
         <ProfitChart />
         
         {/* Live logs reading from backend (Spans 1 col) */}
         <ActivityFeed />
      </div>

      {/* 4. Grid Health Table Overview */}
      <div className="mt-4">
         <GridHealthTable />
      </div>
    </div>
  );
}
