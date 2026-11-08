import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldAlert, LogIn, Clock3, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/supabase/auth-context";
import type { UserRole } from "@/lib/supabase/types";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  onOpenAuth?: () => void;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  onOpenAuth,
}: ProtectedRouteProps) {
  const { user, roles, authorProfile, isLoading, isAdmin, isAuthor } = useAuth();

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center p-8 text-center">
        <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-sm text-muted-foreground">Verifying secure credentials...</p>
      </div>
    );
  }

  // 1. Not authenticated
  if (!user) {
    return (
      <div className="mx-auto my-12 max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-secondary text-primary">
          <LogIn className="size-6" />
        </div>
        <h2 className="mt-4 font-display text-2xl font-semibold">Sign in required</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You need to be signed in to access this area of BOOKVERSE.
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          {onOpenAuth ? (
            <Button onClick={onOpenAuth} className="w-full">
              Sign in now
            </Button>
          ) : (
            <Button asChild className="w-full">
              <Link to="/">Go to Homepage to Sign In</Link>
            </Button>
          )}
          <Button asChild variant="outline" className="w-full">
            <Link to="/explore">Browse Free Books</Link>
          </Button>
        </div>
      </div>
    );
  }

  // 2. Role verification
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = allowedRoles.some((role) => {
      if (role === "admin") return isAdmin;
      if (role === "author") return isAuthor || isAdmin;
      return roles.includes(role);
    });

    if (!hasRole) {
      // Special case: Author studio access check
      if (allowedRoles.includes("author") && !isAuthor) {
        const isPending = authorProfile?.application_status === "pending";
        const isRejected = authorProfile?.application_status === "rejected";

        if (isPending) {
          return (
            <div className="mx-auto my-12 max-w-md rounded-xl border border-amber-500/30 bg-amber-500/5 p-8 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-amber-500/20 text-amber-600">
                <Clock3 className="size-6" />
              </div>
              <h2 className="mt-4 font-display text-2xl font-semibold">
                Application Pending Review
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your author application is currently under editorial review. You will receive a
                notification as soon as your author privileges are activated.
              </p>
              <div className="mt-6">
                <Button asChild variant="outline">
                  <Link to="/library">Return to My Library</Link>
                </Button>
              </div>
            </div>
          );
        }

        if (isRejected) {
          return (
            <div className="mx-auto my-12 max-w-md rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-destructive/20 text-destructive">
                <AlertCircle className="size-6" />
              </div>
              <h2 className="mt-4 font-display text-2xl font-semibold">
                Application Not Approved
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {authorProfile.rejection_reason ||
                  "Your author application was reviewed and could not be approved at this time."}
              </p>
              <div className="mt-6">
                <Button asChild variant="outline">
                  <Link to="/library">Return to My Library</Link>
                </Button>
              </div>
            </div>
          );
        }
      }

      // Forbidden
      return (
        <div className="mx-auto my-12 max-w-md rounded-xl border border-destructive/30 bg-card p-8 text-center shadow-sm">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="size-6" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-semibold">Access Restricted</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You do not have the required permissions ({allowedRoles.join(" or ")}) to access this
            page.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link to="/library">Go to Your Reading Room</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}

