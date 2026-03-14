"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getSession, saveSession, clearSession, lookupUser, updateLastLogin, AuthSession } from "@/lib/auth";

interface AuthContextType {
  session: AuthSession | null;
  isLoading: boolean;
  login: (actor: string, permission: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
  login: async () => ({ success: false }),
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session on mount
    const stored = getSession();
    setSession(stored);
    setIsLoading(false);
  }, []);

  const login = async (actor: string, permission: string) => {
    // Check Supabase for user record
    const userProfile = await lookupUser(actor);
    
    if (!userProfile) {
      return { 
        success: false, 
        error: `Account @${actor} does not have access to this dashboard.` 
      };
    }

    if (!userProfile.is_active) {
      return { 
        success: false, 
        error: `Account @${actor} has been deactivated.` 
      };
    }

    const newSession: AuthSession = {
      actor,
      permission,
      role: userProfile.role,
      display_name: userProfile.display_name,
      loginAt: Date.now(),
    };

    saveSession(newSession);
    setSession(newSession);
    
    // Log last login timestamp async (don't await)
    updateLastLogin(actor).catch(console.error);
    
    return { success: true };
  };

  const logout = () => {
    clearSession();
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
