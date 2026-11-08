import { describe, expect, it } from "vitest";
import { supabase, isSupabaseConfigured, getSupabaseConfig } from "@/lib/supabase/client";

describe("Phase 2: Live Supabase Backend Connection Test", () => {
  it("verifies that Supabase is properly configured via .env", () => {
    expect(isSupabaseConfigured()).toBe(true);
    const config = getSupabaseConfig();
    expect(config.url).toBe("https://xcwhwkbyhkxtmelclpgr.supabase.co");
    expect(config.anonKey).toBe("sb_publishable_tYYljRePNaL18BDGI5AUIA_-UsIXFnI");
  });

  it("successfully reaches the Supabase project Auth service with HTTP 200", async () => {
    const config = getSupabaseConfig();
    const response = await fetch(`${config.url}/auth/v1/settings`, {
      method: "GET",
      headers: {
        apikey: config.anonKey,
      },
    });

    expect(response.status).toBe(200);
    const settings = await response.json();
    expect(settings).toBeDefined();
    expect(settings.external).toHaveProperty("email");
    expect(settings.disable_signup).toBe(false);
  }, 15000);

  it("successfully connects via Supabase client and checks session", async () => {
    const { data, error } = await supabase.auth.getSession();
    expect(error).toBeNull();
    expect(data).toHaveProperty("session");
  });

  it("ensures publishable key is used and service role key is NEVER exposed", () => {
    const config = getSupabaseConfig();
    expect(config.anonKey).toMatch(/^sb_publishable_/);
    expect(config.anonKey).not.toContain("service_role");
  });
});
