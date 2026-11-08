import { Link, useNavigate } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/supabase/auth-context";
import {
  BookOpen,
  Feather,
  LibraryBig,
  LogOut,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";

export function UserNav() {
  const { user, profile, roles, isAuthor, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const displayName = profile?.full_name || user.email?.split("@")[0] || "Reader";
  const userEmail = user.email || "";

  const handleSignOut = async () => {
    await signOut();
    void navigate({ to: "/" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary"
        >
          <div className="grid size-6 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <span className="max-w-[100px] truncate font-medium">{displayName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
            <div className="flex flex-wrap gap-1 pt-1.5">
              {isAdmin && (
                <Badge variant="default" className="text-[10px] uppercase">
                  Admin
                </Badge>
              )}
              {isAuthor && (
                <Badge variant="secondary" className="text-[10px] uppercase">
                  Author
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px] uppercase">
                Customer
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link to="/library" className="flex cursor-pointer items-center gap-2">
            <LibraryBig className="size-4 text-muted-foreground" />
            <span>My Library</span>
          </Link>
        </DropdownMenuItem>

        {(isAuthor || isAdmin) && (
          <DropdownMenuItem asChild>
            <Link to="/author-studio" className="flex cursor-pointer items-center gap-2">
              <Feather className="size-4 text-muted-foreground" />
              <span>Author Studio</span>
            </Link>
          </DropdownMenuItem>
        )}

        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link to="/admin" className="flex cursor-pointer items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              <span className="font-semibold text-primary">Admin Control</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem asChild>
          <Link to="/explore" className="flex cursor-pointer items-center gap-2">
            <BookOpen className="size-4 text-muted-foreground" />
            <span>Browse Catalog</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="size-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

