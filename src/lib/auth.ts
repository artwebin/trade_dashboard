import { supabase, UserProfile } from "./supabase";

const SESSION_KEY = "metalx_session";
const SESSION_COOKIE = "metalx_actor";

export interface AuthSession {
  actor: string;
  permission: string;
  role: "admin" | "user";
  display_name: string | null;
  loginAt: number;
}

// ──── localStorage helpers ────────────────────────────────────

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    // Expire after 7 days
    if (Date.now() - session.loginAt > 7 * 24 * 60 * 60 * 1000) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  // Also store a short cookie so middleware can read it
  document.cookie = `${SESSION_COOKIE}=${session.actor}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
}

// ──── Supabase lookup ─────────────────────────────────────────

export async function lookupUser(xprAccount: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("xpr_account", xprAccount)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;
  return data as UserProfile;
}

export async function updateLastLogin(xprAccount: string) {
  await supabase
    .from("users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("xpr_account", xprAccount);
}
