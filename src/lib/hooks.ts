import useSWR from 'swr';
import { supabase, getTokenConfigs, TokenConfig } from "./supabase";
import { 
  API_BASE, 
  fetcher, 
  BotStatus, 
  GridStatus, 
  DailyStats, 
  RecentTradesResponse,
  BotSettings
} from './api';

// 5 second polling for status
export function useBotStatus() {
  const { data, error, isLoading, mutate } = useSWR<BotStatus>(
    `${API_BASE}/api/status`,
    fetcher,
    { refreshInterval: 5000 }
  );

  return {
    status: data,
    isLoading,
    isError: error,
    mutate
  };
}

// 5 second polling for active grid token
export function useGridStatus(token: string | null) {
  const { data, error, isLoading, mutate } = useSWR<GridStatus>(
    token ? `${API_BASE}/api/grid/${token}` : null,
    fetcher,
    { refreshInterval: 5000 }
  );

  return {
    grid: data,
    isLoading,
    isError: error,
    mutate
  };
}

// 10 second polling for daily stats
export function useDailyStats() {
  const { data, error, isLoading, mutate } = useSWR<DailyStats>(
    `${API_BASE}/api/stats/daily`,
    fetcher,
    { refreshInterval: 10000 }
  );

  return {
    stats: data,
    isLoading,
    isError: error,
    mutate
  };
}

// 10 second polling for recent trades
export function useRecentTrades(limit: number = 20) {
  const { data, error, isLoading, mutate } = useSWR<RecentTradesResponse>(
    `${API_BASE}/api/trades/recent?limit=${limit}`,
    fetcher,
    { refreshInterval: 10000 }
  );

  return {
    trades: data?.trades || [],
    isLoading,
    isError: error,
    mutate
  };
}

// 5 second polling for multiple grid tokens
export function useAllGrids(tokens: string[]) {
  const { data, error, isLoading, mutate } = useSWR<GridStatus[]>(
    tokens.length > 0 ? ['all-grids', ...tokens] : null,
    () => Promise.all(tokens.map(token => fetcher(`${API_BASE}/api/grid/${token}`))),
    { refreshInterval: 5000 }
  );

  return {
    grids: data || [],
    isLoading,
    isError: error,
    mutate
  };
}

// 60 second polling for price history sparklines
export function usePriceHistory(token: string, hours: number = 24) {
  const { data, error, isLoading, mutate } = useSWR<{ prices: { time: number, value: number }[] }>(
    `${API_BASE}/api/prices/${token}/history?hours=${hours}`,
    fetcher,
    { refreshInterval: 60000, shouldRetryOnError: false }
  );

  return {
    history: data?.prices || [],
    isLoading,
    isError: error,
    mutate
  };
}

export interface MarketData {
  token: string;
  price: number;
  open_24h: number;
  high_24h: number;
  low_24h: number;
  change_24h: number;
  volume_24h: number;
}

export function useMarketData() {
  const { data, error, isLoading, mutate } = useSWR<{ market: Record<string, MarketData> }>(
    '/api/market',
    fetcher,
    { refreshInterval: 60000, shouldRetryOnError: false }
  );

  return {
    market: data?.market || {},
    isLoading,
    isError: error,
    mutate
  };
}

// Polling for full settings configuration page
export function useSettings() {
  const { data, error, isLoading, mutate } = useSWR<BotSettings>(
    `${API_BASE}/api/settings`,
    fetcher,
    { refreshInterval: 0 } // Settings generally don't change on their own, fetch once or mutate manually
  );

  return {
    settings: data,
    isLoading,
    isError: error,
    mutate
  };
}

export function useTokenConfigs(xprAccount: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<TokenConfig[]>(
    xprAccount ? `token-configs-${xprAccount}` : null,
    () => getTokenConfigs(xprAccount!)
  );

  return {
    configs: data || [],
    isLoading,
    isError: error,
    mutate
  };
}

export function useDexStatus() {
  const { data, error, isLoading, mutate } = useSWR<any>(
    `${API_BASE}/api/admin/dex-status`,
    fetcher,
    { refreshInterval: 30000 }
  );

  return {
    dexStatus: data,
    isLoading,
    isError: error,
    mutate
  };
}
