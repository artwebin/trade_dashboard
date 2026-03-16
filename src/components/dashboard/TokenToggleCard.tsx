"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTokenConfigs, useSettings } from "@/lib/hooks";
import { upsertTokenConfig } from "@/lib/supabase";
import { updateSettingsGrid } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Coins, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_TOKENS = ["XPR", "METAL", "LOAN", "XMD"];

export function TokenToggleCard({ onConfigChange }: { onConfigChange?: () => void }) {
  const { session } = useAuth();
  const actor = session?.actor;
  const { configs, isLoading: loadingConfigs, mutate: mutateConfigs } = useTokenConfigs(actor);
  const { settings, mutate: mutateSettings } = useSettings();
  
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Sync with bot settings: what tokens are actually enabled in the bot?
  const botEnabledTokens = settings?.grid_tokens?.split(",").map(t => t.trim().toUpperCase()) || [];

  const handleToggle = async (symbol: string, currentEnabled: boolean) => {
    if (!actor) return;
    setToggling(symbol);
    setError(null);
    setSuccess(false);

    try {
      // 1. Update Supabase
      await upsertTokenConfig(actor, symbol, !currentEnabled);
      
      // 2. Calculate new token list for bot
      // We want to combine DEFAULT_TOKENS with Supabase state, but filter by enabled
      // For this implementation, we take all currently enabled tokens from Supabase, 
      // EXCEPT the one we just toggled (we use its NEW state).
      
      const supaconfigMap = new Map(configs.map(c => [c.symbol.toUpperCase(), c.enabled]));
      supaconfigMap.set(symbol.toUpperCase(), !currentEnabled);
      
      const newEnabledList = DEFAULT_TOKENS.filter(t => {
        // If it's in Supabase, use Supabase value. If not, default to true or false?
        // Let's assume default is ENABLED if not found in Supabase.
        return supaconfigMap.has(t) ? supaconfigMap.get(t) : true;
      });

      const grid_tokens = newEnabledList.join(",");

      // 3. Update Bot Engine
      await updateSettingsGrid({ grid_tokens });
      
      // 4. Refresh local state
      await mutateConfigs();
      await mutateSettings();
      
      setSuccess(true);
      if (onConfigChange) onConfigChange();
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to update configuration");
    } finally {
      setToggling(null);
    }
  };

  if (!actor) return null;

  const configMap = new Map(configs.map(c => [c.symbol.toUpperCase(), c.enabled]));

  return (
    <Card className="bg-[var(--bg-card)] border-[var(--border)] relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4">
        {success && <CheckCircle2 className="size-4 text-[var(--green)] animate-in fade-in zoom-in duration-300" />}
        {error && (
          <div title={error}>
            <AlertCircle className="size-4 text-[var(--red)]" />
          </div>
        )}
      </div>
      
      <CardHeader className="border-b border-[var(--border)]/50 pb-4">
        <CardTitle className="flex items-center gap-2 text-[var(--text-primary)]">
          <Coins className="size-5 text-orange-500" /> Token Trading Selector
        </CardTitle>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Choose which tokens the bot should actively trade.
        </p>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-3">
          {DEFAULT_TOKENS.map((symbol) => {
            const isEnabled = configMap.has(symbol) ? configMap.get(symbol)! : true;
            const isProcessing = toggling === symbol;
            
            return (
              <div 
                key={symbol}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-all duration-200",
                  isEnabled 
                    ? "bg-orange-500/5 border-orange-500/20 shadow-sm shadow-orange-500/5" 
                    : "bg-[var(--bg-darkest)] border-[var(--border)]/50 grayscale opacity-70"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "size-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-inner",
                    symbol === "XPR" ? "bg-blue-600" :
                    symbol === "METAL" ? "bg-orange-600" :
                    symbol === "LOAN" ? "bg-green-600" : "bg-purple-600"
                  )}>
                    {symbol[0]}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">{symbol}</div>
                    <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-tighter">
                      GRID ALGORITHM
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle(symbol, isEnabled)}
                  disabled={isProcessing}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
                    isEnabled ? "bg-orange-500" : "bg-zinc-700"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none block size-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                      isEnabled ? "translate-x-5" : "translate-x-1",
                      isProcessing && "animate-pulse"
                    )}
                  />
                  {isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="size-3 animate-spin text-white" />
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 rounded bg-blue-500/5 border border-blue-500/10 text-[10px] text-[var(--text-secondary)]">
          <p className="leading-normal italic">
            <strong>Note:</strong> Enabling/disabling tokens updates the global bot configuration. Changes will be persisted to your profile.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
