"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/lib/hooks";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  updateSettingsGrid, 
  updateSettingsCredentials, 
  updateSettingsTelegram, 
  updateMode, 
  restartBot 
} from "@/lib/api";
import { 
  Settings, Link as LinkIcon, Lock, Key, 
  Bell, Play, Power, AlertTriangle, RefreshCw, Send, CheckCircle2 
} from "lucide-react";

export default function SettingsPage() {
  const { settings, isLoading, mutate } = useSettings();
  const [needsRestart, setNeedsRestart] = useState(false);
  
  // Initialize from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('bot_needs_restart');
      if (stored === 'true') {
        setNeedsRestart(true);
      }
    }
  }, []);

  const setNeedsRestartPersistent = (value: boolean) => {
    setNeedsRestart(value);
    if (typeof window !== 'undefined') {
      if (value) {
        localStorage.setItem('bot_needs_restart', 'true');
      } else {
        localStorage.removeItem('bot_needs_restart');
      }
    }
  };
  // Local form states
  const [gridForm, setGridForm] = useState({
    step_percent: 1.5,
    bullet_size_usd: 100,
    max_bullets: 10,
    max_exposure_usd: 3000,
    stop_loss_percent: 15,
    tokens: "XPR,METAL,LOAN"
  });
  
  const [credForm, setCredForm] = useState({
    account: "",
    privateKey: ""
  });
  
  const [tgForm, setTgForm] = useState({
    botToken: "",
    chatId: ""
  });
  
  const [isSavingGrid, setIsSavingGrid] = useState(false);
  const [isSavingCreds, setIsSavingCreds] = useState(false);
  const [isSavingTg, setIsSavingTg] = useState(false);
  const [isSwitchingMode, setIsSwitchingMode] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [restartSuccess, setRestartSuccess] = useState(false);
  const [modeError, setModeError] = useState("");

  // Populate forms when settings load
  useEffect(() => {
    if (settings) {
      setGridForm({
        step_percent: settings.grid_step_percent,
        bullet_size_usd: settings.grid_bullet_size_usd,
        max_bullets: settings.grid_max_bullets,
        max_exposure_usd: settings.max_total_exposure_usd,
        stop_loss_percent: settings.stop_loss_percent,
        tokens: settings.grid_tokens
      });
      setCredForm({
        account: settings.xpr_account || "",
        privateKey: "" // Don't populate masked key into input
      });
      setTgForm({
        botToken: "", // Don't populate bot token
        chatId: settings.telegram_chat_id || ""
      });
    }
  }, [settings]);

  const handleGridSave = async () => {
    setIsSavingGrid(true);
    try {
      await updateSettingsGrid({
        step_percent: gridForm.step_percent,
        bullet_size_usd: gridForm.bullet_size_usd,
        max_bullets: gridForm.max_bullets,
        max_total_exposure_usd: gridForm.max_exposure_usd,
        stop_loss_percent: gridForm.stop_loss_percent,
        grid_tokens: gridForm.tokens
      });
      setNeedsRestartPersistent(true);
      mutate();
    } catch (e) {
      alert("Failed to save grid settings");
    } finally {
      setIsSavingGrid(false);
    }
  };

  const handleCredsSave = async () => {
    setIsSavingCreds(true);
    try {
      if (!credForm.account || !credForm.privateKey) return alert("Fill both fields");
      await updateSettingsCredentials(credForm.account, credForm.privateKey);
      setNeedsRestartPersistent(true);
      setCredForm(prev => ({ ...prev, privateKey: "" }));
      mutate();
    } catch (e) {
      alert("Failed to save credentials");
    } finally {
      setIsSavingCreds(false);
    }
  };

  const handleTgSave = async () => {
    setIsSavingTg(true);
    try {
      if (!tgForm.botToken || !tgForm.chatId) return alert("Fill both fields");
      await updateSettingsTelegram(tgForm.botToken, tgForm.chatId);
      setNeedsRestartPersistent(true);
      setTgForm(prev => ({ ...prev, botToken: "" }));
      mutate();
    } catch (e) {
      alert("Failed to save telegram config");
    } finally {
      setIsSavingTg(false);
    }
  };

  const handleModeSwitch = async (targetMode: "paper" | "live") => {
    if (targetMode === settings?.bot_mode) return;
    
    if (targetMode === "live") {
      const confirmed = window.confirm("WARNING: Switching to LIVE mode will use REAL funds from your configured account! Are you absolutely sure?");
      if (!confirmed) return;
    }
    
    setIsSwitchingMode(true);
    setModeError("");
    try {
      await updateMode(targetMode);
      setNeedsRestartPersistent(true);
      mutate();
    } catch (e: any) {
      setModeError(e.message || "Failed to switch mode. Missing credentials?");
    } finally {
      setIsSwitchingMode(false);
    }
  };

  const handleRestart = async () => {
    setIsRestarting(true);
    setRestartSuccess(false);
    try {
      await restartBot();
      setNeedsRestartPersistent(false);
      setRestartSuccess(true);
      setTimeout(() => setRestartSuccess(false), 3000); // clear success msg after 3s
    } catch (e) {
      alert("Failed to restart daemon");
    } finally {
      setIsRestarting(false);
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="flex flex-col gap-6 w-full h-full p-6">
        <div className="animate-pulse space-y-4 max-w-xl">
           <div className="h-8 w-64 bg-border/40 rounded"></div>
           <div className="h-4 w-96 bg-border/30 rounded"></div>
           <div className="h-64 w-full bg-border/20 rounded-xl mt-8"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 w-full h-full pb-10">
      
      {needsRestart && (
        <div className="sticky top-0 z-50 flex items-center justify-between p-4 bg-[var(--orange)]/10 border border-[var(--orange)]/50 rounded-xl mt-2 backdrop-blur-md shadow-lg shadow-[var(--orange)]/5">
           <div className="flex items-center gap-3">
             <div className="bg-[var(--orange)]/20 p-2 rounded-full">
               <AlertTriangle className="size-5 text-[var(--orange)]" />
             </div>
             <div>
               <h4 className="font-bold text-[var(--orange)]">Restart Required</h4>
               <p className="text-sm text-[var(--text-secondary)]">You have pending configuration changes. Restart the bot engine to apply them.</p>
             </div>
           </div>
           <button 
             onClick={handleRestart}
             disabled={isRestarting}
             className="px-6 py-2.5 bg-[var(--orange)] hover:bg-[#e67e22] text-black font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
           >
             {isRestarting ? <RefreshCw className="size-4 animate-spin" /> : <Power className="size-4" />}
             {isRestarting ? "Restarting..." : "Apply & Restart"}
           </button>
        </div>
      )}

      <PageHeader 
        title="Settings & Configuration" 
        description="Manage your bot parameters, connection credentials, and trading modes."
      />
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        
         {/* LEFT COLUMN */}
         <div className="flex flex-col gap-6">
           
           {/* MODE SELECTOR */}
           <Card className="bg-[var(--bg-card)] border-[var(--border)] overflow-hidden">
             <div className="h-1 w-full bg-gradient-to-r from-transparent via-[var(--border)] to-transparent opacity-50"></div>
             <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="font-bold text-lg flex items-center gap-2"><Play className="size-5 text-[var(--blue)]" /> Operating Mode</h3>
                   <Badge variant={settings.bot_mode === "live" ? "destructive" : "default"} className="uppercase font-bold tracking-widest px-3">
                     {settings.bot_mode} MODE
                   </Badge>
                </div>
                
                <div className="flex p-1 bg-[var(--bg-darkest)] rounded-lg border border-[var(--border)] gap-1">
                  <button 
                    onClick={() => handleModeSwitch("paper")}
                    disabled={isSwitchingMode}
                    className={`flex-1 py-3 text-sm font-bold rounded-md transition-all ${settings.bot_mode === 'paper' ? 'bg-[var(--blue)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)]'}`}
                  >
                    PAPER TEST
                  </button>
                  <button 
                    onClick={() => handleModeSwitch("live")}
                    disabled={isSwitchingMode}
                    className={`flex-1 py-3 text-sm font-bold rounded-md transition-all ${settings.bot_mode === 'live' ? 'bg-red-600 text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)]'}`}
                  >
                    LIVE TRADING
                  </button>
                </div>
                {modeError && <p className="text-red-500 text-xs mt-3 font-medium flex items-center gap-1"><AlertTriangle className="size-3"/> {modeError}</p>}
                
                <div className="mt-4 flex items-start gap-3 bg-[var(--orange)]/5 p-3 rounded-lg border border-[var(--orange)]/10 text-sm">
                  <AlertTriangle className="size-5 text-[var(--orange)] shrink-0 mt-0.5" />
                  <p className="text-[var(--text-secondary)]">Switching to <strong className="text-white">LIVE</strong> mode will use real funds from your configured account to execute grid trades. Do not enable without proper token balances.</p>
                </div>
             </CardContent>
           </Card>

           {/* GRID SETTINGS */}
           <Card className="bg-[var(--bg-card)] border-[var(--border)]">
             <CardHeader className="border-b border-[var(--border)]/50 pb-4">
               <CardTitle className="flex items-center gap-2 text-[var(--text-primary)]">
                 <Settings className="size-5" /> Grid Parameters
               </CardTitle>
             </CardHeader>
             <CardContent className="p-6 space-y-5">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Grid Step (%)</label>
                    <input 
                      type="number" step="0.1" min="0.1" max="10"
                      value={gridForm.step_percent}
                      onChange={(e) => setGridForm({...gridForm, step_percent: Number(e.target.value)})}
                      className="w-full bg-[var(--bg-darkest)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--blue)] font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Bullet Size (USD)</label>
                    <input 
                      type="number" step="1" min="1" max="10000"
                      value={gridForm.bullet_size_usd}
                      onChange={(e) => setGridForm({...gridForm, bullet_size_usd: Number(e.target.value)})}
                      className="w-full bg-[var(--bg-darkest)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--blue)] font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Max Bullets / Token</label>
                    <input 
                      type="number" step="1" min="1" max="50"
                      value={gridForm.max_bullets}
                      onChange={(e) => setGridForm({...gridForm, max_bullets: Number(e.target.value)})}
                      className="w-full bg-[var(--bg-darkest)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--blue)] font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Global Exps. (USD)</label>
                    <input 
                      type="number" step="1" min="10"
                      value={gridForm.max_exposure_usd}
                      onChange={(e) => setGridForm({...gridForm, max_exposure_usd: Number(e.target.value)})}
                      className="w-full bg-[var(--bg-darkest)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--blue)] font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Stop Loss (%)</label>
                    <input 
                      type="number" step="1" min="1" max="50"
                      value={gridForm.stop_loss_percent}
                      onChange={(e) => setGridForm({...gridForm, stop_loss_percent: Number(e.target.value)})}
                      className="w-full bg-[var(--bg-darkest)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--blue)] font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Active Grid Tokens (CSV)</label>
                  <input 
                    type="text" 
                    value={gridForm.tokens}
                    onChange={(e) => setGridForm({...gridForm, tokens: e.target.value})}
                    placeholder="XPR,METAL,LOAN"
                    className="w-full bg-[var(--bg-darkest)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--blue)] font-mono"
                  />
                </div>

                <button 
                  onClick={handleGridSave}
                  disabled={isSavingGrid}
                  className="w-full mt-2 bg-[var(--bg-elevated)] hover:bg-[var(--border-active)] text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2 border border-[var(--border)]"
                >
                  {isSavingGrid ? <RefreshCw className="animate-spin size-4" /> : <Lock className="size-4" />}
                  Save Grid Configuration
                </button>
             </CardContent>
           </Card>

         </div>

         {/* RIGHT COLUMN */}
         <div className="flex flex-col gap-6">

           {/* XPR CREDENTIALS */}
           <Card className="bg-[var(--bg-card)] border-[var(--border)]">
             <CardHeader className="border-b border-[var(--border)]/50 pb-4">
               <CardTitle className="flex items-center gap-2 text-[var(--text-primary)]">
                 <Key className="size-5" /> XPR Network Credentials
               </CardTitle>
             </CardHeader>
             <CardContent className="p-6 space-y-4">
               
               <div className="space-y-2">
                 <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Trading Account Name</label>
                 <input 
                   type="text" 
                   value={credForm.account}
                   onChange={(e) => setCredForm({...credForm, account: e.target.value})}
                   placeholder="e.g. tradingbot1"
                   className="w-full bg-[var(--bg-darkest)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--blue)] font-mono"
                 />
               </div>
               
               <div className="space-y-2">
                 <div className="flex items-center justify-between">
                   <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Private Key</label>
                   {settings.xpr_private_key_set && (
                     <Badge variant="outline" className="text-[var(--green)] border-[var(--green)]/30 bg-[var(--green)]/5 text-[10px] py-0">Configured</Badge>
                   )}
                 </div>
                 <input 
                   type="password" 
                   value={credForm.privateKey}
                   onChange={(e) => setCredForm({...credForm, privateKey: e.target.value})}
                   placeholder={settings.xpr_private_key_set ? settings.xpr_private_key_masked : "PVT_K1_..."}
                   className="w-full bg-[var(--bg-darkest)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--blue)] font-mono"
                 />
               </div>

               <div className="text-xs text-[var(--text-muted)] flex items-start gap-2 bg-[var(--bg-darkest)] p-3 rounded mt-2">
                 <AlertTriangle className="size-4 shrink-0 mt-0.5 text-[var(--blue)]" />
                 <p>It is strictly recommended to use a dedicated sub-account for API trading rather than your primary vault.</p>
               </div>

               <button 
                  onClick={handleCredsSave}
                  disabled={isSavingCreds}
                  className="w-full mt-2 bg-[var(--bg-elevated)] hover:bg-[var(--border-active)] text-white font-medium py-2 rounded-lg transition-colors border border-[var(--border)] flex items-center justify-center gap-2"
                >
                  {isSavingCreds ? "Saving..." : "Update Vault Credentials"}
                </button>
             </CardContent>
           </Card>

           {/* TELEGRAM */}
           <Card className="bg-[var(--bg-card)] border-[var(--border)]">
             <CardHeader className="border-b border-[var(--border)]/50 pb-4">
               <CardTitle className="flex items-center gap-2 text-[var(--text-primary)]">
                 <Send className="size-5" /> Telegram Webhooks
               </CardTitle>
             </CardHeader>
             <CardContent className="p-6 space-y-4">
               
               <div className="space-y-2">
                 <div className="flex items-center justify-between">
                   <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Bot Request Token</label>
                   {settings.telegram_bot_token_set && (
                     <Badge variant="outline" className="text-[var(--green)] border-[var(--green)]/30 bg-[var(--green)]/5 text-[10px] py-0">Connected</Badge>
                   )}
                 </div>
                 <input 
                   type="password" 
                   value={tgForm.botToken}
                   onChange={(e) => setTgForm({...tgForm, botToken: e.target.value})}
                   placeholder={settings.telegram_bot_token_set ? "••••••••••" : "123456:ABC-DEF1234ghIkl-zyx5cM"}
                   className="w-full bg-[var(--bg-darkest)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--blue)] font-mono"
                 />
               </div>

               <div className="space-y-2">
                 <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Target Chat ID</label>
                 <input 
                   type="text" 
                   value={tgForm.chatId}
                   onChange={(e) => setTgForm({...tgForm, chatId: e.target.value})}
                   placeholder="-100987654321"
                   className="w-full bg-[var(--bg-darkest)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--blue)] font-mono"
                 />
               </div>

               <button 
                  onClick={handleTgSave}
                  disabled={isSavingTg}
                  className="w-full mt-2 bg-[var(--bg-elevated)] hover:bg-[var(--border-active)] text-white font-medium py-2 rounded-lg transition-colors border border-[var(--border)] flex items-center justify-center gap-2"
                >
                  {isSavingTg ? "Saving..." : "Apply Webhook"}
                </button>
             </CardContent>
           </Card>

           {/* SYSTEM CONTROL PANEL */}
           <Card className="bg-[var(--bg-card)] border-[var(--border)]">
             <CardHeader className="border-b border-[var(--border)]/50 pb-4">
               <CardTitle className="flex items-center justify-between text-[var(--text-primary)]">
                 <span className="flex items-center gap-2"><Power className="size-5" /> Master Engine Control</span>
                 {restartSuccess && <span className="text-sm text-[var(--green)] flex items-center gap-1 font-bold animate-in fade-in zoom-in duration-300"><CheckCircle2 className="size-4" /> Restarted</span>}
               </CardTitle>
             </CardHeader>
             <CardContent className="p-6">
                <div className="flex items-center gap-3">
                   <button 
                     onClick={handleRestart}
                     disabled={isRestarting}
                     className="flex-1 py-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 font-bold rounded-lg border border-red-500/30 transition-all flex items-center justify-center gap-2"
                   >
                     <RefreshCw className={`size-4 ${isRestarting ? 'animate-spin' : ''}`} />
                     {isRestarting ? "Cycling Service..." : "Restart Trading Engine"}
                   </button>
                   <button 
                     className="flex-1 py-3 bg-[var(--bg-elevated)] hover:bg-[var(--border-active)] text-[var(--text-secondary)] hover:text-white font-bold rounded-lg border border-[var(--border)] transition-all flex items-center justify-center gap-2"
                   >
                     <LinkIcon className="size-4" /> Restart Frontend API
                   </button>
                </div>
                <p className="text-center text-xs text-[var(--text-muted)] mt-4">Manual restart hooks issue graceful kill signals (SIGTERM) to node workers to finish closing open sockets before returning 0.</p>
             </CardContent>
           </Card>

         </div>
      </div>
    </div>
  );
}
