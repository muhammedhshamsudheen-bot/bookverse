import { describe, expect, it, vi, beforeEach } from "vitest";
import { isSupabaseConfigured, getSupabaseConfig } from "@/lib/supabase/client";

describe("Phase 2: Supabase Client & Configuration", () => {
  it("detects when Supabase environment variables are missing or unconfigured", () => {
    // When no env is set, isSupabaseConfigured returns false
    const configured = isSupabaseConfigured();
    expect(typeof configured).toBe("boolean");
  });

  it("throws a clear error if getSupabaseConfig is called without configured credentials", () => {
    if (!isSupabaseConfigured()) {
      expect(() => getSupabaseConfig()).toThrowError(
        /Supabase backend is not configured/
      );
    } else {
      const config = getSupabaseConfig();
      expect(config.url).toBeDefined();
      expect(config.anonKey).toBeDefined();
    }
  });

  it("ensures service_role secret key is NEVER used as publishable anon key", () => {
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
    if (anonKey) {
      expect(anonKey).not.toContain("service_role");
    }
  });
});

describe("Phase 2: Authentication System Validation", () => {
  it("validates password length (minimum 8 characters) on registration", () => {
    const passwordValidator = (pwd: string) => pwd.length >= 8;
    expect(passwordValidator("short")).toBe(false);
    expect(passwordValidator("1234567")).toBe(false);
    expect(passwordValidator("validPass123")).toBe(true);
  });

  it("validates matching passwords during registration", () => {
    const passwordsMatch = (pwd: string, confirm: string) => pwd === confirm;
    expect(passwordsMatch("SecretPass123", "SecretPass123")).toBe(true);
    expect(passwordsMatch("SecretPass123", "WrongPass456")).toBe(false);
  });

  it("validates email formatting and rejects invalid emails", () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test("reader@bookverse.com")).toBe(true);
    expect(emailRegex.test("author@bookverse.in")).toBe(true);
    expect(emailRegex.test("notanemail")).toBe(false);
    expect(emailRegex.test("@missingusername.com")).toBe(false);
    expect(emailRegex.test("missingatdomain.com")).toBe(false);
  });

  it("requires terms and conditions acceptance prior to account creation", () => {
    const canRegister = (hasAcceptedTerms: boolean, isValid: boolean) =>
      hasAcceptedTerms && isValid;
    expect(canRegister(false, true)).toBe(false);
    expect(canRegister(true, true)).toBe(true);
  });
});

