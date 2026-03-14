"use client";

import { useBotStatus } from "@/lib/hooks";
import { PageHeader } from "@/components/layout/PageHeader";
import { PriceChart } from "@/components/chart/PriceChart";

export default function ChartPage() {
  const { status } = useBotStatus();

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 w-full h-[calc(100vh-8rem)]">
      <PageHeader 
        title="Live Market Charts" 
        description="Interactive price history and grid overlay visualization"
        lastUpdate={status?.timestamp}
      />
      
      <div className="flex-1 w-full border border-border/40 rounded-xl overflow-hidden bg-[var(--bg-card)]">
         <PriceChart />
      </div>
    </div>
  );
}
