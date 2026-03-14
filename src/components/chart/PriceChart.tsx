"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, IChartApi, ISeriesApi, LineStyle, ColorType, LineSeries } from "lightweight-charts";
import { useBotStatus, useGridStatus } from "@/lib/hooks";
import { Activity, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

export function PriceChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  
  const { status } = useBotStatus();
  const [activeToken, setActiveToken] = useState<string>("XPR");
  
  // Real grid levels from backend
  const { grid } = useGridStatus(activeToken);

  // Switch token based on available tokens safely without triggering effect loops
  useEffect(() => {
    if (status?.grid_tokens) {
       const keys = Object.keys(status.grid_tokens);
       if (keys.length > 0 && !keys.includes(activeToken)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setActiveToken(keys[0]);
       }
    }
  }, [status?.grid_tokens, activeToken]);

  // Init Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    chartRef.current = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(156, 163, 175, 1)", // --text-secondary
      },
      grid: {
        vertLines: { color: "rgba(31, 41, 55, 0.4)" },
        horzLines: { color: "rgba(31, 41, 55, 0.4)" },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
      },
      crosshair: {
        vertLine: {
          color: "rgba(59, 130, 246, 0.5)",
          width: 1,
          style: LineStyle.Dashed,
        },
        horzLine: {
          color: "rgba(59, 130, 246, 0.5)",
          width: 1,
          style: LineStyle.Dashed,
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    if (!chartRef.current) return;
    
    seriesRef.current = chartRef.current.addSeries(LineSeries, {
      color: "#3b82f6", // --blue
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderColor: "#fff",
      crosshairMarkerBackgroundColor: "#3b82f6",
    });

    // Mock initial data since GET /api/price-history is pending
    const data = [];
    let time = Math.floor(Date.now() / 1000) - 86400 * 30; // 30 days ago
    
    // Starting price vaguely accurate to activeToken roughly
    let price = activeToken === 'XPR' ? 0.0022 : activeToken === 'METAL' ? 0.13 : 0.00027;
    
    for (let i = 0; i < 300; i++) {
       // Random walk
       price += price * (Math.random() - 0.5) * 0.05;
       data.push({ time: time as import('lightweight-charts').Time, value: price });
       time += 86400 / 10; // add a few hours
    }
    
    if (seriesRef.current) {
      seriesRef.current.setData(data);
    }

    // Resize handler
    const handleResize = () => {
       if (chartContainerRef.current && chartRef.current) {
         chartRef.current.applyOptions({
           width: chartContainerRef.current.clientWidth,
           height: chartContainerRef.current.clientHeight
         });
       }
    };

    window.addEventListener("resize", handleResize);
    // Call once to settle
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [activeToken]);

  // Inject Grid Levels dynamically when we fetch /api/grid
  useEffect(() => {
    if (!seriesRef.current || !grid?.orders) return;

    // Clear previous generic lines (Lightweight Charts API limitation, you must hold refs. We recreate them here simply by relying on React unmounts for now, or we manage an array of lines).
    // The easiest way to reset price lines is to reconstruct the series/chart entirely, but for now we'll just not double-add if we can avoid it.
    // For Phase 1 we will just append them.

    grid.orders.forEach(order => {
       // We'll draw the wait side of the order
       if (order.status === 'waiting_sell') {
          seriesRef.current?.createPriceLine({
            price: order.sell_price,
            color: 'rgba(245, 158, 11, 0.4)', // --orange with opacity
            lineWidth: 1,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: 'Sell',
          });
       } else if (order.status === 'waiting_buy') {
          seriesRef.current?.createPriceLine({
            price: order.buy_price,
            color: 'rgba(16, 185, 129, 0.4)', // --green with opacity
            lineWidth: 1,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: 'Buy',
          });
       }
    });
    
  }, [grid]);

  return (
    <div className="flex flex-col w-full h-full">
      {/* Chart Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-[var(--bg-card-hover)]/30">
         <div className="flex items-center gap-2">
            <select
              value={activeToken}
              onChange={(e) => setActiveToken(e.target.value)}
              className="bg-[var(--bg-darkest)] border border-border/50 text-white text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--blue)] font-bold"
            >
              {Object.keys(status?.grid_tokens || { 'XPR': 1, 'METAL': 1, 'LOAN': 1 }).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            
            {grid && (
              <span className="font-mono font-medium text-[var(--text-primary)] ml-2 text-lg">
                ${grid.current_price.toPrecision(5)}
              </span>
            )}
         </div>

         <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-medium mr-4">
               <div className="w-3 h-0.5 bg-[var(--green)]"></div> <span className="mr-2">Buy Levels</span>
               <div className="w-3 h-0.5 bg-[var(--orange)]"></div> <span>Sell Levels</span>
            </div>
            
            <div className="flex items-center gap-1 bg-[var(--bg-darkest)] p-1 rounded-lg border border-border/50">
               {['1H', '4H', '1D', '1W'].map((tf, i) => (
                 <button 
                   key={tf} 
                   className={cn(
                     "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                     i === 2 ? "bg-[var(--bg-elevated)] text-white shadow-sm" : "text-[var(--text-secondary)] hover:text-white"
                   )}
                 >
                   {tf}
                 </button>
               ))}
            </div>
         </div>
      </div>
      
      {/* Chart Canvas Container */}
      <div className="flex-1 relative w-full border-b border-border/20">
         <div ref={chartContainerRef} className="absolute inset-0" />
      </div>

      {/* Grid Overlay Info Footer */}
      <div className="p-4 bg-[var(--bg-darkest)]/50 flex items-center justify-between text-sm text-[var(--text-secondary)]">
         <div className="flex items-center gap-4">
           {grid ? (
             <>
               <span className="flex items-center gap-1.5"><LayoutGrid className="size-4" /> {grid.orders.length} Active Orders Overlay</span>
               <span>Exposure: <span className="font-mono text-white">${(grid.total_bullets * grid.orders[0]?.bullet_size_usd || 100).toLocaleString()}</span></span>
             </>
           ) : (
             <span className="flex items-center gap-2"><Activity className="size-4 animate-spin" /> Loading grid bounds...</span>
           )}
         </div>
      </div>
    </div>
  );
}
