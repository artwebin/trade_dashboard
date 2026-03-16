import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UserProfile {
  id: string;
  xpr_account: string;
  role: "admin" | "user";
  display_name: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface TokenConfig {
  id: string;
  xpr_account: string;
  symbol: string;
  enabled: boolean;
  updated_at: string;
}

export async function getTokenConfigs(xprAccount: string): Promise<TokenConfig[]> {
  const { data, error } = await supabase
    .from("token_config")
    .select("*")
    .eq("xpr_account", xprAccount);

  if (error) {
    console.error("Error fetching token configs:", error);
    return [];
  }
  return data as TokenConfig[];
}

export async function upsertTokenConfig(xprAccount: string, symbol: string, enabled: boolean) {
  const { error } = await supabase
    .from("token_config")
    .upsert(
      { xpr_account: xprAccount, symbol, enabled, updated_at: new Date().toISOString() },
      { onConflict: "xpr_account,symbol" }
    );

  if (error) {
    console.error("Error upserting token config:", error);
    throw error;
  }
}
