"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBotStatus, useGridStatus } from "@/lib/hooks";
import { formatPrice } from "@/lib/utils";
import { GridVisualizer } from "./GridVisualizer";
import { GridInfoPanel } from "./GridInfoPanel";
import { GridControls } from "./GridControls";
import { Card } from "./ui/card";

export function TokenTabs() {
  const { status } = useBotStatus();
  const [selectedToken, setSelectedToken] = useState<string>("XPR");

  // Fetch the detailed grid status for our selected active token
  const { grid, isLoading } = useGridStatus(selectedToken);

  const tokens = ["XPR", "METAL", "LOAN"];

  return (
    <div className="w-full mt-6">
      <Tabs value={selectedToken} onValueChange={setSelectedToken} className="w-full">
        <TabsList className="flex w-full max-w-[450px] mb-8 bg-[var(--bg-darkest)] p-1.5 rounded-xl border border-[var(--border)] shadow-inner">
          {tokens.map((token) => (
             <TabsTrigger 
               key={token} 
               value={token} 
               className="flex-1 py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest transition-all data-[state=active]:bg-[var(--blue)] data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:scale-[1.02] data-[state=inactive]:text-[var(--text-secondary)] data-[state=inactive]:hover:bg-[var(--bg-elevated)] data-[state=inactive]:hover:text-white"
             >
               {token}
             </TabsTrigger>
          ))}
        </TabsList>
        
        {tokens.map((token) => (
          <TabsContent key={token} value={token} className="mt-0 outline-none">
            
            {/* Context snippet matching brief for selected tab */}
            {status?.grid_tokens?.[token] && (
              <div className="mb-4 flex items-center justify-between px-2 text-sm">
                 <div className="flex items-center gap-4">
                   <div className="flex flex-col">
                     <span className="text-muted-foreground">Current Price</span>
                     <span className="font-mono font-semibold">
                       {formatPrice(status.grid_tokens[token].current_price, token)}
                     </span>
                   </div>
                   <div className="h-8 w-px bg-border/40"></div>
                   <div className="flex flex-col">
                     <span className="text-muted-foreground">Today's P&L</span>
                     <span className="font-mono font-semibold text-primary">
                       +${status.grid_tokens[token].today_profit.toFixed(2)}
                     </span>
                   </div>
                 </div>

                 <div className="flex items-center gap-2">
                   {!status.grid_tokens[token].active && (
                     <span className="text-muted-foreground text-xs uppercase px-2 py-1 bg-muted rounded">Inactive</span>
                   )}
                 </div>
              </div>
            )}

            {isLoading ? (
               <Card className="h-64 animate-pulse flex items-center justify-center p-8 border-border/40">
                 <div className="text-muted-foreground flex items-center gap-2">
                    Loading grid data...
                 </div>
               </Card>
            ) : (
               <>
                 <GridVisualizer grid={grid} />
                 <GridInfoPanel grid={grid} />
                 <GridControls token={token} />
               </>
            )}
            
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
