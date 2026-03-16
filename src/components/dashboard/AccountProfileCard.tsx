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

function TokenIcon({ symbol, icon, bg, color }: { symbol: string; icon: string; bg: string; color: string }) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <div
        className="size-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
        style={{ background: bg, color }}
      >
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
        const liquidXpr = await fetchBalance("eosio.token", "XPR");

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
    const interval = setInterval(run, 3600_000); // 1 hour
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [actor]);

  const initial = actor ? actor[0].toUpperCase() : "?";

  const tokens = [
    { symbol: "XPR",   amount: balances.xpr,   color: "var(--blue)",   bg: "rgba(59,130,246,0.15)",  icon: "/icons/xpr.png"   },
    { symbol: "METAL", amount: balances.metal, color: "var(--orange)", bg: "rgba(251,146,60,0.15)",  icon: "/icons/metal.png" },
    { symbol: "LOAN",  amount: balances.loan,  color: "var(--green)",  bg: "rgba(0,214,143,0.15)",   icon: "/icons/loan.png"  },
    { symbol: "XMD",   amount: balances.xmd,   color: "#a78bfa",       bg: "rgba(167,139,250,0.15)", icon: "/icons/xmd.png"   },
  ];

  return (
    <div className="rounded-xl h-full border border-[var(--border)]/50 shadow-sm bg-[var(--bg-card)]">
      <div className="p-6 flex flex-col gap-5 h-full">

        {/* Account Header */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {!avatarError && avatarSrc ? (
              <img
                src={avatarSrc}
                alt={actor}
                onError={() => setAvatarError(true)}
                className="size-14 rounded-full object-cover border-2 border-orange-500/50"
              />
            ) : (
              <div className="size-14 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-white font-black text-2xl border-2 border-orange-400/40">
                {initial}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="font-bold text-white text-base truncate flex items-center gap-1.5">
              {actor}
              <img src="/icons/proton-verified.svg" alt="Verified" className="size-4 shrink-0" />
            </div>
            <span className="inline-block text-xs font-semibold tracking-widest uppercase px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/40 mt-1">
              {session?.role ?? "user"}
            </span>
          </div>
        </div>

        {/* Token Balances — 2×2 grid */}
        <div className="flex-1">
          <p className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase mb-2">Token Balances</p>
          <div className="grid grid-cols-2 gap-2">
            {loading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="h-14 rounded-lg bg-[var(--bg-card)] animate-pulse" />
              ))
            ) : (
              tokens.map(({ symbol, amount, color, bg, icon }) => (
                <div
                  key={symbol}
                  className="flex flex-col gap-1.5 px-3 py-2.5 rounded-lg bg-[var(--bg-card)] border border-white/10 hover:border-orange-500/60 transition-colors shadow-sm"
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
          className="text-xs text-[var(--text-muted)] hover:text-orange-400 transition-colors flex items-center gap-1"
        >
          <span>View on XPR Explorer</span>
          <svg viewBox="0 0 24 24" className="size-3 fill-current">
            <path d="M14 5c0-.552.448-1 1-1h5c.552 0 1 .448 1 1v5c0 .552-.448 1-1 1s-1-.448-1-1V7.414l-9.293 9.293c-.391.391-1.023.391-1.414 0s-.391-1.023 0-1.414L17.586 6H15c-.552 0-1-.448-1-1z"/>
            <path d="M3 7c0-1.105.895-2 2-2h5c.552 0 1 .448 1 1s-.448 1-1 1H5v12h12v-5c0-.552.448-1 1-1s1 .448 1 1v5c0 1.105-.895 2-2 2H5c-1.105 0-2-.895-2-2V7z"/>
          </svg>
        </a>

      </div>
    </div>
  );
}
