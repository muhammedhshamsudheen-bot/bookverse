import { useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/lib/supabase/auth-context";
import { setStoredSupabaseConfig } from "@/lib/supabase/client";
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Lock,
  Mail,
  User as UserIcon,
  ExternalLink,
} from "lucide-react";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: "signin" | "register" | "forgot" | "configure";
}

export function AuthDialog({
  open,
  onOpenChange,
  defaultMode = "signin",
}: AuthDialogProps) {
  const { signIn, signUp, resetPasswordForEmail, isConfigured, refreshSession } = useAuth();

  const [mode, setMode] = useState<"signin" | "register" | "forgot" | "configure">(defaultMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [roleInterest, setRoleInterest] = useState<"customer" | "author">("customer");
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Config states
  const [supabaseUrlInput, setSupabaseUrlInput] = useState("");
  const [supabaseKeyInput, setSupabaseKeyInput] = useState("");

  const resetForm = () => {
    setError(null);
    setSuccessMessage(null);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
    setAcceptTerms(false);
    setRoleInterest("customer");
  };

  const handleClose = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      resetForm();
    }
  };

  const handleSaveConfig = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanUrl = supabaseUrlInput.trim();
    const cleanKey = supabaseKeyInput.trim();

    if (!cleanUrl || !cleanKey) {
      setError("Please provide both Supabase Project URL and Anon Public Key.");
      return;
    }

    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      setError("Project URL must start with https://");
      return;
    }

    try {
      setStoredSupabaseConfig(cleanUrl, cleanKey);
      await refreshSession();
      setSuccessMessage("Supabase credentials connected successfully!");
      setTimeout(() => {
        setSuccessMessage(null);
        setMode("signin");
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to save configuration.");
    }
  };

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!isConfigured) {
      setMode("configure");
      return;
    }

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    const { error: signInError } = await signIn(email, password);
    setLoading(false);

    if (signInError) {
      setError(signInError.message || "Failed to sign in. Please check your credentials.");
      return;
    }

    handleClose(false);
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!isConfigured) {
      setMode("configure");
      return;
    }

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!acceptTerms) {
      setError("You must accept the terms and conditions to register.");
      return;
    }

    setLoading(true);
    const { error: signUpError, needsEmailConfirmation } = await signUp({
      email,
      password,
      fullName,
      requestedRole: roleInterest,
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message || "Failed to create account. Please try again.");
      return;
    }

    if (needsEmailConfirmation) {
      setSuccessMessage(
        "Registration successful! Please check your email to verify your account before signing in."
      );
    } else {
      setSuccessMessage("Account created successfully! Welcome to BOOKVERSE.");
      setTimeout(() => {
        handleClose(false);
      }, 1500);
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!isConfigured) {
      setMode("configure");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    const { error: resetError } = await resetPasswordForEmail(email);
    setLoading(false);

    if (resetError) {
      setError(resetError.message || "Failed to send reset email. Please try again.");
      return;
    }

    setSuccessMessage(
      "Password reset instructions have been sent to your email address."
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {mode === "configure"
              ? "Connect Supabase Backend"
              : mode === "signin"
              ? "Welcome back"
              : mode === "register"
              ? "Find your next favourite"
              : "Reset password"}
          </DialogTitle>
          <DialogDescription>
            {mode === "configure"
              ? "Provide your Supabase URL & Anon Key to connect live authentication and PostgreSQL database."
              : mode === "signin"
              ? "Sign in to your BOOKVERSE reading room."
              : mode === "register"
              ? "Create your BOOKVERSE reader or creator account."
              : "Enter your email to receive password reset instructions."}
          </DialogDescription>
        </DialogHeader>

        {!isConfigured && mode !== "configure" && (
          <div className="my-2 rounded-lg border border-primary/20 bg-secondary/60 p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Database className="mt-0.5 size-4 text-primary shrink-0" />
                <div className="text-xs">
                  <p className="font-semibold text-foreground">Supabase Project Required</p>
                  <p className="mt-0.5 text-muted-foreground">
                    Connect your free Supabase URL & Key to enable live sign-in and user library.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 shrink-0 text-xs"
                onClick={() => {
                  setError(null);
                  setSuccessMessage(null);
                  setMode("configure");
                }}
              >
                Connect
              </Button>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="my-2">
            <AlertCircle className="size-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="my-2 border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200">
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
            <AlertDescription className="text-xs">{successMessage}</AlertDescription>
          </Alert>
        )}

        {/* CONFIGURE SUPABASE MODAL */}
        {mode === "configure" && (
          <form onSubmit={handleSaveConfig} className="mt-2 grid gap-4">
            <div className="rounded-lg border border-border bg-card p-3 text-xs leading-5 text-muted-foreground">
              <p className="font-semibold text-foreground">How to get your credentials:</p>
              <ol className="mt-1 list-decimal pl-4 space-y-1">
                <li>
                  Open your{" "}
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 text-primary underline"
                  >
                    Supabase Dashboard <ExternalLink className="size-3" />
                  </a>
                </li>
                <li>Go to <strong>Project Settings → API</strong>.</li>
                <li>Copy <strong>Project URL</strong> and <strong>anon public key</strong>.</li>
              </ol>
            </div>

            <div className="grid gap-1.5 text-sm font-medium">
              <Label htmlFor="cfg-url">Supabase Project URL</Label>
              <Input
                id="cfg-url"
                type="url"
                required
                placeholder="https://xyzproject.supabase.co"
                value={supabaseUrlInput}
                onChange={(e) => setSupabaseUrlInput(e.target.value)}
              />
            </div>

            <div className="grid gap-1.5 text-sm font-medium">
              <Label htmlFor="cfg-key">Supabase Public Anon Key</Label>
              <Input
                id="cfg-key"
                type="password"
                required
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseKeyInput}
                onChange={(e) => setSupabaseKeyInput(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full">
              Connect & Save Credentials
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setError(null);
                setMode("signin");
              }}
            >
              Back to Sign in
            </Button>
          </form>
        )}

        {/* SIGN IN FORM */}
        {mode === "signin" && (
          <form onSubmit={handleSignIn} className="mt-2 grid gap-4">
            <div className="grid gap-1.5 text-sm font-medium">
              <Label htmlFor="signin-email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="signin-email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-1.5 text-sm font-medium">
              <div className="flex items-center justify-between">
                <Label htmlFor="signin-password">Password</Label>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => {
                    setError(null);
                    setSuccessMessage(null);
                    setMode("forgot");
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="signin-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === "register" && (
          <form onSubmit={handleSignUp} className="mt-2 grid gap-4">
            <div className="grid gap-1.5 text-sm font-medium">
              <Label htmlFor="reg-name">Full name</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="reg-name"
                  type="text"
                  required
                  placeholder="Your full name"
                  className="pl-9"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-1.5 text-sm font-medium">
              <Label htmlFor="reg-email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="reg-email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-1.5 text-sm font-medium">
              <Label htmlFor="reg-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="reg-password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-1.5 text-sm font-medium">
              <Label htmlFor="reg-confirm-password">Confirm password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="reg-confirm-password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Re-enter password"
                  className="pl-9"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-1.5 text-sm font-medium">
              <Label htmlFor="reg-role">I am joining as</Label>
              <select
                id="reg-role"
                value={roleInterest}
                onChange={(e) => setRoleInterest(e.target.value as "customer" | "author")}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="customer">A Reader (Customer account)</option>
                <option value="author">An Independent Author (Subject to review)</option>
              </select>
              {roleInterest === "author" && (
                <p className="text-[11px] text-muted-foreground">
                  Author accounts require editorial approval before publishing books.
                </p>
              )}
            </div>

            <div className="flex items-start space-x-2 pt-1">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(Boolean(checked))}
              />
              <label
                htmlFor="terms"
                className="text-xs leading-4 text-muted-foreground"
              >
                I agree to the BOOKVERSE Terms of Service and Privacy Policy.
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === "forgot" && (
          <form onSubmit={handleForgotPassword} className="mt-2 grid gap-4">
            <div className="grid gap-1.5 text-sm font-medium">
              <Label htmlFor="forgot-email">Registered email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="forgot-email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending link..." : "Send reset link"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setError(null);
                setSuccessMessage(null);
                setMode("signin");
              }}
            >
              Back to sign in
            </Button>
          </form>
        )}

        {/* SWITCH MODES */}
        {mode !== "configure" && (
          <div className="mt-4 flex flex-col gap-2 text-center text-xs text-muted-foreground">
            <p>
              {mode === "signin" ? (
                <>
                  New to BOOKVERSE?{" "}
                  <button
                    className="font-semibold text-primary hover:underline"
                    onClick={() => {
                      setError(null);
                      setSuccessMessage(null);
                      setMode("register");
                    }}
                  >
                    Join free
                  </button>
                </>
              ) : mode === "register" ? (
                <>
                  Already have an account?{" "}
                  <button
                    className="font-semibold text-primary hover:underline"
                    onClick={() => {
                      setError(null);
                      setSuccessMessage(null);
                      setMode("signin");
                    }}
                  >
                    Sign in
                  </button>
                </>
              ) : null}
            </p>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-1 text-[11px] text-muted-foreground/80 hover:text-foreground"
              onClick={() => {
                setError(null);
                setSuccessMessage(null);
                setMode("configure");
              }}
            >
              <Database className="size-3" /> Supabase Connection Settings
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
