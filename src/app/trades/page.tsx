"use client";

import { useBotStatus } from "@/lib/hooks";
import { PageHeader } from "@/components/layout/PageHeader";
import { RecentTradesTable } from "@/components/RecentTradesTable";

export default function TradesPage() {
  const { status } = useBotStatus();

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 w-full h-full">
      <PageHeader 
        title="Trade History" 
        description="Comprehensive logs of executed roundtrip grid transactions."
        lastUpdate={status?.timestamp}
      />
      
      {/* 
        Moved RecentTradesTable out of Dashboard overview. 
        It now occupies this dedicated full screen. 
      */}
      <div className="w-full">
        <RecentTradesTable />
      </div>
    </div>
  );
}
