"use client";

import { useBotStatus } from "@/lib/hooks";
import { PageHeader } from "@/components/layout/PageHeader";
import { HeroSection } from "@/components/dashboard/HeroSection";
import { AccountProfileCard } from "@/components/dashboard/AccountProfileCard";
import { TokenCards } from "@/components/dashboard/TokenCards";
import { ProfitChart } from "@/components/dashboard/ProfitChart";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";

export default function Dashboard() {
  const { status } = useBotStatus();

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-8 mt-4">

      {/* 1. Top row: Stats hero (left) + Account profile card (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-stretch">
        <HeroSection />
        <AccountProfileCard />
      </div>

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

    </div>
  );
}
