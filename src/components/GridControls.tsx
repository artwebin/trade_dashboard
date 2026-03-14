import { useState } from "react";
import { useBotStatus, useGridStatus } from "@/lib/hooks";
import { startGrid, stopGrid } from "@/lib/api";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { PlayCircle, StopCircle, Loader2 } from "lucide-react";

export function GridControls({ token }: { token: string }) {
  const { status, mutate: mutateStatus } = useBotStatus();
  const { grid, mutate: mutateGrid } = useGridStatus(token);

  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isStopOpen, setIsStopOpen] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form state for Start Grid
  const [stepPercent, setStepPercent] = useState(1.5);
  const [bulletSizeUsd, setBulletSizeUsd] = useState(100);
  const [maxBullets, setMaxBullets] = useState(10);

  const isActive = status?.grid_tokens?.[token]?.active || false;

  const handleStart = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      await startGrid({
        token,
        step_percent: stepPercent,
        bullet_size_usd: bulletSizeUsd,
        max_bullets: maxBullets,
      });
      await Promise.all([mutateStatus(), mutateGrid()]);
      setIsStartOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to start grid");
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      await stopGrid(token);
      await Promise.all([mutateStatus(), mutateGrid()]);
      setIsStopOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to stop grid");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 mt-8">
      
      {/* START MODAL */}
      <Dialog open={isStartOpen} onOpenChange={setIsStartOpen}>
        <DialogTrigger asChild>
          <Button 
            disabled={isActive || !status} 
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12"
          >
            <PlayCircle className="mr-2 size-5" />
            Start Grid
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Grid: {token}</DialogTitle>
            <DialogDescription>
              Configure the trading parameters for {token}. The grid will be initialized with matching buy/sell orders.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {errorMsg && (
               <div className="p-3 bg-destructive/20 border border-destructive/50 text-destructive rounded-md text-sm">
                 {errorMsg}
               </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="step" className="text-right text-sm font-medium">Step %</label>
              <input
                id="step"
                type="number"
                step="0.1"
                min="0.1"
                value={stepPercent}
                onChange={(e) => setStepPercent(parseFloat(e.target.value))}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="size" className="text-right text-sm font-medium">Bullet $</label>
              <input
                id="size"
                type="number"
                min="10"
                value={bulletSizeUsd}
                onChange={(e) => setBulletSizeUsd(parseInt(e.target.value, 10))}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="max" className="text-right text-sm font-medium">Max Bullets</label>
              <input
                id="max"
                type="number"
                min="2"
                max="50"
                value={maxBullets}
                onChange={(e) => setMaxBullets(parseInt(e.target.value, 10))}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStartOpen(false)}>Cancel</Button>
            <Button onClick={handleStart} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Launch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* STOP MODAL */}
      <Dialog open={isStopOpen} onOpenChange={setIsStopOpen}>
        <DialogTrigger asChild>
          <Button 
            disabled={!isActive || !status} 
            variant="outline" 
            className="flex-1 border-destructive text-destructive hover:bg-destructive/10 h-12"
          >
            <StopCircle className="mr-2 size-5" />
            Stop Grid
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Panic Stop Mode</DialogTitle>
            <DialogDescription>
              Are you sure you want to stop the grid for {token}? This will cancel all pending waiting limit orders immediately.
            </DialogDescription>
          </DialogHeader>
          
          {errorMsg && (
             <div className="p-3 bg-destructive/20 border border-destructive/50 text-destructive rounded-md text-sm mt-2">
               {errorMsg}
             </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsStopOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleStop} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Stop Grid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
