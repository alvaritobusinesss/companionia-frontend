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

      // Stripe return guard: if we expect a specific user/email, try to restore the previous session
      try {
        const expectedEmail = localStorage.getItem('expectedEmail') || undefined;
        const expectedUserId = localStorage.getItem('expectedUserId') || undefined;
        const currentEmail = s?.user?.email;
        const currentId = s?.user?.id;
        if ((expectedEmail && currentEmail && expectedEmail !== currentEmail) || (expectedUserId && currentId && expectedUserId !== currentId)) {
          // Try to restore the backup session saved before redirecting to Stripe
          const raw = localStorage.getItem('sessionBackup');
          if (raw) {
            try {
              const { access_token, refresh_token } = JSON.parse(raw) || {};
              if (access_token && refresh_token) {
                const { data: restored } = await supabase.auth.setSession({ access_token, refresh_token });
                if (restored?.session?.user?.email === expectedEmail || restored?.session?.user?.id === expectedUserId) {
                  setSession(restored.session);
                  setUser(restored.session.user);
                  setStatus('authenticated');
                } else {
                  await supabase.auth.signOut();
                  setSession(null);
                  setUser(null);
                  setStatus('unauthenticated');
                }
              } else {
                await supabase.auth.signOut();
                setSession(null);
                setUser(null);
                setStatus('unauthenticated');
              }
            } catch {
              await supabase.auth.signOut();
              setSession(null);
              setUser(null);
              setStatus('unauthenticated');
            }
          } else {
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setStatus('unauthenticated');
          }
        }
        // Clear expectations once checked
        if (expectedEmail) localStorage.removeItem('expectedEmail');
        if (expectedUserId) localStorage.removeItem('expectedUserId');
        if (localStorage.getItem('sessionBackup')) localStorage.removeItem('sessionBackup');
      } catch {}
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
