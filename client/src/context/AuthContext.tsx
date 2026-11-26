/** Authentication state: Supabase sessions when configured, isolated demo sessions otherwise. */
import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setTokenProvider } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { safeStorage } from '@/lib/utils';

interface AuthState {
  ready: boolean;
  isAuthed: boolean;
  isDemo: boolean;
  email: string | null;
  supabaseEnabled: boolean;
  signIn(email: string, password: string): Promise<string | null>;
  signUp(email: string, password: string): Promise<{ error: string | null; needsConfirmation: boolean }>;
  startDemo(): void;
  signOut(): Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);
const DEMO_KEY = 'bw.demoId';

const newDemoId = () => `demo-${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [demoId, setDemoId] = useState<string | null>(() => safeStorage.get<string | null>(DEMO_KEY, null, globalThis.sessionStorage));
  const [ready, setReady] = useState(!supabase);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setTokenProvider(async () => session?.access_token ?? demoId);
  }, [session, demoId]);

  const startDemo = useCallback(() => {
    const id = demoId ?? newDemoId();
    safeStorage.set(DEMO_KEY, id, globalThis.sessionStorage);
    setDemoId(id);
  }, [demoId]);

  const value = useMemo<AuthState>(
    () => ({
      ready,
      isAuthed: Boolean(session || demoId),
      isDemo: !session && Boolean(demoId),
      email: session?.user.email ?? null,
      supabaseEnabled: Boolean(supabase),
      async signIn(email, password) {
        if (!supabase) return 'Sign-in is not configured on this deployment. Use the demo session instead.';
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error ? error.message : null;
      },
      async signUp(email, password) {
        if (!supabase)
          return { error: 'Sign-up is not configured on this deployment. Use the demo session instead.', needsConfirmation: false };
        const { data, error } = await supabase.auth.signUp({ email, password });
        return { error: error?.message ?? null, needsConfirmation: !error && !data.session };
      },
      startDemo,
      async signOut() {
        if (supabase) await supabase.auth.signOut();
        safeStorage.remove(DEMO_KEY, globalThis.sessionStorage);
        setDemoId(null);
        setSession(null);
      },
    }),
    [ready, session, demoId, startDemo],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>');
  return v;
}
