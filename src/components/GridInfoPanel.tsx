import { GridStatus } from "@/lib/api";
import { formatUsd } from "@/lib/utils";
import { Info, HelpCircle } from "lucide-react";

interface GridInfoPanelProps {
  grid: GridStatus | undefined;
}

export function GridInfoPanel({ grid }: GridInfoPanelProps) {
  if (!grid) return null;

  // Derive parameters from first order since the API brief implied consistent bullet sizing
  const bulletSize = grid.orders[0]?.bullet_size_usd || 100;
  
  // limit_buy_open + waiting_buy = buy bullets
  const buyBulletsCount = grid.orders.filter(
    (o) => o.status === "limit_buy_open" || o.status === "waiting_buy"
  ).length;

  // limit_sell_open + waiting_sell = sell bullets (exposure)
  const sellBulletsCount = grid.orders.filter(
    (o) => o.status === "limit_sell_open" || o.status === "waiting_sell"
  ).length;

  const exposure = sellBulletsCount * bulletSize;

  // Expose step percent as an explicit feature if it was provided, otherwise we mock or derive it.
  // The brief mentions `step_percent` in the START modal but not GET /api/grid. We will calculate an approx if possible.
  const stepApprox = grid.orders.length > 1 
    ? Math.abs((grid.orders[0].sell_price - grid.orders[1].sell_price) / grid.orders[0].sell_price * 100).toFixed(2) + "%"
    : "1.5%"; // Default fallback matching brief

  return (
    <div className="w-full rounded-md border border-border/40 bg-card p-4 text-sm mt-4">
      <div className="flex flex-wrap items-center justify-between gap-4 w-full">
        
        <div className="flex items-center gap-2">
           <Info className="size-4 text-muted-foreground" />
           <span className="font-semibold text-foreground tracking-tight">Grid Info</span>
        </div>

        <div className="flex flex-wrap items-center gap-6 gap-y-2">
          
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              Active Bullets
            </span>
            <span className="font-mono">{buyBulletsCount} Buy / {sellBulletsCount} Sell</span>
          </div>

          <div className="flex flex-col">
             <span className="text-xs text-muted-foreground">Exposure</span>
             <span className="font-mono">{formatUsd(exposure)}</span>
          </div>

          <div className="flex flex-col">
             <span className="text-xs text-muted-foreground">Grid Step</span>
             <span className="font-mono">{stepApprox}</span>
          </div>

          <div className="flex flex-col">
             <span className="text-xs text-muted-foreground">Bullet Size</span>
             <span className="font-mono">{formatUsd(bulletSize)}</span>
          </div>
          
        </div>

        {grid.paused && (
          <div className="flex items-center gap-2 bg-accent/20 text-accent font-medium px-3 py-1.5 rounded text-xs border border-accent/20">
            <HelpCircle className="size-3" />
            Paused: {grid.pause_reason || "Manual Intervention"}
          </div>
        )}

      </div>
    </div>
  );
}
