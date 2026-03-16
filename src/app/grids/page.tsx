"use client";

import { Suspense } from "react";
import { useBotStatus } from "@/lib/hooks";
import { PageHeader } from "@/components/layout/PageHeader";
import { TokenTabs } from "@/components/TokenTabs";

export default function GridsPage() {
  const { status } = useBotStatus();

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Grid Trading Console" 
        description="Detailed visualization, order management, and grid controls"
        lastUpdate={status?.timestamp}
      />
      
      {/* V2 redesign moved TokenTabs to its own page instead of on the Index */}
      <Suspense fallback={<div className="h-64 animate-pulse bg-[var(--bg-card)] rounded-xl mt-6"></div>}>
        <TokenTabs />
      </Suspense>
    </div>
  );
}
