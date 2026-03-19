"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { API_BASE, fetcher } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  BarChart3, List, Terminal, RefreshCw, TrendingUp, TrendingDown,
  ChevronDown, ArrowDownToLine, Filter
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────

interface Trade {
  id: number;
  token: string;
  buy_price: number;
  sell_price: number;
  amount_token: number;
  profit_usd: number;
  actual_xmd_spent?: number | null;
  actual_xmd_received?: number | null;
  mode: string;
  timestamp: number;
}

interface GridOrder {
  id: number;
  token: string;
  buy_price: number;
  sell_price: number;
  amount_token: number;
  bullet_size_usd: number;
  status: "waiting_buy" | "limit_buy_open" | "waiting_sell" | "limit_sell_open";
  dex_order_id?: number | null;
  actual_xmd_spent?: number | null;
  actual_xmd_received?: number | null;
  created_at: string;
  updated_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────

const fmt = (n: number) =>
  (n >= 0 ? "+" : "") + "$" + Math.abs(n).toFixed(2);

const fmtPrice = (p: number) =>
  p < 0.01 ? p.toFixed(7) : p.toFixed(4);

function groupBy<T>(arr: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const key = keyFn(item);
    (acc[key] = acc[key] || []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

function weekLabel(ts: number): string {
  const d = new Date(ts * 1000);
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay() + 1);
  return start.toISOString().slice(0, 10);
}

function monthLabel(ts: number): string {
  return new Date(ts * 1000).toISOString().slice(0, 7);
}

function dayLabel(ts: number): string {
  return new Date(ts * 1000).toISOString().slice(0, 10);
}

function logColor(line: string): string {
  if (/ERROR/i.test(line)) return "text-red-400";
  if (/WARN/i.test(line)) return "text-orange-400";
  if (/\bBUY\b/i.test(line)) return "text-green-400";
  if (/\bSELL\b/i.test(line)) return "text-orange-300";
  return "text-[var(--text-muted)]";
}

// ── Sub-components ────────────────────────────────────────────────

type PLRange = "daily" | "weekly" | "monthly";

function PLBreakdown({ trades }: { trades: Trade[] }) {
  const [range, setRange] = useState<PLRange>("daily");

  const grouped = trades.reduce((acc, t) => {
    const key =
      range === "daily"
        ? dayLabel(t.timestamp)
        : range === "weekly"
        ? weekLabel(t.timestamp)
        : monthLabel(t.timestamp);

    if (!acc[key]) acc[key] = { live: 0, paper: 0, trades: 0 };
    
    // Calculate actual profit if fields are available, else fallback to theoretical
    const actualProfit = (t.actual_xmd_received !== undefined && t.actual_xmd_received !== null &&
                          t.actual_xmd_spent !== undefined && t.actual_xmd_spent !== null)
      ? (t.actual_xmd_received - t.actual_xmd_spent)
      : t.profit_usd;

    if (t.mode === "live") acc[key].live += actualProfit;
    else acc[key].paper += actualProfit;
    acc[key].trades++;
    return acc;
  }, {} as Record<string, { live: number; paper: number; trades: number }>);

  const rows = Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a));
  const totalLive = rows.reduce((s, [, v]) => s + v.live, 0);
  const totalPaper = rows.reduce((s, [, v]) => s + v.paper, 0);
  const totalTrades = rows.reduce((s, [, v]) => s + v.trades, 0);

  const tabs: { label: string; value: PLRange }[] = [
    { label: "Daily", value: "daily" },
    { label: "Weekly", value: "weekly" },
    { label: "Monthly", value: "monthly" },
  ];

  return (
    <Card className="bg-[var(--bg-card)] border-[var(--border)]">
      <CardHeader className="border-b border-[var(--border)]/50 pb-4">
        <CardTitle className="flex items-center justify-between text-[var(--text-primary)]">
          <span className="flex items-center gap-2">
            <BarChart3 className="size-5 text-[var(--blue)]" />
            P&amp;L Breakdown
          </span>
          <div className="flex bg-[var(--bg-darkest)] rounded-lg p-1 border border-[var(--border)]/50 gap-1">
            {tabs.map((t) => (
              <button
                key={t.value}
                onClick={() => setRange(t.value)}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-bold transition-all",
                  range === t.value
                    ? "bg-[var(--blue)] text-white"
                    : "text-[var(--text-muted)] hover:text-white"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-darkest)] text-[var(--text-muted)] text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Period</th>
              <th className="px-4 py-3 text-right">Live Profit</th>
              <th className="px-4 py-3 text-right">Paper Profit</th>
              <th className="px-4 py-3 text-right">Live Total</th>
              <th className="px-4 py-3 text-right">Trades</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)] text-sm">No trade data available</td>
              </tr>
            )}
            {rows.map(([key, v]) => (
              <tr key={key} className="border-t border-[var(--border)]/30 hover:bg-[var(--bg-elevated)]/30 transition-colors">
                <td className="px-4 py-3 font-mono text-white">{key}</td>
                <td className={cn("px-4 py-3 text-right font-mono", v.live > 0 ? "text-green-400" : v.live < 0 ? "text-red-400" : "text-[var(--text-muted)]")}>
                  {v.live !== 0 ? (
                    <span className="flex items-center justify-end gap-1">
                      <span className="text-[10px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded font-bold">LIVE</span>
                      {fmt(v.live)}
                    </span>
                  ) : "—"}
                </td>
                <td className={cn("px-4 py-3 text-right font-mono", v.paper > 0 ? "text-blue-400" : v.paper < 0 ? "text-red-400" : "text-[var(--text-muted)]")}>
                  {v.paper !== 0 ? (
                    <span className="flex items-center justify-end gap-1">
                      <span className="text-[10px] bg-[var(--bg-elevated)] text-[var(--text-muted)] px-1.5 py-0.5 rounded font-bold">PAPER</span>
                      {fmt(v.paper)}
                    </span>
                  ) : "—"}
                </td>
                <td className={cn("px-4 py-3 text-right font-mono font-bold", v.live >= 0 ? "text-green-400" : "text-red-400")}>
                  {fmt(v.live)}
                </td>
                <td className="px-4 py-3 text-right text-[var(--text-secondary)]">{v.trades}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-[var(--border)] bg-[var(--bg-darkest)]">
            <tr>
              <td className="px-4 py-3 font-bold text-white uppercase text-xs">Total</td>
              <td className={cn("px-4 py-3 text-right font-mono font-bold", totalLive >= 0 ? "text-green-400" : "text-red-400")}>{fmt(totalLive)}</td>
              <td className={cn("px-4 py-3 text-right font-mono font-bold", totalPaper >= 0 ? "text-blue-400" : "text-red-400")}>{fmt(totalPaper)}</td>
              <td className={cn("px-4 py-3 text-right font-mono font-bold text-lg", totalLive >= 0 ? "text-green-400" : "text-red-400")}>{fmt(totalLive)}</td>
              <td className="px-4 py-3 text-right font-bold text-white">{totalTrades}</td>
            </tr>
          </tfoot>
        </table>
      </CardContent>
    </Card>
  );
}

function GridOrdersTable({ orders }: { orders: GridOrder[] }) {
  const [filter, setFilter] = useState("ALL");
  const tokens = ["ALL", ...Array.from(new Set(orders.map((o) => o.token)))];
  const filtered = filter === "ALL" ? orders : orders.filter((o) => o.token === filter);

  // Summary per token — all 4 statuses
  const summary = orders.reduce((acc, o) => {
    if (!acc[o.token]) acc[o.token] = { waiting_buy: 0, limit_buy_open: 0, waiting_sell: 0, limit_sell_open: 0 };
    acc[o.token][o.status] = (acc[o.token][o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, Record<string, number>>);

  return (
    <Card className="bg-[var(--bg-card)] border-[var(--border)]">
      <CardHeader className="border-b border-[var(--border)]/50 pb-4">
        <CardTitle className="flex items-center justify-between text-[var(--text-primary)]">
          <span className="flex items-center gap-2">
            <List className="size-5 text-[var(--blue)]" />
            Raw Grid Orders
          </span>
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-[var(--text-muted)]" />
            <div className="flex bg-[var(--bg-darkest)] rounded-lg p-1 border border-[var(--border)]/50 gap-1">
              {tokens.map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-bold transition-all",
                    filter === t ? "bg-[var(--blue)] text-white" : "text-[var(--text-muted)] hover:text-white"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Summary strip */}
        <div className="px-4 py-3 flex flex-wrap gap-x-6 gap-y-2 bg-[var(--bg-darkest)] border-b border-[var(--border)]/30">
          {Object.entries(summary).map(([token, counts]) => (
            <span key={token} className="text-xs text-[var(--text-secondary)] flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white">{token}:</span>
              <span className="text-green-400">{counts.limit_buy_open ?? 0} limit_buy</span>
              <span className="text-[var(--blue)]/70">{counts.waiting_buy ?? 0} waiting_buy</span>
              <span className="text-orange-400">{counts.limit_sell_open ?? 0} limit_sell</span>
              <span className="text-amber-400/70">{counts.waiting_sell ?? 0} waiting_sell</span>
            </span>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-darkest)] text-[var(--text-muted)] text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Token</th>
                <th className="px-4 py-3 text-right">Buy Price</th>
                <th className="px-4 py-3 text-right">Sell Price</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Bullet $</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-[var(--text-muted)]">No orders found</td></tr>
              )}
              {filtered.map((o) => (
                <tr key={o.id} className="border-t border-[var(--border)]/30 hover:bg-[var(--bg-elevated)]/30 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-[var(--text-muted)] text-xs">{o.id}</td>
                  <td className="px-4 py-2.5 font-bold text-white">{o.token}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-green-400 text-xs">{fmtPrice(o.buy_price)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-orange-400 text-xs">{fmtPrice(o.sell_price)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[var(--text-secondary)] text-xs">{o.amount_token.toFixed(0)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[var(--text-secondary)] text-xs">${o.bullet_size_usd}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={cn(
                      "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                      o.status === "limit_buy_open"
                        ? "bg-green-500/15 text-green-400"
                        : o.status === "waiting_buy" && !o.dex_order_id
                          ? "bg-red-500/15 text-red-400"
                          : o.status === "waiting_buy"
                            ? "bg-blue-500/10 text-blue-400/70"
                            : o.status === "limit_sell_open"
                              ? "bg-orange-500/15 text-orange-400"
                              : "bg-amber-500/10 text-amber-400/70"
                    )}>
                      {o.status === "limit_buy_open" ? "Limit Buy" :
                       o.status === "limit_sell_open" ? "Limit Sell" :
                       o.status === "waiting_buy" && !o.dex_order_id ? "Buy Retry" :
                       o.status === "waiting_buy" ? "Wait Buy" :
                       o.status === "waiting_sell" && !o.dex_order_id ? "Sell Pending" :
                       "Wait Sell"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-[var(--text-muted)] text-xs">{o.updated_at?.slice(0, 16) || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function LogViewer() {
  const [lines, setLines] = useState<string[]>([]);
  const [limit, setLimit] = useState(100);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetcher(`${API_BASE}/api/admin/logs?limit=${limit}`);
      setLines(data.lines || []);
    } catch { }
    finally { setIsLoading(false); }
  }, [limit]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <Card className="bg-[var(--bg-card)] border-[var(--border)]">
      <CardHeader className="border-b border-[var(--border)]/50 pb-4">
        <CardTitle className="flex items-center justify-between text-[var(--text-primary)] flex-wrap gap-3">
          <span className="flex items-center gap-2">
            <Terminal className="size-5 text-[var(--blue)]" />
            Bot Log Viewer
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Limit selector */}
            <div className="relative">
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="appearance-none bg-[var(--bg-darkest)] border border-[var(--border)] rounded-lg px-3 py-1.5 pr-7 text-xs text-white focus:outline-none"
              >
                <option value={50}>50 lines</option>
                <option value={100}>100 lines</option>
                <option value={200}>200 lines</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-[var(--text-muted)] pointer-events-none" />
            </div>
            {/* Auto-refresh toggle */}
            <button
              onClick={() => setAutoRefresh((v) => !v)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5",
                autoRefresh
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : "bg-[var(--bg-darkest)] border-[var(--border)] text-[var(--text-muted)] hover:text-white"
              )}
            >
              <span className={cn("size-1.5 rounded-full", autoRefresh ? "bg-green-400 animate-pulse" : "bg-[var(--text-muted)]")} />
              {autoRefresh ? "Auto ON" : "Auto OFF"}
            </button>
            {/* Manual refresh */}
            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[var(--border)] bg-[var(--bg-darkest)] text-[var(--text-muted)] hover:text-white transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
              Refresh
            </button>
            {/* Scroll to bottom */}
            <button
              onClick={scrollToBottom}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[var(--border)] bg-[var(--bg-darkest)] text-[var(--text-muted)] hover:text-white transition-all flex items-center gap-1.5"
            >
              <ArrowDownToLine className="size-3.5" /> Bottom
            </button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-96 overflow-y-auto bg-[#0a0c12] rounded-b-lg p-4 font-mono text-xs space-y-0.5 scroll-smooth [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[var(--border-active)] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          {lines.length === 0 ? (
            <p className="text-[var(--text-muted)]">No log lines available...</p>
          ) : (
            lines.map((line, i) => (
              <div key={i} className={cn("whitespace-pre-wrap break-all leading-5", logColor(line))}>
                {line}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { session } = useAuth();
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [orders, setOrders] = useState<GridOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session && session.role !== "admin") {
      router.replace("/");
    }
  }, [session, router]);

  useEffect(() => {
    if (!session || session.role !== "admin") return;
    Promise.all([
      fetcher(`${API_BASE}/api/trades/recent?limit=500`),
      fetcher(`${API_BASE}/api/admin/grid-orders`),
    ]).then(([t, o]) => {
      setTrades(t.trades || []);
      setOrders(o.orders || o || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [session]);

  if (!session || session.role !== "admin") return null;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <PageHeader
        title="Analytics"
        description="P&L breakdown, live grid orders, and bot logs — admin only"
      />

      {loading ? (
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-48 animate-pulse bg-[var(--bg-card)] border-[var(--border)]" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <PLBreakdown trades={trades} />
          <GridOrdersTable orders={orders} />
          <LogViewer />
        </div>
      )}
    </div>
  );
}
