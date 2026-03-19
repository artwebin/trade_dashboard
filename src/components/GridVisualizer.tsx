import { GridStatus } from "@/lib/api";
import { formatPrice, formatUsd, cn } from "@/lib/utils";

interface GridVisualizerProps {
  grid: GridStatus | undefined;
}

export function GridVisualizer({ grid }: GridVisualizerProps) {
  if (!grid) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-border/40 bg-card p-8">
        <p className="text-muted-foreground">No active grid data found for this token.</p>
      </div>
    );
  }

  const { current_price, orders, token } = grid;

  // ── Sell side: limit_sell_open (active sell on DEX) + waiting_sell (pending placement) ──
  const sellOrders = orders
    .filter((o) => o.status === "limit_sell_open" || o.status === "waiting_sell")
    .sort((a, b) => b.sell_price - a.sell_price);

  // ── Buy side: limit_buy_open (active buy on DEX) + waiting_buy (pending placement) ──
  const buyOrders = orders
    .filter((o) => o.status === "limit_buy_open" || o.status === "waiting_buy")
    .sort((a, b) => b.buy_price - a.buy_price);

  const bulletSize = orders[0]?.bullet_size_usd || 100;

  // Exposure = bullets that have been bought (waiting_sell + limit_sell_open)
  const exposure = orders.filter(
    (o) => o.status === "waiting_sell" || o.status === "limit_sell_open"
  ).length * bulletSize;

  return (
    <div className="flex flex-col rounded-lg border border-border/40 bg-card p-6 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-lg tracking-tight">Grid Visualizer</h3>
        <div className="text-sm font-medium text-muted-foreground">
          Exposure: {formatUsd(exposure)}
        </div>
      </div>

      <div className="relative flex flex-col items-center space-y-1 font-mono text-sm">

        {/* ── Sell Zones ── */}
        {sellOrders.map((order, i) => {
          const isLimitOpen = order.status === "limit_sell_open";
          const isPlacementPending = order.status === "waiting_sell" && !order.dex_order_id;
          return (
            <div
              key={`sell-${order.id}`}
              className="group flex w-full max-w-lg items-center justify-between rounded px-4 py-1.5 transition-colors hover:bg-muted/50"
            >
              <div className="w-28 flex items-center gap-1.5">
                <span className={cn(
                  "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                  isLimitOpen
                    ? "bg-orange-500/15 text-orange-400"
                    : "bg-orange-500/8 text-orange-400/60"
                )}>
                  {isLimitOpen ? "Sell #" + (sellOrders.length - i) : "Pending"}
                </span>
              </div>
              <div className="flex-1 px-4">
                <div className="h-1.5 w-full rounded-full bg-accent/20">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      isLimitOpen ? "bg-accent" : "bg-accent/30"
                    )}
                    style={{ width: isLimitOpen ? "100%" : "40%" }}
                  />
                </div>
              </div>
              <span className={cn(
                "font-semibold w-24 text-right",
                isLimitOpen ? "text-accent" : "text-accent/50"
              )}>
                {formatPrice(order.sell_price, token)}
              </span>
            </div>
          );
        })}

        {sellOrders.length === 0 && (
          <div className="py-2 text-muted-foreground/50 italic">No active sell targets</div>
        )}

        {/* ── Current Price Separator ── */}
        <div className="my-4 flex w-full max-w-lg items-center justify-center relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dashed border-primary/50" />
          </div>
          <div className="relative bg-card px-4 py-1.5 text-primary border border-primary/20 rounded-md font-bold tracking-wider shadow-sm flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            {formatPrice(current_price, token)}
          </div>
        </div>

        {/* ── Buy Zones ── */}
        {buyOrders.map((order, i) => {
          const isLimitOpen = order.status === "limit_buy_open";
          const isPlacementFailed = order.status === "waiting_buy" && !order.dex_order_id;
          return (
            <div
              key={`buy-${order.id}`}
              className="group flex w-full max-w-lg items-center justify-between rounded px-4 py-1.5 transition-colors hover:bg-muted/50"
            >
              <div className="w-28 flex items-center gap-1.5">
                <span className={cn(
                  "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                  isLimitOpen
                    ? "bg-primary/15 text-primary"
                    : isPlacementFailed
                      ? "bg-red-500/15 text-red-400"
                      : "bg-primary/8 text-primary/60"
                )}>
                  {isLimitOpen
                    ? "Buy #" + (i + 1)
                    : isPlacementFailed
                      ? "Retry"
                      : "Pending"}
                </span>
              </div>
              <div className="flex-1 px-4">
                <div className="h-1.5 w-full rounded-full bg-primary/20">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      isLimitOpen ? "bg-primary opacity-60" : isPlacementFailed ? "bg-red-500/40" : "bg-primary/25"
                    )}
                    style={{ width: isLimitOpen ? "100%" : isPlacementFailed ? "20%" : "40%" }}
                  />
                </div>
              </div>
              <span className={cn(
                "font-semibold w-24 text-right",
                isLimitOpen
                  ? "text-primary"
                  : isPlacementFailed
                    ? "text-red-400/70"
                    : "text-primary/50"
              )}>
                {formatPrice(order.buy_price, token)}
              </span>
            </div>
          );
        })}

        {buyOrders.length === 0 && (
          <div className="py-2 text-muted-foreground/50 italic">No pending buy orders</div>
        )}
      </div>

      <div className="mt-8 pt-4 border-t border-border/40 grid grid-cols-4 gap-4 text-center">
        <div>
          <p className="text-xs text-muted-foreground">Buy Bullets</p>
          <p className="font-semibold text-primary">{grid.bullets_waiting_buy}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Sell Bullets</p>
          <p className="font-semibold text-accent">{grid.bullets_waiting_sell}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Today&apos;s Token P&L</p>
          <p className="font-semibold text-foreground">{formatUsd(grid.today_profit_usd)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total P&L</p>
          <p className="font-semibold text-foreground">{formatUsd(grid.total_profit_usd)}</p>
        </div>
      </div>
    </div>
  );
}
