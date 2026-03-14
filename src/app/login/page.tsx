"use client";

import { useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Activity, Shield, ChevronRight, AlertTriangle } from "lucide-react";

// Dynamically import ProtonWebSDK to avoid SSR issues
async function connectProtonWallet() {
  const ConnectWallet = (await import("@proton/web-sdk")).default;
  const result = await ConnectWallet({
    linkOptions: {
      chainId: "384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0",
      endpoints: ["https://rpc.api.mainnet.metalx.com"],
    },
    transportOptions: {
      requestAccount: "metalxbot",
      requestStatus: false,
    },
    selectorOptions: {
      appName: "MetalX Trading Bot",
      appLogo: "https://trade.artwebin.com/icon.png",
    },
  });
  return result;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = searchParams.get("from") || "/";

  const handleConnect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const { session, link } = await connectProtonWallet();

      if (!session) {
        setError("Connection cancelled or failed. Please try again.");
        return;
      }

      const actor = String(session.auth.actor);
      const permission = String(session.auth.permission);

      const result = await login(actor, permission);

      if (!result.success) {
        await link?.removeSession("metalxbot", session.auth, session.chainId);
        setError(result.error || "Access denied.");
        return;
      }

      router.push(redirectTo);
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setIsConnecting(false);
    }
  }, [login, router, redirectTo]);

  return (
    <div className="min-h-screen bg-[var(--bg-darkest)] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Ambient background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[var(--blue)]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[var(--green)]/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--blue)]/3 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(var(--text-muted) 1px, transparent 1px), linear-gradient(90deg, var(--text-muted) 1px, transparent 1px)`,
          backgroundSize: "60px 60px"
        }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-[var(--blue)] to-[var(--green)] shadow-2xl shadow-[var(--blue)]/30 mb-6">
            <Activity className="size-8 text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">MetalX Bot</h1>
          <p className="text-[var(--text-secondary)] text-sm">Trading Engine Dashboard</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-[var(--border)]/50">
            <div className="p-2 rounded-lg bg-[var(--blue)]/10">
              <Shield className="size-5 text-[var(--blue)]" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">Secure Access Required</h2>
              <p className="text-xs text-[var(--text-muted)]">Connect your Proton Wallet to continue</p>
            </div>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <AlertTriangle className="size-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full relative group overflow-hidden rounded-xl py-4 px-6 bg-gradient-to-r from-[var(--blue)] to-[var(--green)] text-white font-bold text-base shadow-lg shadow-[var(--blue)]/25 hover:shadow-[var(--blue)]/40 hover:scale-[1.01] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-center gap-3 relative">
              {isConnecting ? (
                <>
                  <svg className="animate-spin size-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Connecting...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 32 32" className="size-5 fill-white">
                    <path d="M16 0C7.163 0 0 7.163 0 16s7.163 16 16 16 16-7.163 16-16S24.837 0 16 0zm7.5 22.5h-15v-3h15v3zm0-6h-15v-3h15v3zm0-6h-15v-3h15v3z"/>
                  </svg>
                  Connect with Proton Wallet
                  <ChevronRight className="size-4 ml-auto" />
                </>
              )}
            </div>
          </button>

          <p className="text-center text-xs text-[var(--text-muted)] mt-5 leading-relaxed">
            Access is restricted to authorized accounts only.
            <br />
            Your wallet connection is cryptographically verified.
          </p>
        </div>

        <p className="text-center text-xs text-[var(--text-muted)]/50 mt-6">
          MetalX Trading Bot · XPR Network · v1.0
        </p>
      </div>
    </div>
  );
}

// Suspense boundary required because LoginContent uses useSearchParams()
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg-darkest)] flex items-center justify-center">
        <div className="size-8 border-2 border-[var(--blue)] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
