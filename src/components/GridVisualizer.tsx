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

  // Separate selling strings vs buying strings and sort them by price distance from current price
  const sellOrders = orders
    .filter((o) => o.status === "waiting_sell")
    .sort((a, b) => b.sell_price - a.sell_price); // Highest sell price at the top

  const buyOrders = orders
    .filter((o) => o.status === "waiting_buy")
    .sort((a, b) => b.buy_price - a.buy_price); // Highest buy price directly under current price

  return (
    <div className="flex flex-col rounded-lg border border-border/40 bg-card p-6 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-lg tracking-tight">Grid Visualizer</h3>
        <div className="text-sm font-medium text-muted-foreground">
          Exposure: {formatUsd((grid.total_bullets - grid.bullets_waiting_buy) * (orders[0]?.bullet_size_usd || 100))}
        </div>
      </div>

      <div className="relative flex flex-col items-center space-y-1 font-mono text-sm">
        
        {/* Sell Zones */}
        {sellOrders.map((order, i) => (
          <div key={`sell-${order.id}`} className="group flex w-full max-w-lg items-center justify-between rounded px-4 py-1.5 transition-colors hover:bg-muted/50">
            <span className="text-muted-foreground w-20">Sell #{sellOrders.length - i}</span>
            <div className="flex-1 px-4">
              <div className="h-1.5 w-full rounded-full bg-accent/20">
                <div className="h-full rounded-full bg-accent" style={{ width: '100%' }}></div>
              </div>
            </div>
            <span className="font-semibold text-accent w-24 text-right">
              {formatPrice(order.sell_price, token)}
            </span>
          </div>
        ))}

        {sellOrders.length === 0 && (
          <div className="py-2 text-muted-foreground/50 italic">No active sell targets</div>
        )}

        {/* Current Price Separator */}
        <div className="my-4 flex w-full max-w-lg items-center justify-center relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dashed border-primary/50"></div>
          </div>
          <div className="relative bg-card px-4 py-1.5 text-primary border border-primary/20 rounded-md font-bold tracking-wider shadow-sm flex items-center gap-2">
            <span className="relative flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            {formatPrice(current_price, token)}
          </div>
        </div>

        {/* Buy Zones */}
        {buyOrders.map((order, i) => (
           <div key={`buy-${order.id}`} className="group flex w-full max-w-lg items-center justify-between rounded px-4 py-1.5 transition-colors hover:bg-muted/50">
            <span className="text-muted-foreground w-20">Buy #{i + 1}</span>
            <div className="flex-1 px-4">
              <div className="h-1.5 w-full rounded-full bg-primary/20">
                <div className="h-full rounded-full bg-primary opacity-60" style={{ width: '100%' }}></div>
              </div>
            </div>
            <span className="font-semibold text-primary w-24 text-right">
              {formatPrice(order.buy_price, token)}
            </span>
          </div>
        ))}

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
          <p className="text-xs text-muted-foreground">Today's Token P&L</p>
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
