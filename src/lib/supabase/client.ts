import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Provide a safe WebSocket stub in Node SSR to prevent RealtimeClient constructor errors
if (typeof window === "undefined" && typeof (globalThis as any).WebSocket === "undefined") {
  class SsrWebSocketStub {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;
    readyState = 3;
    onopen = null;
    onclose = null;
    onerror = null;
    onmessage = null;
    constructor() {}
    send() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  }
  (globalThis as any).WebSocket = SsrWebSocketStub;
}

export function getActiveSupabaseConfig(): { url: string; anonKey: string } | null {
  const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const envAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_KEY) as string | undefined;

  let url = envUrl;
  let anonKey = envAnonKey;

  if (typeof window !== "undefined") {
    const storedUrl = window.localStorage.getItem("BOOKVERSE_SUPABASE_URL");
    const storedAnon = window.localStorage.getItem("BOOKVERSE_SUPABASE_ANON_KEY");
    if (storedUrl && storedAnon) {
      url = storedUrl;
      anonKey = storedAnon;
    }
  }

  if (!url || !anonKey) {
    return null;
  }

  // Check for dummy placeholder strings
  if (
    url.includes("your-project-ref") ||
    url.includes("your-project-id") ||
    anonKey.includes("your-anon-key")
  ) {
    return null;
  }

  return { url, anonKey };
}

export function setStoredSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("BOOKVERSE_SUPABASE_URL", url.trim());
    window.localStorage.setItem("BOOKVERSE_SUPABASE_ANON_KEY", anonKey.trim());
    clientInstance = null; // Recreate client with new credentials
  }
}

export function clearStoredSupabaseConfig(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("BOOKVERSE_SUPABASE_URL");
    window.localStorage.removeItem("BOOKVERSE_SUPABASE_ANON_KEY");
    clientInstance = null;
  }
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getActiveSupabaseConfig());
}

export function getSupabaseConfig(): { url: string; anonKey: string } {
  const config = getActiveSupabaseConfig();
  if (!config) {
    throw new Error(
      "Supabase backend is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file or connect your credentials in the app."
    );
  }
  return config;
}

let clientInstance: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  const config = getActiveSupabaseConfig();
  const url = config ? config.url : "https://unconfigured-bookverse.supabase.co";
  const anonKey = config ? config.anonKey : "unconfigured-anon-key";

  if (clientInstance) {
    return clientInstance;
  }

  const isBrowser = typeof window !== "undefined";

  clientInstance = createClient<Database>(url, anonKey, {
    auth: {
      persistSession: isBrowser,
      autoRefreshToken: isBrowser,
      detectSessionInUrl: isBrowser,
      storage: isBrowser ? window.localStorage : undefined,
    },
  });

  return clientInstance;
}

export const supabase = getSupabaseClient();
