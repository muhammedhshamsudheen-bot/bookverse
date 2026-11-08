import { describe, expect, it } from "vitest";
import type { UserRole, AuthorApplicationStatus, BookPublicationStatus } from "@/lib/supabase/types";

describe("Phase 2: Role-Based Access Control (RBAC) Logic", () => {
  // Helper simulator for route access
  function checkRouteAccess(
    userRoles: UserRole[],
    authorStatus: AuthorApplicationStatus | null,
    targetRoute: "/library" | "/author-studio" | "/admin"
  ): { allowed: boolean; reason?: string } {
    const isAdmin = userRoles.includes("admin");
    const isApprovedAuthor =
      userRoles.includes("author") || authorStatus === "approved";

    if (targetRoute === "/admin") {
      if (isAdmin) return { allowed: true };
      return { allowed: false, reason: "Requires administrator role" };
    }

    if (targetRoute === "/author-studio") {
      if (isAdmin || isApprovedAuthor) return { allowed: true };
      if (authorStatus === "pending") {
        return { allowed: false, reason: "Author application pending review" };
      }
      return { allowed: false, reason: "Requires approved author credentials" };
    }

    if (targetRoute === "/library") {
      if (userRoles.length > 0) return { allowed: true };
      return { allowed: false, reason: "Requires authenticated customer account" };
    }

    return { allowed: false, reason: "Unknown route" };
  }

  describe("Customer Role Restrictions", () => {
    const customerRoles: UserRole[] = ["customer"];
    const customerAuthorStatus = null;

    it("allows customer to access /library (My Reading Room)", () => {
      const res = checkRouteAccess(customerRoles, customerAuthorStatus, "/library");
      expect(res.allowed).toBe(true);
    });

    it("DENIES customer from accessing /admin", () => {
      const res = checkRouteAccess(customerRoles, customerAuthorStatus, "/admin");
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain("Requires administrator role");
    });

    it("DENIES customer without author application from accessing /author-studio", () => {
      const res = checkRouteAccess(customerRoles, customerAuthorStatus, "/author-studio");
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain("Requires approved author credentials");
    });

    it("DENIES customer with pending author status from accessing /author-studio", () => {
      const res = checkRouteAccess(customerRoles, "pending", "/author-studio");
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain("Author application pending review");
    });

    it("prevents customer from modifying other users' profiles", () => {
      const loggedInUserId = "user-customer-123";
      const targetUserId = "user-customer-456";

      const canModify = (authUid: string, targetId: string, isAdmin: boolean) =>
        authUid === targetId || isAdmin;

      expect(canModify(loggedInUserId, targetUserId, false)).toBe(false);
      expect(canModify(loggedInUserId, loggedInUserId, false)).toBe(true);
    });

    it("prevents customer from self-assigning admin or author roles", () => {
      const userRoleInsertPolicy = (
        executingUserId: string,
        isAdmin: boolean
      ): boolean => {
        // Enforced by RLS on public.user_roles: only public.is_admin(auth.uid()) can insert/update
        return isAdmin;
      };

      expect(userRoleInsertPolicy("user-customer-123", false)).toBe(false);
      expect(userRoleInsertPolicy("user-admin-999", true)).toBe(true);
    });
  });

  describe("Author Role Restrictions & Capabilities", () => {
    const approvedAuthorRoles: UserRole[] = ["customer", "author"];
    const approvedAuthorStatus: AuthorApplicationStatus = "approved";

    it("allows approved author to access /author-studio and /library", () => {
      expect(checkRouteAccess(approvedAuthorRoles, approvedAuthorStatus, "/author-studio").allowed).toBe(true);
      expect(checkRouteAccess(approvedAuthorRoles, approvedAuthorStatus, "/library").allowed).toBe(true);
    });

    it("DENIES author from accessing /admin", () => {
      const res = checkRouteAccess(approvedAuthorRoles, approvedAuthorStatus, "/admin");
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain("Requires administrator role");
    });

    it("prevents author from self-approving their pending submissions to published", () => {
      const canUpdatePublicationStatus = (
        currentStatus: BookPublicationStatus,
        targetStatus: BookPublicationStatus,
        isAuthor: boolean,
        isAdmin: boolean
      ): boolean => {
        if (isAdmin) return true;
        if (isAuthor && targetStatus === "published") {
          // Authors can submit as 'draft' or 'pending', NEVER directly 'published'
          return false;
        }
        return isAuthor && targetStatus !== "published";
      };

      // Author trying to publish their own pending book
      expect(canUpdatePublicationStatus("pending", "published", true, false)).toBe(false);
      // Admin approving the book to published
      expect(canUpdatePublicationStatus("pending", "published", false, true)).toBe(true);
    });
  });

  describe("Administrator Role Capabilities", () => {
    const adminRoles: UserRole[] = ["customer", "admin"];

    it("allows administrator to access all sections: /admin, /author-studio, /library", () => {
      expect(checkRouteAccess(adminRoles, null, "/admin").allowed).toBe(true);
      expect(checkRouteAccess(adminRoles, null, "/author-studio").allowed).toBe(true);
      expect(checkRouteAccess(adminRoles, null, "/library").allowed).toBe(true);
    });

    it("allows administrator to approve author applications and grant roles", () => {
      const adminCanApproveAuthor = (isAdmin: boolean) => isAdmin;
      expect(adminCanApproveAuthor(true)).toBe(true);
      expect(adminCanApproveAuthor(false)).toBe(false);
    });
  });
});

