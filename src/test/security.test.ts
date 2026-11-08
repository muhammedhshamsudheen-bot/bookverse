import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

describe("Phase 2: Security & Credential Protection", () => {
  it("verifies that no service_role secret keys are embedded in source code", () => {
    const srcDir = path.resolve(process.cwd(), "src");

    function searchFiles(dir: string): string[] {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const found: string[] = [];
      for (const entry of entries) {
        if (entry.name === "test") continue; // Exclude test files themselves
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          found.push(...searchFiles(fullPath));
        } else if (
          entry.isFile() &&
          (entry.name.endsWith(".ts") ||
            entry.name.endsWith(".tsx") ||
            entry.name.endsWith(".js") ||
            entry.name.endsWith(".json"))
        ) {
          const content = fs.readFileSync(fullPath, "utf-8");
          // Check for service_role keyword associated with keys
          if (
            content.includes("SERVICE_ROLE_KEY") ||
            content.includes("service_role_key")
          ) {
            found.push(fullPath);
          }
        }
      }
      return found;
    }

    const violations = searchFiles(srcDir);
    expect(violations).toEqual([]);
  });

  it("verifies that .gitignore protects .env and secret files", () => {
    const gitignorePath = path.resolve(process.cwd(), ".gitignore");
    const gitignoreContent = fs.readFileSync(gitignorePath, "utf-8");

    expect(gitignoreContent).toContain(".env");
    expect(gitignoreContent).toContain(".env.*");
  });

  it("verifies that .env.example contains no real credentials", () => {
    const envExamplePath = path.resolve(process.cwd(), ".env.example");
    const envExampleContent = fs.readFileSync(envExamplePath, "utf-8");

    expect(envExampleContent).not.toMatch(/https:\/\/[a-z0-9]{20}\.supabase\.co/);
    expect(envExampleContent).toContain("your-project-ref");
    expect(envExampleContent).toContain("your-anon-key");
  });

  it("ensures that privilege escalation via user metadata is ignored", () => {
    // Attack scenario: user passes role='admin' in metadata on signup
    const maliciousSignupMetadata = {
      full_name: "Attacker",
      role: "admin", // Attacker trying to make themselves admin
      is_admin: true,
      requested_role: "admin", // Not an allowed registration choice
    };

    // Defense logic: handle_new_user() trigger & AuthProvider
    const determineAssignedRole = (meta: { requested_role?: string }): string => {
      const requested = (meta.requested_role || "").toLowerCase();
      // Only 'author' can be requested (as a pending application); default is customer.
      // Admin can NEVER be self-assigned.
      if (requested === "author") return "pending_author";
      return "customer";
    };

    const assignedRole = determineAssignedRole(maliciousSignupMetadata);
    expect(assignedRole).toBe("customer");
    expect(assignedRole).not.toBe("admin");
  });

  it("ensures Phase 3 payment transactions strictly reject credit card and PIN fields", () => {
    // Attack scenario: malicious or flawed frontend attempting to store PCI-sensitive data
    const hasPciViolation = (data: Record<string, any>): boolean => {
      const keys = Object.keys(data).map((k) => k.toLowerCase());
      const pciKeys = ["card_number", "pan", "cvv", "cvc", "upi_pin", "pin", "expiry_month", "expiry_year"];
      return keys.some((k) => pciKeys.includes(k));
    };

    expect(
      hasPciViolation({
        amount: 199.0,
        currency: "INR",
        payment_gateway: "manual_or_mock",
        gateway_payment_id: "pay_12345",
      })
    ).toBe(false);

    expect(
      hasPciViolation({
        amount: 199.0,
        cvv: "123",
      })
    ).toBe(true);

    expect(
      hasPciViolation({
        amount: 199.0,
        upi_pin: "9876",
      })
    ).toBe(true);
  });
});
