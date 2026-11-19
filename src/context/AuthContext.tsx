"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { isAuthError, type Session, type SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

export function authErrorMessage(error: unknown) {
  if (isAuthError(error)) {
    if (error.status === 429) return "Слишком много попыток. Немного подожди и попробуй снова.";
    if (error.code === "invalid_credentials") return "Не удалось войти. Проверь почту и пароль.";
    if (error.code === "email_not_confirmed") return "Сначала подтверди почту по ссылке из письма.";
    if (error.code === "user_already_exists") return "Такая почта уже зарегистрирована. Попробуй войти.";
    if (error.code === "weak_password") return "Придумай более надёжный пароль: минимум 8 символов.";
  }
  return "Не удалось связаться с сервисом входа. Проверь интернет и попробуй снова.";
}

interface AuthValue {
  client: SupabaseClient<Database> | null;
  user: Session["user"] | null;
  isLoading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [connection] = useState(() => {
    try {
      return { client: getSupabaseConfig() ? createClient() : null, error: null };
    } catch (error) {
      return { client: null, error: error instanceof Error ? error.message : "Проверь настройки Supabase." };
    }
  });
  const [auth, setAuth] = useState<{ session: Session | null; isLoading: boolean; error: string | null }>({
    session: null, isLoading: Boolean(connection.client), error: null,
  });
  useEffect(() => {
    const client = connection.client;
    if (!client) return;
    let active = true;
    let changed = false;
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (event !== "INITIAL_SESSION") changed = true;
      if (active) setAuth({ session, isLoading: false, error: null });
    });
    void client.auth.getSession().then(({ data, error }) => {
      if (active && !changed) setAuth({ session: data.session, isLoading: false, error: error ? authErrorMessage(error) : null });
    }).catch((error: unknown) => {
      if (active && !changed) setAuth({ session: null, isLoading: false, error: authErrorMessage(error) });
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [connection.client]);

  async function signOut() {
    if (!connection.client) throw new Error("Supabase не настроен.");
    const { error } = await connection.client.auth.signOut({ scope: "local" });
    if (error) throw error;
  }

  return (
    <AuthContext.Provider value={{
      client: connection.client, user: auth.session?.user ?? null,
      isLoading: auth.isLoading, error: connection.error ?? auth.error, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
