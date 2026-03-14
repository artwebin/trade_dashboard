"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";

const RPC = "https://rpc.api.mainnet.metalx.com/v1/chain";

function isAbortError(err: unknown) {
  const e = err as any;
  return e?.name === "AbortError" || String(err).includes("AbortError");
}

async function postJson<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

function parseAssetAmount(maybeAsset: string | undefined | null) {
  if (!maybeAsset) return 0;
  return parseFloat(maybeAsset) || 0;
}

function formatNumber(n: number, min: number, max: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: min, maximumFractionDigits: max });
}

// Avatar is stored as raw base64 (JPEG or PNG) in the chain's usersinfo table
function getAvatarSrc(avatar?: string | null): string | null {
  if (!avatar) return null;
  const a = avatar.trim();
  if (a.startsWith("data:image/")) return a;
  const isJpg = a.startsWith("/9j/");
  const isPng = a.startsWith("iVBORw0");
  if (isJpg || isPng) {
    const mime = isPng ? "image/png" : "image/jpeg";
    return `data:${mime};base64,${a}`;
  }
  return null;
}

// Shows real PNG token icon with a colored letter-circle fallback
function TokenIcon({ symbol, icon, bg, color }: { symbol: string; icon: string; bg: string; color: string }) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <div className="size-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0" style={{ background: bg, color }}>
        {symbol[0]}
      </div>
    );
  }
  return (
    <img
      src={icon}
      alt={symbol}
      width={24}
      height={24}
      className="size-6 rounded-full object-cover shrink-0"
      onError={() => setErr(true)}
    />
  );
}

interface Balances {
  xpr: string;
  metal: string;
  loan: string;
  xmd: string;
}

export function AccountProfileCard() {
  const { session } = useAuth();
  const actor = session?.actor ?? "";

  const [balances, setBalances] = useState<Balances>({
    xpr: "0.0000 XPR",
    metal: "0.00000000 METAL",
    loan: "0.0000 LOAN",
    xmd: "0.0000 XMD",
  });
  const [rawAvatar, setRawAvatar] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [loading, setLoading] = useState(true);

  const avatarSrc = useMemo(() => getAvatarSrc(rawAvatar), [rawAvatar]);

  useEffect(() => {
    setAvatarError(false);
  }, [actor, avatarSrc]);

  useEffect(() => {
    if (!actor) return;
    const controller = new AbortController();
    const sig = controller.signal;

    const fetchBalance = async (code: string, symbol: string): Promise<number> => {
      try {
        const data = await postJson<string[]>(
          `${RPC}/get_currency_balance`,
          { code, account: actor, symbol },
          sig
        );
        return data?.[0] ? parseFloat(data[0]) : 0;
      } catch (err) {
        if (!isAbortError(err)) console.warn("balance fetch failed:", code, symbol, String(err));
        return 0;
      }
    };

    async function run() {
      setLoading(true);
      try {
        // 1) Fetch liquid XPR
        const liquidXpr = await fetchBalance("eosio.token", "XPR");

        // 2) Fetch staked XPR + refund + avatar from get_account
        let stakedXpr = 0;
        let refundXpr = 0;
        try {
          const accountData = await postJson<any>(`${RPC}/get_account`, { account_name: actor }, sig);
          if (accountData?.voter_info?.staked) {
            stakedXpr = (parseFloat(accountData.voter_info.staked) || 0) / 10000;
          } else if (accountData?.self_delegated_bandwidth) {
            stakedXpr += parseAssetAmount(accountData.self_delegated_bandwidth.cpu_weight);
            stakedXpr += parseAssetAmount(accountData.self_delegated_bandwidth.net_weight);
          }
          if (accountData?.refund_request) {
            refundXpr += parseAssetAmount(accountData.refund_request.cpu_amount);
            refundXpr += parseAssetAmount(accountData.refund_request.net_amount);
          }
        } catch (err) {
          if (!isAbortError(err)) console.warn("get_account failed:", String(err));
        }

        // 3) METAL (xtokens), LOAN (loan.token), XMD (xmd.token)
        const [totalMetal, totalLoan, totalXmd] = await Promise.all([
          fetchBalance("xtokens", "METAL"),
          fetchBalance("loan.token", "LOAN"),
          fetchBalance("xmd.token", "XMD"),
        ]);

        setBalances({
          xpr: `${formatNumber(liquidXpr + stakedXpr + refundXpr, 4, 4)} XPR`,
          metal: `${formatNumber(totalMetal, 8, 8)} METAL`,
          loan: `${formatNumber(totalLoan, 4, 4)} LOAN`,
          xmd: `${formatNumber(totalXmd, 4, 4)} XMD`,
        });

        // 4) Fetch avatar from eosio.proton usersinfo table
        try {
          const usersInfo = await postJson<any>(`${RPC}/get_table_rows`, {
            json: true,
            code: "eosio.proton",
            scope: "eosio.proton",
            table: "usersinfo",
            lower_bound: actor,
            upper_bound: actor,
            limit: 1,
          }, sig);
          const row = usersInfo?.rows?.[0];
          if (row?.avatar) setRawAvatar(row.avatar);
        } catch (err) {
          if (!isAbortError(err)) console.warn("usersinfo fetch failed:", String(err));
        }
      } finally {
        setLoading(false);
      }
    }

    run();
    const interval = setInterval(run, 60_000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [actor]);

  const initial = actor ? actor[0].toUpperCase() : "?";
  const displayName = actor;

  const tokens = [
    { symbol: "XPR",   amount: balances.xpr,   color: "var(--blue)",   bg: "rgba(59,130,246,0.15)",  icon: "/icons/xpr.png"   },
    { symbol: "METAL", amount: balances.metal, color: "var(--orange)", bg: "rgba(251,146,60,0.15)",  icon: "/icons/metal.png" },
    { symbol: "LOAN",  amount: balances.loan,  color: "var(--green)",  bg: "rgba(0,214,143,0.15)",   icon: "/icons/loan.png"  },
    { symbol: "XMD",   amount: balances.xmd,   color: "var(--blue)",   bg: "rgba(99,102,241,0.15)",  icon: "/icons/xmd.png"   },
  ];

  return (
    <div className="flex flex-col h-full justify-between">
      {/* Account Header */}
      <div className="flex items-center gap-4 mb-5">
        <div className="relative shrink-0">
          {!avatarError && avatarSrc ? (
            <img
              src={avatarSrc}
              alt={actor}
              onError={() => setAvatarError(true)}
              className="size-14 rounded-full object-cover border-2 border-[var(--blue)]/30"
            />
          ) : (
            <div className="size-14 rounded-full bg-gradient-to-br from-[var(--blue)] to-[var(--green)] flex items-center justify-center text-white font-black text-2xl border-2 border-[var(--blue)]/20">
              {initial}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 size-4 rounded-full bg-[var(--green)] border-2 border-[var(--bg-elevated)]" />
        </div>

        <div className="min-w-0">
          <div className="font-bold text-white text-base truncate">{displayName}</div>
          <span className="inline-block text-xs font-semibold tracking-widest uppercase px-2 py-0.5 rounded bg-[var(--blue)]/15 text-[var(--blue)] border border-[var(--blue)]/20 mt-1">
            {session?.role ?? "user"}
          </span>
        </div>
      </div>

      {/* Token Balances — 2×2 grid */}
      <div className="flex-1">
        <p className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase mb-2">Token Balances</p>
        <div className="grid grid-cols-2 gap-2">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-11 rounded-lg bg-[var(--bg-card)] animate-pulse" />
            ))
          ) : (
            tokens.map(({ symbol, amount, color, bg, icon }) => (
              <div
                key={symbol}
                className="flex flex-col gap-1.5 px-3 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]/50 hover:border-[var(--border)] transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <TokenIcon symbol={symbol} icon={icon} bg={bg} color={color} />
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">{symbol}</span>
                </div>
                <span className="text-xs font-mono font-bold tabular-nums leading-tight" style={{ color }}>
                  {amount.split(" ")[0]}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* XPR Explorer Link */}
      <a
        href={`https://explorer.xprnetwork.org/account/${actor}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 text-xs text-[var(--text-muted)] hover:text-[var(--blue)] transition-colors flex items-center gap-1"
      >
        <span>View on XPR Explorer</span>
        <svg viewBox="0 0 24 24" className="size-3 fill-current">
          <path d="M14 5c0-.552.448-1 1-1h5c.552 0 1 .448 1 1v5c0 .552-.448 1-1 1s-1-.448-1-1V7.414l-9.293 9.293c-.391.391-1.023.391-1.414 0s-.391-1.023 0-1.414L17.586 6H15c-.552 0-1-.448-1-1z"/>
          <path d="M3 7c0-1.105.895-2 2-2h5c.552 0 1 .448 1 1s-.448 1-1 1H5v12h12v-5c0-.552.448-1 1-1s1 .448 1 1v5c0 1.105-.895 2-2 2H5c-1.105 0-2-.895-2-2V7z"/>
        </svg>
      </a>
    </div>
  );
}
