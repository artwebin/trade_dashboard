"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useBotStatus, useAllGrids, useDexStatus } from "@/lib/hooks";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  adminPauseBot, adminResumeBot, adminRestartBot, adminSyncGrid, stopGridForToken,
} from "@/lib/api";
import {
  Shield, Play, Square, RefreshCw, AlertTriangle, CheckCircle2,
  Zap, GitFork, Activity, Power, Cpu
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ActionState = "idle" | "loading" | "success" | "error";

interface ActionResult {
  state: ActionState;
  message?: string;
}

const GRID_TOKENS = ["XPR", "METAL", "LOAN"];

export default function AdminPage() {
  const { session } = useAuth();
  const router = useRouter();
  const { status } = useBotStatus();
  const { grids } = useAllGrids(status ? Object.keys(status.grid_tokens) : []);
  const { dexStatus, isLoading: isDexLoading } = useDexStatus();

  const [actionStates, setActionStates] = useState<Record<string, ActionResult>>({});
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: "", description: "", onConfirm: () => {} });

  // Redirect non-admins
  if (session && session.role !== "admin") {
    router.replace("/");
    return null;
  }

  const setAction = (key: string, result: ActionResult) => {
    setActionStates(prev => ({ ...prev, [key]: result }));
    if (result.state === "success" || result.state === "error") {
      setTimeout(() => setActionStates(prev => ({ ...prev, [key]: { state: "idle" } })), 4000);
    }
  };

  const runAction = async (key: string, fn: () => Promise<any>, confirmMsg?: { title: string; description: string }) => {
    if (confirmMsg) {
      setConfirmDialog({
        isOpen: true,
        title: confirmMsg.title,
        description: confirmMsg.description,
        onConfirm: () => {
          setConfirmDialog(d => ({ ...d, isOpen: false }));
          runAction(key, fn);
        },
      });
      return;
    }

    setAction(key, { state: "loading" });
    try {
      const result = await fn();
      setAction(key, { state: "success", message: result?.status || "Done" });
    } catch (e: any) {
      setAction(key, { state: "error", message: e.message || "Error" });
    }
  };

  const ActionButton = ({
    actionKey, label, icon: Icon, variant = "default", confirmMsg, onClick,
  }: {
    actionKey: string;
    label: string;
    icon: React.ElementType;
    variant?: "default" | "danger" | "warning" | "success";
    confirmMsg?: { title: string; description: string };
    onClick: () => Promise<any>;
  }) => {
    const state = actionStates[actionKey]?.state || "idle";
    const msg = actionStates[actionKey]?.message;

    const variantClass = {
      default: "bg-[var(--bg-elevated)] hover:bg-[var(--border-active)] border-[var(--border)] text-white",
      danger: "bg-red-600/10 hover:bg-red-600/20 border-red-500/30 text-red-400",
      warning: "bg-orange-600/10 hover:bg-orange-600/20 border-orange-500/30 text-orange-400",
      success: "bg-green-600/10 hover:bg-green-600/20 border-green-500/30 text-green-400",
    }[variant];

    return (
      <button
        onClick={() => runAction(actionKey, onClick, confirmMsg)}
        disabled={state === "loading"}
        className={cn(
          "flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-bold transition-all",
          variantClass,
          state === "loading" && "opacity-60 cursor-not-allowed"
        )}
      >
        {state === "loading" ? (
          <RefreshCw className="size-4 animate-spin" />
        ) : state === "success" ? (
          <CheckCircle2 className="size-4 text-green-400" />
        ) : state === "error" ? (
          <AlertTriangle className="size-4 text-red-400" />
        ) : (
          <Icon className="size-4" />
        )}
        {state === "success" ? msg || "Done" : state === "error" ? (msg || "Error") : label}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <PageHeader
        title="Admin Control Centre"
        description="Full bot administration — restricted to admin users only"
        lastUpdate={status?.timestamp}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Engine Controls ── */}
        <Card className="bg-[var(--bg-card)] border-[var(--border)]">
          <CardHeader className="border-b border-[var(--border)]/50 pb-4">
            <CardTitle className="flex items-center gap-2 text-[var(--text-primary)]">
              <Cpu className="size-5 text-[var(--blue)]" />
              Trading Engine
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-col gap-3">
            <p className="text-xs text-[var(--text-muted)] mb-1">Controls the grid trading engine (pauses/resumes trades, not the API server).</p>

            <div className="grid grid-cols-3 gap-2">
              <ActionButton
                actionKey="pause"
                label="Pause"
                icon={Square}
                variant="warning"
                confirmMsg={{ title: "Pause Trading Engine?", description: "All active grid trades will be paused. The bot process will remain running." }}
                onClick={adminPauseBot}
              />
              <ActionButton
                actionKey="resume"
                label="Resume"
                icon={Play}
                variant="success"
                onClick={adminResumeBot}
              />
              <ActionButton
                actionKey="restart"
                label="Restart"
                icon={RefreshCw}
                variant="danger"
                confirmMsg={{ title: "Restart Trading Engine?", description: "This will issue SIGTERM to the systemd service and restart it. Open sockets will close gracefully." }}
                onClick={adminRestartBot}
              />
            </div>

            <div className="mt-2 rounded-lg bg-[var(--bg-darkest)] border border-[var(--border)]/50 px-4 py-3 text-xs text-[var(--text-muted)] space-y-1">
              <div className="flex items-center gap-2">
                <span className={cn("size-2 rounded-full", status?.grid_paused ? "bg-[var(--orange)]" : "bg-[var(--green)]")} />
                Engine: {status?.grid_paused ? "Paused" : "Running"}
              </div>
              <div className="flex items-center gap-2">
                <Activity className="size-3" />
                Mode: <span className={status?.mode === "live" ? "text-[var(--green)] font-bold" : "text-[var(--orange)] font-bold"}>{status?.mode?.toUpperCase()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── DEX Order Health ── */}
        <Card className="bg-[var(--bg-card)] border-[var(--border)]">
          <CardHeader className="border-b border-[var(--border)]/50 pb-4">
            <CardTitle className="flex items-center justify-between text-[var(--text-primary)]">
              <div className="flex items-center gap-2">
                <Activity className="size-5 text-[var(--blue)]" />
                DEX Order Health
              </div>
              {isDexLoading && <RefreshCw className="size-4 animate-spin text-[var(--text-muted)]" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-col gap-4">
            
            {!dexStatus ? (
               <div className="text-sm text-[var(--text-muted)]">Loading order data...</div>
            ) : (
               <>
                 {dexStatus.db_only === 0 ? (
                   <div className="flex items-center gap-2 text-green-400 bg-green-500/10 px-4 py-3 rounded-lg border border-green-500/20">
                     <span className="size-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                     <span className="text-sm font-semibold">All {dexStatus.orders?.length || 0} orders confirmed on DEX</span>
                   </div>
                 ) : (
                   <div className="flex flex-col gap-3 bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                     <div className="flex items-center gap-2 text-red-400">
                       <AlertTriangle className="size-4" />
                       <span className="text-sm font-bold">{dexStatus.db_only} ghost orders detected</span>
                     </div>
                     <ActionButton
                        actionKey="sync-grid"
                        label="Sync Grid with Chain (Fix Ghost Trades)"
                        icon={Zap}
                        variant="warning"
                        confirmMsg={{ title: "Sync Grid?", description: "This will check all waiting_sell orders and fix those without a real on-chain position." }}
                        onClick={adminSyncGrid}
                      />
                   </div>
                 )}

                 {dexStatus.orders && dexStatus.orders.length > 0 && (
                   <div className="mt-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                     <table className="w-full text-xs text-left">
                       <thead className="sticky top-0 bg-[var(--bg-card)] text-[var(--text-muted)] shadow-sm">
                         <tr>
                           <th className="pb-2 font-medium">Token</th>
                           <th className="pb-2 font-medium">Type</th>
                           <th className="pb-2 font-medium">DEX ID</th>
                           <th className="pb-2 font-medium text-right">Price</th>
                           <th className="pb-2 font-medium text-center">Chain Status</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-[var(--border)]/50">
                         {dexStatus.orders.map((o: any, idx: number) => (
                           <tr key={idx} className="hover:bg-[var(--bg-elevated)] transition-colors">
                             <td className="py-2 font-bold text-[var(--text-primary)]">{o.token}</td>
                             <td className="py-2">
                               <span className={cn(
                                 "px-1.5 py-0.5 rounded uppercase text-[9px] font-bold",
                                 String(o.type).includes("buy") ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                               )}>
                                 {o.type}
                               </span>
                             </td>
                             <td className="py-2 font-mono text-[var(--text-muted)]">{o.dex_id || "N/A"}</td>
                             <td className="py-2 font-mono text-right">${typeof o.price === 'number' ? o.price.toFixed(4) : o.price}</td>
                             <td className="py-2 text-center">
                               {o.chain_status ? (
                                 <CheckCircle2 className="size-3.5 text-green-400 mx-auto" />
                               ) : (
                                 <span className="text-red-400 font-bold">✗</span>
                               )}
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 )}
               </>
            )}

          </CardContent>
        </Card>

        {/* ── Per-Token Grid Controls ── */}
        <Card className="bg-[var(--bg-card)] border-[var(--border)] lg:col-span-2">
          <CardHeader className="border-b border-[var(--border)]/50 pb-4">
            <CardTitle className="flex items-center gap-2 text-[var(--text-primary)]">
              <Power className="size-5 text-[var(--blue)]" />
              Per-Token Grid Control
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-xs text-[var(--text-muted)] mb-4">Stop or restart grids for individual tokens. Useful for manual intervention without affecting other tokens.</p>
            <div className="grid md:grid-cols-3 gap-4">
              {GRID_TOKENS.map((token) => {
                const tokenData = status?.grid_tokens?.[token];
                const gridData = grids.find(g => g?.token === token);
                const isActive = tokenData?.active;
                const isPaused = tokenData?.grid_status === "oor";

                return (
                  <div key={token} className="rounded-xl bg-[var(--bg-darkest)] border border-[var(--border)]/60 p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{token}</span>
                      <span className={cn(
                        "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                        !tokenData ? "bg-[var(--bg-elevated)] text-[var(--text-muted)]" :
                        isActive ? "bg-green-500/10 text-green-400" :
                        "bg-red-500/10 text-red-400"
                      )}>
                        {!tokenData ? "Disabled" : isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      Bullets: {gridData?.total_bullets ?? 0} | Trades Today: {gridData?.trades_today ?? 0}
                    </div>
                    <ActionButton
                      actionKey={`stop-grid-${token}`}
                      label={`Stop ${token} Grid`}
                      icon={Square}
                      variant="danger"
                      confirmMsg={{ title: `Stop ${token} Grid?`, description: `This clears the bot database for ${token}. Important: Open orders on MetalX will NOT be cancelled automatically and must be closed manually.` }}
                      onClick={() => stopGridForToken(token)}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && setConfirmDialog(d => ({ ...d, isOpen: false }))}>
        <DialogContent className="sm:max-w-md bg-[var(--bg-darkest)] border-[var(--border)] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-[var(--orange)]" />
              {confirmDialog.title}
            </DialogTitle>
            <DialogDescription className="text-[var(--text-secondary)] pt-1">
              {confirmDialog.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:flex-row pt-2">
            <Button variant="outline" onClick={() => setConfirmDialog(d => ({ ...d, isOpen: false }))}
              className="flex-1 border-[var(--border)] text-[var(--text-secondary)]">
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDialog.onConfirm} className="flex-1">
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
