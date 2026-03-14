"use client";

import { useRecentTrades } from "@/lib/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useState, useMemo } from "react";

export function ProfitChart() {
  const { trades, isLoading } = useRecentTrades(100);
  const [period, setPeriod] = useState<"1D" | "7D" | "1M" | "ALL">("1D");

  const profitCurve = useMemo(() => {
    if (!trades || trades.length === 0) return [];

    const now = Math.floor(Date.now() / 1000);
    let startTime = 0;

    if (period === "1D") startTime = now - 24 * 3600;
    else if (period === "7D") startTime = now - 7 * 24 * 3600;
    else if (period === "1M") startTime = now - 30 * 24 * 3600;

    // Filter trades by time
    const filteredTrades = trades.filter(t => t.timestamp >= startTime);
    
    // Sort ascending
    const sorted = [...filteredTrades].sort((a, b) => a.timestamp - b.timestamp);

    let runningTotal = 0;
    const curve = sorted.map(trade => {
      runningTotal += trade.profit_usd;
      
      const date = new Date(trade.timestamp * 1000);
      let timeFormat = "";
      
      if (period === "1D") {
         timeFormat = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
         timeFormat = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }

      return {
        timestamp: trade.timestamp,
        timeLabel: timeFormat,
        profit: Number(runningTotal.toFixed(2)),
      };
    });

    // Ensure we start at 0 if there are trades, drawing a line from the start
    if (curve.length > 0) {
      const firstDate = new Date(curve[0].timestamp * 1000);
      let timeFormat = period === "1D" 
        ? firstDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : firstDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
        
      curve.unshift({
         timestamp: curve[0].timestamp - 1, // Just before first trade
         timeLabel: timeFormat,
         profit: 0
      });
    }

    return curve;
  }, [trades, period]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--bg-darkest)] border border-[var(--border)] p-3 rounded-lg shadow-xl shrink-0 text-sm">
          <p className="text-[var(--text-secondary)] mb-1">{payload[0].payload.timeLabel}</p>
          <p className="font-mono font-bold text-[var(--green)]">
            +${payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-1 lg:col-span-2 bg-[var(--bg-card)] border-[var(--border)]/40 overflow-hidden relative min-h-[300px] flex flex-col">
       <CardContent className="p-0 flex-1 flex flex-col h-full">
          <div className="flex items-center justify-between p-6 pb-2 border-b border-[var(--border)]/30 shrink-0">
             <div className="flex items-center gap-2">
                <LineChart className="size-5 text-[var(--green)]" />
                <h3 className="font-bold text-lg tracking-tight text-[var(--text-primary)]">Portfolio Profit Curve</h3>
             </div>
             
             <div className="flex items-center gap-1 bg-[var(--bg-darkest)] p-1 rounded-lg border border-[var(--border)]/50">
                {(['1D', '7D', '1M', 'ALL'] as const).map((tf) => (
                  <button 
                    key={tf} 
                    onClick={() => setPeriod(tf)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${period === tf ? 'bg-[var(--bg-elevated)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-white'}`}
                  >
                    {tf}
                  </button>
                ))}
             </div>
          </div>
          
          <div className="flex-1 w-full bg-[var(--bg-card)]/50 p-6 pt-8 relative min-h-[0]">
             {isLoading ? (
               <div className="absolute inset-0 flex items-center justify-center opacity-50">
                  <Activity className="size-6 animate-spin text-[var(--text-muted)]" />
               </div>
             ) : profitCurve.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={profitCurve} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                   <defs>
                     <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="var(--green)" stopOpacity={0.4}/>
                       <stop offset="95%" stopColor="var(--green)" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <XAxis 
                     dataKey="timeLabel" 
                     stroke="var(--text-muted)" 
                     fontSize={11} 
                     tickLine={false}
                     axisLine={false}
                     minTickGap={30}
                   />
                   <YAxis 
                     stroke="var(--text-muted)" 
                     fontSize={11}
                     tickLine={false}
                     axisLine={false}
                     tickFormatter={(v) => `$${v}`}
                   />
                   <Tooltip content={<CustomTooltip />} />
                   <Area 
                     type="monotone" 
                     dataKey="profit" 
                     stroke="var(--green)" 
                     fill="url(#profitGrad)" 
                     strokeWidth={2} 
                     isAnimationActive={false}
                   />
                 </AreaChart>
               </ResponsiveContainer>
             ) : (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)] p-6 text-center">
                 <LineChart className="size-8 opacity-50 mb-3" />
                 <p className="font-semibold text-[var(--text-secondary)]">No trades found</p>
                 <p className="text-sm">There are no realized trades in this timeframe.</p>
               </div>
             )}
          </div>
       </CardContent>
    </Card>
  );
}
