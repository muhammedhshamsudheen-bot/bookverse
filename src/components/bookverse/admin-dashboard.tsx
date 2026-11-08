import { useEffect, useState } from "react";
import {
  BookOpen,
  Check,
  Clock3,
  Feather,
  FolderPlus,
  Loader2,
  ShieldCheck,
  Users,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/supabase/auth-context";
import {
  getPendingAuthorApplications,
  reviewAuthorApplication,
  getPendingBooks,
  reviewBookPublication,
  getCategories,
  createCategory,
  getAllUserRoles,
  type AuthorRow,
  type BookRow,
  type CategoryRow,
} from "@/lib/supabase/api";

export function AdminDashboard() {
  const { isConfigured, isAdmin } = useAuth();

  const [pendingAuthors, setPendingAuthors] = useState<AuthorRow[]>([]);
  const [pendingBooks, setPendingBooks] = useState<BookRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [userRolesList, setUserRolesList] = useState<
    Array<{ id: string; user_id: string; role: string; email?: string; full_name?: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Category creation dialog
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newCatLang, setNewCatLang] = useState("All");
  const [creatingCat, setCreatingCat] = useState(false);

  // Rejection dialog
  const [rejectDialogAuthor, setRejectDialogAuthor] = useState<AuthorRow | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const refreshAllData = async () => {
    if (!isConfigured || !isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [authorsRes, booksRes, catRes, rolesRes] = await Promise.allSettled([
        getPendingAuthorApplications(),
        getPendingBooks(),
        getCategories(),
        getAllUserRoles(),
      ]);

      if (authorsRes.status === "fulfilled") setPendingAuthors(authorsRes.value);
      if (booksRes.status === "fulfilled") setPendingBooks(booksRes.value);
      if (catRes.status === "fulfilled") setCategories(catRes.value);
      if (rolesRes.status === "fulfilled") setUserRolesList(rolesRes.value);
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshAllData();
  }, [isConfigured, isAdmin]);

  const handleApproveAuthor = async (author: AuthorRow) => {
    try {
      await reviewAuthorApplication(author.id, author.user_id, "approved");
      setPendingAuthors((prev) => prev.filter((a) => a.id !== author.id));
      setActionMessage(`Approved author application for ${author.author_name}. Role updated to Author.`);
      setTimeout(() => setActionMessage(null), 3000);
      void refreshAllData();
    } catch (err: any) {
      alert("Failed to approve author: " + err.message);
    }
  };

  const handleRejectAuthor = async () => {
    if (!rejectDialogAuthor) return;
    try {
      await reviewAuthorApplication(
        rejectDialogAuthor.id,
        rejectDialogAuthor.user_id,
        "rejected",
        rejectionReason || "Application did not meet editorial guidelines."
      );
      setPendingAuthors((prev) => prev.filter((a) => a.id !== rejectDialogAuthor.id));
      setRejectDialogAuthor(null);
      setRejectionReason("");
      setActionMessage("Author application rejected.");
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert("Failed to reject author: " + err.message);
    }
  };

  const handlePublishBook = async (bookId: string) => {
    try {
      await reviewBookPublication(bookId, "published");
      setPendingBooks((prev) => prev.filter((b) => b.id !== bookId));
      setActionMessage("Book approved and published to catalog!");
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert("Failed to publish book: " + err.message);
    }
  };

  const handleRejectBook = async (bookId: string) => {
    try {
      await reviewBookPublication(bookId, "rejected");
      setPendingBooks((prev) => prev.filter((b) => b.id !== bookId));
      setActionMessage("Book marked as rejected.");
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert("Failed to reject book: " + err.message);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setCreatingCat(true);
    try {
      const created = await createCategory({
        category_name: newCatName.trim(),
        description: newCatDesc.trim() || undefined,
        language: newCatLang,
      });
      setCategories((prev) => [...prev, created]);
      setCategoryOpen(false);
      setNewCatName("");
      setNewCatDesc("");
      setActionMessage(`Category '${created.category_name}' created.`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert("Failed to create category: " + err.message);
    } finally {
      setCreatingCat(false);
    }
  };

  return (
    <div className="mx-auto min-h-[65vh] max-w-[1380px] px-5 py-10 lg:px-8 lg:py-14">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-8">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="size-5" />
            <p className="text-xs font-bold uppercase tracking-[0.14em]">ADMINISTRATION</p>
          </div>
          <h1 className="mt-2 font-display text-4xl font-semibold">Platform Overview</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage author editorial reviews, catalog verification, taxonomy, and system access.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setCategoryOpen(true)}
          >
            <FolderPlus className="size-4" /> Add Category
          </Button>
          <Button variant="secondary" onClick={() => void refreshAllData()}>
            Refresh data
          </Button>
        </div>
      </div>

      {actionMessage && (
        <Alert className="mt-6 border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200">
          <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          <AlertDescription className="text-xs">{actionMessage}</AlertDescription>
        </Alert>
      )}

      {/* Admin Metrics */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase">Pending Authors</span>
            <div className="grid size-8 place-items-center rounded-md bg-secondary text-primary">
              <Users className="size-4" />
            </div>
          </div>
          <span className="mt-3 block font-display text-3xl font-semibold">
            {pendingAuthors.length}
          </span>
          <span className="text-xs text-muted-foreground">Applications waiting review</span>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase">Pending Books</span>
            <div className="grid size-8 place-items-center rounded-md bg-secondary text-primary">
              <Clock3 className="size-4" />
            </div>
          </div>
          <span className="mt-3 block font-display text-3xl font-semibold">
            {pendingBooks.length}
          </span>
          <span className="text-xs text-muted-foreground">Submissions awaiting publish</span>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase">Categories</span>
            <div className="grid size-8 place-items-center rounded-md bg-secondary text-primary">
              <BookOpen className="size-4" />
            </div>
          </div>
          <span className="mt-3 block font-display text-3xl font-semibold">
            {categories.length}
          </span>
          <span className="text-xs text-muted-foreground">Taxonomy classifications</span>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase">Users & Roles</span>
            <div className="grid size-8 place-items-center rounded-md bg-secondary text-primary">
              <ShieldCheck className="size-4" />
            </div>
          </div>
          <span className="mt-3 block font-display text-3xl font-semibold">
            {userRolesList.length}
          </span>
          <span className="text-xs text-muted-foreground">Active role assignments</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-10">
        <Tabs defaultValue="author-reviews" className="w-full">
          <TabsList className="grid w-full grid-cols-4 sm:w-[560px]">
            <TabsTrigger value="author-reviews">
              Author Queue ({pendingAuthors.length})
            </TabsTrigger>
            <TabsTrigger value="book-reviews">
              Book Queue ({pendingBooks.length})
            </TabsTrigger>
            <TabsTrigger value="categories">Categories ({categories.length})</TabsTrigger>
            <TabsTrigger value="users">Roles & Access</TabsTrigger>
          </TabsList>

          {/* Tab 1: Author Applications */}
          <TabsContent value="author-reviews" className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : pendingAuthors.length > 0 ? (
              <div className="divide-y divide-border rounded-lg border border-border bg-card">
                {pendingAuthors.map((author) => (
                  <div
                    key={author.id}
                    className="flex flex-wrap items-center justify-between gap-4 p-5"
                  >
                    <div>
                      <h3 className="font-semibold">{author.author_name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {author.biography || "No biography provided."}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Language: {author.preferred_language} · Submitted:{" "}
                        {new Date(author.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={() => void handleApproveAuthor(author)}
                      >
                        <Check className="size-4" /> Approve Author
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1.5"
                        onClick={() => setRejectDialogAuthor(author)}
                      >
                        <X className="size-4" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-12 text-center">
                <Check className="mx-auto size-8 text-emerald-600" />
                <h3 className="mt-3 font-semibold">Author queue is clear</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  No author applications are currently awaiting review.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Tab 2: Book Publication Queue */}
          <TabsContent value="book-reviews" className="mt-6">
            {pendingBooks.length > 0 ? (
              <div className="divide-y divide-border rounded-lg border border-border bg-card">
                {pendingBooks.map((book) => (
                  <div
                    key={book.id}
                    className="flex flex-wrap items-center justify-between gap-4 p-5"
                  >
                    <div>
                      <h3 className="font-semibold">{book.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{book.description}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Language: {book.language} · Access: {book.access_type} · Price: ₹{book.price}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={() => void handlePublishBook(book.id)}
                      >
                        <Check className="size-4" /> Approve & Publish
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1.5"
                        onClick={() => void handleRejectBook(book.id)}
                      >
                        <X className="size-4" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-12 text-center">
                <Check className="mx-auto size-8 text-emerald-600" />
                <h3 className="mt-3 font-semibold">Book queue is clear</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  No manuscript submissions are awaiting publication.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Tab 3: Categories */}
          <TabsContent value="categories" className="mt-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat) => (
                <div key={cat.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{cat.category_name}</h4>
                    <span className="rounded bg-secondary px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                      {cat.language}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {cat.description || "No description provided."}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Tab 4: Roles & Users */}
          <TabsContent value="users" className="mt-6">
            <div className="divide-y divide-border rounded-lg border border-border bg-card">
              {userRolesList.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {entry.full_name || entry.email || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground">{entry.email || entry.user_id}</p>
                  </div>
                  <span className="rounded bg-primary/10 px-2.5 py-1 text-xs font-semibold uppercase text-primary">
                    {entry.role}
                  </span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Category Dialog */}
      <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new literary genre or category for the BOOKVERSE catalog.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCategory} className="mt-3 grid gap-4">
            <div className="grid gap-1.5 text-sm">
              <Label htmlFor="cat-name">Category Name</Label>
              <Input
                id="cat-name"
                required
                placeholder="e.g. Historical Fiction"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
              />
            </div>

            <div className="grid gap-1.5 text-sm">
              <Label htmlFor="cat-desc">Description</Label>
              <Input
                id="cat-desc"
                placeholder="Category summary for readers..."
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
              />
            </div>

            <div className="grid gap-1.5 text-sm">
              <Label htmlFor="cat-lang">Language Target</Label>
              <select
                id="cat-lang"
                value={newCatLang}
                onChange={(e) => setNewCatLang(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="All">All Languages</option>
                <option value="English">English</option>
                <option value="Tamil">தமிழ் (Tamil)</option>
              </select>
            </div>

            <Button type="submit" disabled={creatingCat} className="mt-2 w-full">
              {creatingCat ? "Creating..." : "Save Category"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject Author Dialog */}
      <Dialog open={Boolean(rejectDialogAuthor)} onOpenChange={(open) => !open && setRejectDialogAuthor(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reject Author Application</DialogTitle>
            <DialogDescription>
              Provide feedback or reason for rejecting {rejectDialogAuthor?.author_name}'s application.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 pt-2">
            <Label htmlFor="reject-reason">Reason for rejection</Label>
            <Input
              id="reject-reason"
              placeholder="e.g. Missing required biographical or manuscript sample details."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectDialogAuthor(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectAuthor}>
              Confirm Rejection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

