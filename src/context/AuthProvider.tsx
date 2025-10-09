import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const hydrate = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const s = data?.session ?? null;
      setSession(s);
      setUser(s?.user ?? null);
      setStatus(s ? 'authenticated' : 'unauthenticated');
    } catch (e) {
      console.warn('AuthProvider hydrate error', e);
      setSession(null);
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    // Initial hydration at mount time
    hydrate();

    // Listen for auth state changes and keep session in sync
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setStatus(newSession ? 'authenticated' : 'unauthenticated');
    });

    return () => {
      try { sub.subscription?.unsubscribe?.(); } catch {}
    };
  }, [hydrate]);

  const value = useMemo<AuthContextValue>(() => ({
    status,
    session,
    user,
    isAuthenticated: status === 'authenticated' && !!user,
    refresh: hydrate,
  }), [status, session, user, hydrate]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
