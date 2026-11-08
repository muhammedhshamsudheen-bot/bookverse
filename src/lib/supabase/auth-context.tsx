import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "./client";
import {
  getProfile,
  getUserRoles,
  getAuthorByUserId,
  type ProfileRow,
  type AuthorRow,
} from "./api";
import type { UserRole } from "./types";

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: ProfileRow | null;
  roles: UserRole[];
  authorProfile: AuthorRow | null;
  isCustomer: boolean;
  isAuthor: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (params: {
    email: string;
    password: string;
    fullName: string;
    requestedRole?: "customer" | "author";
  }) => Promise<{ error: Error | null; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [authorProfile, setAuthorProfile] = useState<AuthorRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isConfigured = isSupabaseConfigured();

  const loadUserData = useCallback(async (currentUser: User) => {
    try {
      // 1. Fetch profile
      try {
        const userProfile = await getProfile(currentUser.id);
        setProfile(userProfile);
      } catch (err) {
        console.warn("Could not fetch user profile:", err);
      }

      // 2. Fetch user roles
      try {
        const userRoles = await getUserRoles(currentUser.id);
        setRoles(userRoles.length > 0 ? userRoles : ["customer"]);
      } catch (err) {
        console.warn("Could not fetch user roles:", err);
        setRoles(["customer"]);
      }

      // 3. Fetch author record if exists
      try {
        const author = await getAuthorByUserId(currentUser.id);
        setAuthorProfile(author);
      } catch (err) {
        console.warn("Could not fetch author profile:", err);
      }
    } catch (err) {
      console.error("Error loading user data:", err);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
        setUser(null);
        setSession(null);
        setProfile(null);
        setRoles([]);
        setAuthorProfile(null);
        return;
      }

      setSession(data.session);
      setUser(data.session?.user ?? null);

      if (data.session?.user) {
        await loadUserData(data.session.user);
      } else {
        setProfile(null);
        setRoles([]);
        setAuthorProfile(null);
      }
    } catch (err) {
      console.error("Error refreshing session:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured, loadUserData]);

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    // Initial session load
    void refreshSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await loadUserData(newSession.user);
      } else {
        setProfile(null);
        setRoles([]);
        setAuthorProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isConfigured, refreshSession, loadUserData]);

  const signIn = async (email: string, password: string) => {
    if (!isConfigured) {
      return {
        error: new Error(
          "Supabase backend is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file."
        ),
      };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { error };
      }

      await refreshSession();
      return { error: null };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const signUp = async ({
    email,
    password,
    fullName,
    requestedRole = "customer",
  }: {
    email: string;
    password: string;
    fullName: string;
    requestedRole?: "customer" | "author";
  }) => {
    if (!isConfigured) {
      return {
        error: new Error(
          "Supabase backend is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file."
        ),
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            requested_role: requestedRole,
          },
        },
      });

      if (error) {
        return { error };
      }

      // Check if user confirmed or needs verification
      const needsEmailConfirmation = !data.session;
      await refreshSession();
      return { error: null, needsEmailConfirmation };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const signOut = async () => {
    if (!isConfigured) {
      setUser(null);
      setSession(null);
      setProfile(null);
      setRoles([]);
      setAuthorProfile(null);
      return;
    }

    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error during sign out:", err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setRoles([]);
      setAuthorProfile(null);
    }
  };

  const resetPasswordForEmail = async (email: string) => {
    if (!isConfigured) {
      return {
        error: new Error(
          "Supabase backend is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file."
        ),
      };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined,
      });
      return { error };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const isAdmin = roles.includes("admin");
  const isAuthor =
    roles.includes("author") ||
    (authorProfile !== null && authorProfile.application_status === "approved");
  const isCustomer = roles.includes("customer") || (!isAdmin && !isAuthor && user !== null);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        authorProfile,
        isCustomer,
        isAuthor,
        isAdmin,
        isLoading,
        isConfigured,
        signIn,
        signUp,
        signOut,
        resetPasswordForEmail,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

