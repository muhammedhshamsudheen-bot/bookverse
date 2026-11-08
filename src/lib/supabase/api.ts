import { supabase, isSupabaseConfigured } from "./client";
import type {
  Database,
  UserRole,
  AuthorApplicationStatus,
  BookAccessType,
  BookPublicationStatus,
} from "./types";

type Tables = Database["public"]["Tables"];
export type ProfileRow = Tables["profiles"]["Row"];
export type UserRoleRow = Tables["user_roles"]["Row"];
export type AuthorRow = Tables["authors"]["Row"];
export type CategoryRow = Tables["book_categories"]["Row"];
export type BookRow = Tables["books"]["Row"];
export type ReadingProgressRow = Tables["reading_progress"]["Row"];
export type BookmarkRow = Tables["bookmarks"]["Row"];
export type FavouriteRow = Tables["favourites"]["Row"];
export type NotificationRow = Tables["notifications"]["Row"];
export type PurchaseRow = Tables["purchases"]["Row"];
export type SubscriptionRow = Tables["subscriptions"]["Row"];
export type AuthorSubmissionRow = Tables["author_submissions"]["Row"];
export type PaymentTransactionRow = Tables["payment_transactions"]["Row"];

function ensureConfigured() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment (.env)."
    );
  }
}

// ============================================================================
// Profiles API
// ============================================================================
export async function getProfile(userId: string): Promise<ProfileRow | null> {
  ensureConfigured();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching profile:", error);
    throw error;
  }
  return data;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Tables["profiles"]["Update"]>
): Promise<ProfileRow> {
  ensureConfigured();
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
  return data;
}

// ============================================================================
// Roles API
// ============================================================================
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  ensureConfigured();
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching user roles:", error);
    return ["customer"];
  }
  return data.map((r) => r.role as UserRole);
}

export async function getAllUserRoles(): Promise<
  Array<{ id: string; user_id: string; role: UserRole; email?: string; full_name?: string }>
> {
  ensureConfigured();
  const { data, error } = await supabase
    .from("user_roles")
    .select("id, user_id, role, profiles(email, full_name)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all user roles:", error);
    throw error;
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    role: row.role as UserRole,
    email: row.profiles?.email,
    full_name: row.profiles?.full_name,
  }));
}

export async function assignUserRole(userId: string, role: UserRole): Promise<void> {
  ensureConfigured();
  const { error } = await supabase
    .from("user_roles")
    .insert({ user_id: userId, role });

  if (error) {
    console.error("Error assigning user role:", error);
    throw error;
  }
}

export async function removeUserRole(userId: string, role: UserRole): Promise<void> {
  ensureConfigured();
  const { error } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role", role);

  if (error) {
    console.error("Error removing user role:", error);
    throw error;
  }
}

// ============================================================================
// Authors API
// ============================================================================
export async function getAuthorByUserId(userId: string): Promise<AuthorRow | null> {
  ensureConfigured();
  const { data, error } = await supabase
    .from("authors")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching author by user id:", error);
    throw error;
  }
  return data;
}

export async function getApprovedAuthors(): Promise<AuthorRow[]> {
  ensureConfigured();
  const { data, error } = await supabase
    .from("authors")
    .select("*")
    .eq("application_status", "approved")
    .order("author_name", { ascending: true });

  if (error) {
    console.error("Error fetching approved authors:", error);
    throw error;
  }
  return data || [];
}

export async function getPendingAuthorApplications(): Promise<AuthorRow[]> {
  ensureConfigured();
  const { data, error } = await supabase
    .from("authors")
    .select("*")
    .eq("application_status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching pending author applications:", error);
    throw error;
  }
  return data || [];
}

export async function reviewAuthorApplication(
  authorId: string,
  userId: string,
  status: AuthorApplicationStatus,
  rejectionReason?: string
): Promise<void> {
  ensureConfigured();
  // Update authors table status
  const { error } = await supabase
    .from("authors")
    .update({
      application_status: status,
      rejection_reason: status === "rejected" ? rejectionReason || null : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", authorId);

  if (error) {
    console.error("Error reviewing author application:", error);
    throw error;
  }

  // If approved, assign the 'author' role in user_roles table
  if (status === "approved") {
    await assignUserRole(userId, "author");
    await createNotification(
      userId,
      "Author Application Approved! 🎉",
      "Congratulations! Your author application has been approved. You can now access Author Studio and publish stories.",
      "application_approved"
    );
  } else if (status === "rejected") {
    await createNotification(
      userId,
      "Author Application Update",
      `Your author application was reviewed. Status: Rejected. ${rejectionReason ? `Reason: ${rejectionReason}` : ""}`,
      "application_rejected"
    );
  }
}

// ============================================================================
// Categories API
// ============================================================================
export async function getCategories(): Promise<CategoryRow[]> {
  ensureConfigured();
  const { data, error } = await supabase
    .from("book_categories")
    .select("*")
    .order("category_name", { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
  return data || [];
}

export async function createCategory(category: {
  category_name: string;
  description?: string;
  language?: string;
}): Promise<CategoryRow> {
  ensureConfigured();
  const { data, error } = await supabase
    .from("book_categories")
    .insert({
      category_name: category.category_name,
      description: category.description || null,
      language: category.language || "All",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating category:", error);
    throw error;
  }
  return data;
}

// ============================================================================
// Books API
// ============================================================================
export async function getPublishedBooks(): Promise<BookRow[]> {
  ensureConfigured();
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("publication_status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching published books:", error);
    throw error;
  }
  return data || [];
}

export async function getAuthorBooks(authorId: string): Promise<BookRow[]> {
  ensureConfigured();
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("author_id", authorId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching author books:", error);
    throw error;
  }
  return data || [];
}

export async function getPendingBooks(): Promise<BookRow[]> {
  ensureConfigured();
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("publication_status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching pending books:", error);
    throw error;
  }
  return data || [];
}

export async function submitBook(bookData: {
  title: string;
  description: string;
  author_id: string;
  category_id?: string;
  language: string;
  price: number;
  access_type: BookAccessType;
  book_format?: string;
  cover_image?: string;
}): Promise<BookRow> {
  ensureConfigured();
  const { data, error } = await supabase
    .from("books")
    .insert({
      ...bookData,
      publication_status: "pending",
      book_format: bookData.book_format || "ebook",
    })
    .select()
    .single();

  if (error) {
    console.error("Error submitting book:", error);
    throw error;
  }
  return data;
}

export async function reviewBookPublication(
  bookId: string,
  status: "published" | "rejected"
): Promise<void> {
  ensureConfigured();
  const { error } = await supabase
    .from("books")
    .update({
      publication_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookId);

  if (error) {
    console.error("Error updating book publication status:", error);
    throw error;
  }
}

// ============================================================================
// Reading Progress API
// ============================================================================
export async function getReadingProgress(userId: string): Promise<ReadingProgressRow[]> {
  ensureConfigured();
  const { data, error } = await supabase
    .from("reading_progress")
    .select("*")
    .eq("user_id", userId)
    .order("last_read_at", { ascending: false });

  if (error) {
    console.error("Error fetching reading progress:", error);
    throw error;
  }
  return data || [];
}

export async function saveReadingProgress(
  userId: string,
  bookId: string,
  currentPage: number,
  percentage: number
): Promise<void> {
  ensureConfigured();
  const { error } = await supabase.from("reading_progress").upsert(
    {
      user_id: userId,
      book_id: bookId,
      current_page: currentPage,
      progress_percentage: Math.min(100, Math.max(0, percentage)),
      last_read_at: new Date().toISOString(),
    },
    { onConflict: "user_id, book_id" }
  );

  if (error) {
    console.error("Error saving reading progress:", error);
    throw error;
  }
}

// ============================================================================
// Bookmarks API
// ============================================================================
export async function getBookmarks(userId: string, bookId?: string): Promise<BookmarkRow[]> {
  ensureConfigured();
  let query = supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", userId);

  if (bookId) {
    query = query.eq("book_id", bookId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching bookmarks:", error);
    throw error;
  }
  return data || [];
}

export async function addBookmark(
  userId: string,
  bookId: string,
  pageNumber: number
): Promise<BookmarkRow> {
  ensureConfigured();
  const { data, error } = await supabase
    .from("bookmarks")
    .insert({
      user_id: userId,
      book_id: bookId,
      page_number: pageNumber,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding bookmark:", error);
    throw error;
  }
  return data;
}

export async function removeBookmark(
  userId: string,
  bookId: string,
  pageNumber: number
): Promise<void> {
  ensureConfigured();
  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .eq("page_number", pageNumber);

  if (error) {
    console.error("Error removing bookmark:", error);
    throw error;
  }
}

// ============================================================================
// Favourites API
// ============================================================================
export async function getFavourites(userId: string): Promise<FavouriteRow[]> {
  ensureConfigured();
  const { data, error } = await supabase
    .from("favourites")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching favourites:", error);
    throw error;
  }
  return data || [];
}

export async function isBookFavourited(userId: string, bookId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const { data, error } = await supabase
    .from("favourites")
    .select("id")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}

export async function addFavourite(userId: string, bookId: string): Promise<void> {
  ensureConfigured();
  const { error } = await supabase
    .from("favourites")
    .insert({ user_id: userId, book_id: bookId });

  if (error) {
    console.error("Error adding favourite:", error);
    throw error;
  }
}

export async function removeFavourite(userId: string, bookId: string): Promise<void> {
  ensureConfigured();
  const { error } = await supabase
    .from("favourites")
    .delete()
    .eq("user_id", userId)
    .eq("book_id", bookId);

  if (error) {
    console.error("Error removing favourite:", error);
    throw error;
  }
}

// ============================================================================
// Notifications API
// ============================================================================
export async function getNotifications(userId: string): Promise<NotificationRow[]> {
  ensureConfigured();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
  return data || [];
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  ensureConfigured();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) {
    console.error("Error marking notification read:", error);
    throw error;
  }
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type = "system"
): Promise<NotificationRow> {
  ensureConfigured();
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      title,
      message,
      notification_type: type,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
  return data;
}

// ============================================================================
// Purchases & Paid Content Access API (Phase 3)
// ============================================================================
export async function getUserPurchases(userId: string): Promise<PurchaseRow[]> {
  ensureConfigured();
  const { data, error } = await supabase
    .from("purchases")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching purchases:", error);
    throw error;
  }
  return data || [];
}

export async function hasPurchasedBook(userId: string, bookId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const { data, error } = await supabase
    .from("purchases")
    .select("id")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .eq("status", "completed")
    .eq("access_granted", true)
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}

// ============================================================================
// Subscriptions API (Phase 3)
// ============================================================================
export async function getUserSubscription(userId: string): Promise<SubscriptionRow | null> {
  ensureConfigured();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (error) {
    console.error("Error fetching user subscription:", error);
    throw error;
  }
  return data;
}

// ============================================================================
// Author Submissions & Royalty API (Phase 3)
// ============================================================================
export async function getAuthorSubmissions(authorId: string): Promise<AuthorSubmissionRow[]> {
  ensureConfigured();
  const { data, error } = await supabase
    .from("author_submissions")
    .select("*")
    .eq("author_id", authorId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching author submissions:", error);
    throw error;
  }
  return data || [];
}

export async function submitAuthorManuscript(submission: {
  author_id: string;
  title: string;
  synopsis?: string;
  manuscript_url: string;
  sample_chapters_url?: string;
  proposed_price: number;
  proposed_access_type: BookAccessType;
  language: string;
}): Promise<AuthorSubmissionRow> {
  ensureConfigured();
  const { data, error } = await supabase
    .from("author_submissions")
    .insert({
      ...submission,
      status: "submitted",
    })
    .select()
    .single();

  if (error) {
    console.error("Error submitting manuscript:", error);
    throw error;
  }
  return data;
}

// ============================================================================
// Payment Transactions Audit Log API (Phase 3)
// Strictly stores only transaction metadata; never card details or PINs
// ============================================================================
export async function getUserPaymentTransactions(userId: string): Promise<PaymentTransactionRow[]> {
  ensureConfigured();
  const { data, error } = await supabase
    .from("payment_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching transactions:", error);
    throw error;
  }
  return data || [];
}


