import { useEffect, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Clock3,
  Feather,
  FilePlus,
  Loader2,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/lib/supabase/auth-context";
import {
  getAuthorBooks,
  submitBook,
  getCategories,
  type BookRow,
  type CategoryRow,
} from "@/lib/supabase/api";
import type { BookAccessType } from "@/lib/supabase/types";

export function AuthorDashboard({ onRead }: { onRead: (book: any) => void }) {
  const { user, authorProfile, isConfigured } = useAuth();

  const [authorBooks, setAuthorBooks] = useState<BookRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Submit Modal
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("English");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("0");
  const [accessType, setAccessType] = useState<BookAccessType>("free");

  useEffect(() => {
    async function fetchAuthorData() {
      if (!authorProfile || !isConfigured) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [booksData, catData] = await Promise.all([
          getAuthorBooks(authorProfile.id),
          getCategories(),
        ]);
        setAuthorBooks(booksData);
        setCategories(catData);
      } catch (err) {
        console.error("Error fetching author data:", err);
      } finally {
        setLoading(false);
      }
    }

    void fetchAuthorData();
  }, [authorProfile, isConfigured]);

  const handleSubmitBook = async (e: FormEvent) => {
    e.preventDefault();
    if (!authorProfile) return;

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const parsedPrice = parseFloat(price) || 0;
      const newBook = await submitBook({
        title: title.trim(),
        description: description.trim(),
        author_id: authorProfile.id,
        category_id: categoryId || undefined,
        language,
        price: parsedPrice,
        access_type: accessType,
      });

      setAuthorBooks((prev) => [newBook, ...prev]);
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitOpen(false);
        setSubmitSuccess(false);
        setTitle("");
        setDescription("");
        setPrice("0");
      }, 1200);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit book for review.");
    } finally {
      setSubmitting(false);
    }
  };

  const isApproved = authorProfile?.application_status === "approved";
  const authorName = authorProfile?.author_name || "Author";

  return (
    <div className="mx-auto min-h-[65vh] max-w-[1380px] px-5 py-10 lg:px-8 lg:py-14">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
            CREATOR STUDIO
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold">{authorName}’s Studio</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your manuscripts, track submissions, and monitor your readership.
          </p>
        </div>

        {isApproved && (
          <Button className="gap-2" onClick={() => setSubmitOpen(true)}>
            <FilePlus className="size-4" /> Submit new book
          </Button>
        )}
      </div>

      {/* Author Status Banner */}
      {!isApproved && (
        <Alert className="mt-6 border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200">
          <Clock3 className="size-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="font-semibold">Application Pending Approval</AlertTitle>
          <AlertDescription className="text-xs">
            Your author application is under review by the BOOKVERSE editorial team. You will be able
            to upload and publish stories once verified.
          </AlertDescription>
        </Alert>
      )}

      {/* Creator Metrics */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase">Submitted Books</span>
            <div className="grid size-8 place-items-center rounded-md bg-secondary text-primary">
              <BookOpen className="size-4" />
            </div>
          </div>
          <span className="mt-3 block font-display text-3xl font-semibold">
            {authorBooks.length}
          </span>
          <span className="text-xs text-muted-foreground">
            {authorBooks.filter((b) => b.publication_status === "published").length} published
          </span>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase">Reader Royalty</span>
            <div className="grid size-8 place-items-center rounded-md bg-secondary text-primary">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <span className="mt-3 block font-display text-3xl font-semibold">70%</span>
          <span className="text-xs text-muted-foreground">Author revenue share</span>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase">Verification Status</span>
            <div className="grid size-8 place-items-center rounded-md bg-secondary text-primary">
              <Feather className="size-4" />
            </div>
          </div>
          <span className="mt-3 block font-display text-2xl font-semibold capitalize text-primary">
            {authorProfile?.application_status || "Pending"}
          </span>
          <span className="text-xs text-muted-foreground">Editorial standing</span>
        </div>
      </div>

      {/* Book Submissions List */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold">Your Submissions</h2>
          <span className="text-xs text-muted-foreground">
            Server-enforced status: only administrators can approve books to published.
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : authorBooks.length > 0 ? (
          <div className="mt-6 divide-y divide-border rounded-lg border border-border bg-card">
            {authorBooks.map((book) => (
              <div
                key={book.id}
                className="flex flex-wrap items-center justify-between gap-4 p-5"
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-semibold">{book.title}</h3>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        book.publication_status === "published"
                          ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                          : book.publication_status === "rejected"
                          ? "bg-destructive/20 text-destructive"
                          : "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {book.publication_status}
                    </span>
                    <span className="rounded bg-secondary px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                      {book.access_type} · ₹{book.price}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                    {book.description || "No description provided."}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Language: {book.language} · Submitted:{" "}
                    {new Date(book.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {book.publication_status === "published" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        onRead({
                          id: book.id,
                          title: book.title,
                          author: authorName,
                          category: "Original",
                          language: book.language as any,
                          price: book.price,
                          rating: 5.0,
                          reads: "1",
                          pages: 100,
                          access: book.access_type === "free" ? "Free" : "Premium",
                          cover: book.cover_image || "",
                          description: book.description || "",
                          published: book.created_at,
                        })
                      }
                    >
                      Preview reader
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-border p-12 text-center">
            <Feather className="mx-auto size-8 text-muted-foreground" />
            <h3 className="mt-3 font-semibold">No books submitted yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {isApproved
                ? "Click 'Submit new book' above to submit your first manuscript for review."
                : "Once your author account is approved, you can submit manuscripts here."}
            </p>
          </div>
        )}
      </div>

      {/* Submit Book Dialog */}
      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Submit a New Book</DialogTitle>
            <DialogDescription>
              Submit your manuscript details for editorial verification and publication on BOOKVERSE.
            </DialogDescription>
          </DialogHeader>

          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription className="text-xs">{submitError}</AlertDescription>
            </Alert>
          )}

          {submitSuccess && (
            <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200">
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              <AlertDescription className="text-xs">
                Book submitted successfully for editorial review!
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmitBook} className="mt-3 grid gap-4">
            <div className="grid gap-1.5 text-sm">
              <Label htmlFor="book-title">Title</Label>
              <Input
                id="book-title"
                required
                placeholder="Story or book title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid gap-1.5 text-sm">
              <Label htmlFor="book-desc">Description</Label>
              <Textarea
                id="book-desc"
                required
                rows={3}
                placeholder="A compelling synopsis for readers..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5 text-sm">
                <Label htmlFor="book-lang">Language</Label>
                <select
                  id="book-lang"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="English">English</option>
                  <option value="Tamil">தமிழ் (Tamil)</option>
                </select>
              </div>

              <div className="grid gap-1.5 text-sm">
                <Label htmlFor="book-access">Access Model</Label>
                <select
                  id="book-access"
                  value={accessType}
                  onChange={(e) => setAccessType(e.target.value as BookAccessType)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="free">Free read</option>
                  <option value="premium">Plus (Subscription)</option>
                  <option value="paid">Direct Buy (Standalone)</option>
                </select>
              </div>
            </div>

            {accessType === "paid" && (
              <div className="grid gap-1.5 text-sm">
                <Label htmlFor="book-price">Price (₹ INR)</Label>
                <Input
                  id="book-price"
                  type="number"
                  min="9"
                  max="999"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            )}

            <Button type="submit" disabled={submitting} className="mt-2 w-full">
              {submitting ? "Submitting for review..." : "Submit Manuscript for Review"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

