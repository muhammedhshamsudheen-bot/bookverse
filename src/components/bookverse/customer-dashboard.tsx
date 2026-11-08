import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bookmark,
  BookOpen,
  Check,
  Heart,
  LibraryBig,
  Loader2,
  Mail,
  Phone,
  Settings,
  Sparkles,
  User,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/supabase/auth-context";
import {
  getReadingProgress,
  getFavourites,
  getBookmarks,
  getNotifications,
  updateProfile,
  markNotificationAsRead,
  type ReadingProgressRow,
  type FavouriteRow,
  type BookmarkRow,
  type NotificationRow,
} from "@/lib/supabase/api";
import { books, type Book } from "@/lib/bookverse-data";

export function CustomerDashboard({ onRead }: { onRead: (book: Book) => void }) {
  const { user, profile, isConfigured, refreshSession } = useAuth();

  const [readingList, setReadingList] = useState<ReadingProgressRow[]>([]);
  const [favourites, setFavourites] = useState<FavouriteRow[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkRow[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Edit Profile State
  const [editOpen, setEditOpen] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || "");
  const [preferredLang, setPreferredLang] = useState(profile?.preferred_language || "English");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhoneNumber(profile.phone_number || "");
      setPreferredLang(profile.preferred_language || "English");
    }
  }, [profile]);

  useEffect(() => {
    async function fetchUserData() {
      if (!user || !isConfigured) {
        setLoadingData(false);
        return;
      }

      setLoadingData(true);
      try {
        const [progressRes, favRes, bookmarkRes, notifRes] = await Promise.allSettled([
          getReadingProgress(user.id),
          getFavourites(user.id),
          getBookmarks(user.id),
          getNotifications(user.id),
        ]);

        if (progressRes.status === "fulfilled") setReadingList(progressRes.value);
        if (favRes.status === "fulfilled") setFavourites(favRes.value);
        if (bookmarkRes.status === "fulfilled") setBookmarks(bookmarkRes.value);
        if (notifRes.status === "fulfilled") setNotifications(notifRes.value);
      } catch (err) {
        console.error("Error loading customer data:", err);
      } finally {
        setLoadingData(false);
      }
    }

    void fetchUserData();
  }, [user, isConfigured]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileSuccess(false);

    try {
      await updateProfile(user.id, {
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim() || null,
        preferred_language: preferredLang,
      });
      await refreshSession();
      setProfileSuccess(true);
      setTimeout(() => {
        setEditOpen(false);
        setProfileSuccess(false);
      }, 1000);
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleMarkNotificationRead = async (notifId: string) => {
    try {
      await markNotificationAsRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Reader";

  // Map progress rows to books catalog
  const progressBooks = readingList
    .map((item) => {
      const b = books.find((x) => x.id === item.book_id) || books[0];
      return { ...item, book: b };
    })
    .filter(Boolean);

  // Map favourite rows to books
  const favBooks = favourites
    .map((item) => books.find((x) => x.id === item.book_id))
    .filter((b): b is Book => Boolean(b));

  return (
    <div className="mx-auto min-h-[65vh] max-w-[1380px] px-5 py-10 lg:px-8 lg:py-14">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
            MY BOOKVERSE
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold">
            Welcome back, {displayName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A quiet place for all your saved stories, reading progress, and personal preferences.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={() => setEditOpen(true)}>
            <Settings className="size-4" /> Manage profile
          </Button>
          <Button asChild className="gap-2">
            <Link to="/explore">
              <BookOpen className="size-4" /> Explore catalog
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase">Currently Reading</span>
            <div className="grid size-8 place-items-center rounded-md bg-secondary text-primary">
              <LibraryBig className="size-4" />
            </div>
          </div>
          <span className="mt-3 block font-display text-3xl font-semibold">
            {readingList.length}
          </span>
          <span className="text-xs text-muted-foreground">Active in your room</span>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase">Saved Favourites</span>
            <div className="grid size-8 place-items-center rounded-md bg-secondary text-primary">
              <Heart className="size-4" />
            </div>
          </div>
          <span className="mt-3 block font-display text-3xl font-semibold">
            {favourites.length}
          </span>
          <span className="text-xs text-muted-foreground">Saved for later</span>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase">Bookmarks</span>
            <div className="grid size-8 place-items-center rounded-md bg-secondary text-primary">
              <Bookmark className="size-4" />
            </div>
          </div>
          <span className="mt-3 block font-display text-3xl font-semibold">
            {bookmarks.length}
          </span>
          <span className="text-xs text-muted-foreground">Page markers saved</span>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase">Notifications</span>
            <div className="grid size-8 place-items-center rounded-md bg-secondary text-primary">
              <Bell className="size-4" />
            </div>
          </div>
          <span className="mt-3 block font-display text-3xl font-semibold">
            {notifications.filter((n) => !n.is_read).length}
          </span>
          <span className="text-xs text-muted-foreground">Unread updates</span>
        </div>
      </div>

      {/* Main Tabs Content */}
      <div className="mt-10">
        <Tabs defaultValue="progress" className="w-full">
          <TabsList className="grid w-full grid-cols-4 sm:w-[480px]">
            <TabsTrigger value="progress">Reading</TabsTrigger>
            <TabsTrigger value="favourites">Favourites</TabsTrigger>
            <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
            <TabsTrigger value="notifications">
              Notifications
              {notifications.filter((n) => !n.is_read).length > 0 && (
                <span className="ml-1.5 size-2 rounded-full bg-primary" />
              )}
            </TabsTrigger>
          </TabsList>

          {/* Reading Progress Tab */}
          <TabsContent value="progress" className="mt-6">
            {loadingData ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : progressBooks.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {progressBooks.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 rounded-lg border border-border bg-card p-4 transition hover:border-primary/40"
                  >
                    <img
                      src={item.book.cover}
                      alt={item.book.title}
                      className="h-28 w-20 rounded object-cover"
                    />
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h3 className="line-clamp-1 font-semibold">{item.book.title}</h3>
                        <p className="text-xs text-muted-foreground">{item.book.author}</p>
                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                          <span>Page {item.current_page}</span>
                          <span>{item.progress_percentage}% read</span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full rounded-full bg-secondary">
                          <div
                            className="h-1.5 rounded-full bg-primary"
                            style={{ width: `${item.progress_percentage}%` }}
                          />
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3 h-8 w-fit text-xs"
                        onClick={() => onRead(item.book)}
                      >
                        Continue reading
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-12 text-center">
                <BookOpen className="mx-auto size-8 text-muted-foreground" />
                <h3 className="mt-3 font-semibold">No books in progress</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick a story from our catalog to begin reading.
                </p>
                <Button asChild className="mt-5" size="sm">
                  <Link to="/explore">Explore books</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Favourites Tab */}
          <TabsContent value="favourites" className="mt-6">
            {favBooks.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {favBooks.map((book) => (
                  <div key={book.id} className="rounded-lg border border-border bg-card p-3">
                    <img
                      src={book.cover}
                      alt={book.title}
                      className="aspect-[3/4] w-full rounded object-cover"
                    />
                    <h3 className="mt-2 line-clamp-1 text-sm font-semibold">{book.title}</h3>
                    <p className="text-xs text-muted-foreground">{book.author}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 w-full text-xs"
                      onClick={() => onRead(book)}
                    >
                      Read now
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-12 text-center">
                <Heart className="mx-auto size-8 text-muted-foreground" />
                <h3 className="mt-3 font-semibold">No favourites yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Save stories to your wishlist from the catalog or book details page.
                </p>
                <Button asChild className="mt-5" size="sm">
                  <Link to="/explore">Find stories</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Bookmarks Tab */}
          <TabsContent value="bookmarks" className="mt-6">
            {bookmarks.length > 0 ? (
              <div className="divide-y divide-border rounded-lg border border-border bg-card">
                {bookmarks.map((bm) => {
                  const b = books.find((x) => x.id === bm.book_id) || books[0];
                  return (
                    <div
                      key={bm.id}
                      className="flex items-center justify-between p-4"
                    >
                      <div className="flex items-center gap-3">
                        <Bookmark className="size-4 text-primary" />
                        <div>
                          <p className="text-sm font-semibold">{b.title}</p>
                          <p className="text-xs text-muted-foreground">Page {bm.page_number}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRead(b)}
                      >
                        Jump to book
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-12 text-center">
                <Bookmark className="mx-auto size-8 text-muted-foreground" />
                <h3 className="mt-3 font-semibold">No bookmarks saved</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use the bookmark button in the reading view to mark favourite passages.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-6">
            {notifications.length > 0 ? (
              <div className="divide-y divide-border rounded-lg border border-border bg-card">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start justify-between gap-4 p-4 ${
                      n.is_read ? "opacity-70" : "bg-primary/5"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {!n.is_read && (
                          <span className="size-2 rounded-full bg-primary" />
                        )}
                        <h4 className="text-sm font-semibold">{n.title}</h4>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{n.message}</p>
                      <span className="mt-2 block text-[10px] text-muted-foreground">
                        {new Date(n.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {!n.is_read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs"
                        onClick={() => handleMarkNotificationRead(n.id)}
                      >
                        Mark as read
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-12 text-center">
                <Bell className="mx-auto size-8 text-muted-foreground" />
                <h3 className="mt-3 font-semibold">No notifications</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  You're all caught up with announcements and platform updates.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your account details and reading preferences.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateProfile} className="mt-3 grid gap-4">
            <div className="grid gap-1.5 text-sm">
              <Label htmlFor="prof-name">Full name</Label>
              <Input
                id="prof-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>

            <div className="grid gap-1.5 text-sm">
              <Label htmlFor="prof-phone">Phone number</Label>
              <Input
                id="prof-phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="grid gap-1.5 text-sm">
              <Label htmlFor="prof-lang">Preferred reading language</Label>
              <select
                id="prof-lang"
                value={preferredLang}
                onChange={(e) => setPreferredLang(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="English">English</option>
                <option value="தமிழ்">தமிழ் (Tamil)</option>
              </select>
            </div>

            {profileSuccess && (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <Check className="size-4" /> Profile updated successfully!
              </p>
            )}

            <Button type="submit" disabled={savingProfile} className="mt-2 w-full">
              {savingProfile ? "Saving..." : "Save changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

