// In production: route through Next.js proxy to avoid HTTPS→HTTP Mixed Content
// Proxy at /api/proxy/[...path] forwards verbatim: /api/proxy/api/status → http://bot/api/status
const isDev = process.env.NODE_ENV === "development";
export const API_BASE = isDev
  ? (process.env.NEXT_PUBLIC_API_URL || "http://46.4.229.254:8000")
  : "/api/proxy";


export const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('An error occurred while fetching the data.');
  }
  return res.json();
};

export interface BotStatus {
  mode: "paper" | "live";
  grid_paused: boolean;
  grid_tokens: Record<string, {
    active: boolean;
    grid_status: string;
    bullets_buy: number;
    bullets_sell: number;
    today_profit: number;
    current_price: number;
  }>;
  swing_tokens: string[];
  max_exposure_usd: number;
  timestamp: number;
  bot_started_at: number;
  api_started_at: number;
}

export interface GridOrder {
  id: number;
  buy_price: number;
  sell_price: number;
  amount_token: number;
  bullet_size_usd: number;
  status: "waiting_buy" | "waiting_sell";
  created_at: number;
  updated_at: number;
}

export interface GridStatus {
  token: string;
  current_price: number;
  grid_active: boolean;
  bullets_waiting_buy: number;
  bullets_waiting_sell: number;
  total_bullets: number;
  today_profit_usd: number;
  total_profit_usd: number;
  trades_today: number;
  paused: boolean;
  pause_reason: string;
  orders: GridOrder[];
}

export interface DailyStats {
  date: string;
  today_profit_usd: number;
  today_trades: number;
  total_profit_usd: number;
  mode: "paper" | "live";
}

export interface RecentTrade {
  id: number;
  token: string;
  buy_price: number;
  sell_price: number;
  amount_token: number;
  profit_usd: number;
  mode: string;
  timestamp: number;
}

export interface RecentTradesResponse {
  trades: RecentTrade[];
}

export interface StartGridParams {
  token: string;
  step_percent: number;
  bullet_size_usd: number;
  max_bullets: number;
}

export async function startGrid(params: StartGridParams) {
  const res = await fetch(`${API_BASE}/api/grid/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to start grid');
  }
  return res.json();
}

export async function stopGrid(token: string) {
  const res = await fetch(`${API_BASE}/api/grid/${token}/stop`, {
    method: 'POST',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to stop grid');
  }
  return res.json();
}

export interface BotSettings {
  bot_mode: "paper" | "live";
  grid_tokens: string;
  swing_tokens: string;
  grid_step_percent: number;
  grid_bullet_size_usd: number;
  grid_max_bullets: number;
  max_total_exposure_usd: number;
  stop_loss_percent: number;
  watchtower_api_url: string;
  xpr_rpc_url: string;
  xpr_account: string;
  xpr_private_key_set: boolean;
  xpr_private_key_masked: string;
  telegram_bot_token_set: boolean;
  telegram_chat_id: string;
  log_level: string;
}

export async function updateSettingsGrid(params: {
  step_percent?: number;
  bullet_size_usd?: number;
  max_bullets?: number;
  max_total_exposure_usd?: number;
  stop_loss_percent?: number;
  grid_tokens?: string;
}) {
  const res = await fetch(`${API_BASE}/api/settings/grid`, { 
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to update grid settings');
  }
  return res.json();
}

export async function updateSettingsCredentials(xpr_account: string, xpr_private_key: string) {
  const res = await fetch(`${API_BASE}/api/settings/credentials`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ xpr_account, xpr_private_key }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to update credentials');
  }
  return res.json();
}

export async function updateSettingsTelegram(bot_token: string, chat_id: string) {
  const res = await fetch(`${API_BASE}/api/settings/telegram`, { 
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bot_token, chat_id })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to update telegram settings');
  }
  return res.json();
}

export async function updateMode(mode: "paper" | "live") {
  const res = await fetch(`${API_BASE}/api/settings/mode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to switch mode (missing credentials?)');
  }
  return res.json();
}

export async function restartBot() {
  const res = await fetch(`${API_BASE}/api/settings/restart`, { method: 'POST' });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to restart bot');
  }
  return res.json();
}
