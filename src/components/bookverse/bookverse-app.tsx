import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ArrowDownWideNarrow,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Compass,
  Crown,
  Filter,
  Heart,
  LibraryBig,
  ListFilter,
  LockKeyhole,
  Menu,
  Moon,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Sun,
  Users,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { bookById, books, membershipPlans, searchBooks, type Book } from "@/lib/bookverse-data";

type Page = "home" | "explore" | "categories" | "free" | "premium" | "authors" | "customer" | "author-dashboard" | "admin" | "book";

const navItems = [
  { label: "Home", to: "/" as const },
  { label: "Explore", to: "/explore" as const },
  { label: "Categories", to: "/categories" as const },
  { label: "Free reads", to: "/free" as const },
  { label: "Premium", to: "/premium" as const },
  { label: "Authors", to: "/authors" as const },
];

const categories = ["All books", "Novels", "Short stories", "Romance", "Thriller", "Mystery", "Fantasy", "Science fiction", "Comics", "Manga", "Tamil literature", "English literature"];

export function BookverseApp({ page, bookId, query = "" }: { page: Page; bookId?: string; query?: string }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [authOpen, setAuthOpen] = useState(false);
  const [readerBook, setReaderBook] = useState<Book | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentBook = bookId ? bookById(bookId) : books[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-[1380px] items-center justify-between gap-5 px-5 lg:px-8">
          <Link to="/" aria-label="BOOKVERSE home" className="flex shrink-0 items-center gap-2.5">
            <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground"><BookOpen className="size-5" /></span>
            <span className="font-display text-[21px] font-bold leading-none">BOOKVERSE</span>
          </Link>
          <nav aria-label="Main navigation" className="hidden items-center gap-6 xl:flex">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} className={`text-[13px] font-medium transition-colors hover:text-primary ${pathname === item.to ? "text-primary" : "text-muted-foreground"}`}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2.5">
            <Link to="/explore" aria-label="Search books" className="grid size-10 place-items-center rounded-md text-muted-foreground transition hover:bg-secondary hover:text-foreground"><Search className="size-[18px]" /></Link>
            <Button variant="outline" className="hidden h-10 px-4 text-[13px] sm:inline-flex" onClick={() => setAuthOpen(true)}>Sign in</Button>
            <Button className="hidden h-10 gap-2 px-4 text-[13px] sm:inline-flex" onClick={() => setAuthOpen(true)}>Join free <ArrowRight className="size-4" /></Button>
            <Link to="/library" aria-label="My library" className="grid size-10 place-items-center rounded-full bg-secondary text-secondary-foreground transition hover:bg-accent"><LibraryBig className="size-[18px]" /></Link>
            <Button variant="ghost" size="icon" aria-label={mobileOpen ? "Close menu" : "Open menu"} className="xl:hidden" onClick={() => setMobileOpen((open) => !open)}>{mobileOpen ? <X /> : <Menu />}</Button>
          </div>
        </div>
        {mobileOpen && <nav aria-label="Mobile navigation" className="grid gap-1 border-t border-border bg-background px-5 py-3 xl:hidden">{navItems.map((item) => <Link onClick={() => setMobileOpen(false)} key={item.to} to={item.to} className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-secondary">{item.label}</Link>)}<Link onClick={() => setMobileOpen(false)} to="/library" className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-secondary">My library</Link></nav>}
      </header>

      <main>
        {page === "home" && <HomePage onRead={setReaderBook} />}
        {page === "explore" && <ExplorePage onRead={setReaderBook} initialQuery={query} />}
        {page === "categories" && <CategoriesPage />}
        {page === "free" && <FreePage onRead={setReaderBook} />}
        {page === "premium" && <PremiumPage onJoin={() => setAuthOpen(true)} />}
        {page === "authors" && <AuthorsPage />}
        {page === "book" && <BookDetails book={currentBook} onRead={setReaderBook} />}
        {page === "customer" && <Dashboard kind="customer" onRead={setReaderBook} />}
        {page === "author-dashboard" && <Dashboard kind="author" onRead={setReaderBook} />}
        {page === "admin" && <Dashboard kind="admin" onRead={setReaderBook} />}
      </main>

      <Footer />
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      <ReaderDialog book={readerBook} onOpenChange={(open) => !open && setReaderBook(null)} />
    </div>
  );
}

function HomePage({ onRead }: { onRead: (book: Book) => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void navigate({ to: "/explore", search: { q: query } });
  };
  return (
    <>
      <section className="relative isolate min-h-[570px] overflow-hidden bg-primary text-primary-foreground lg:min-h-[620px]">
        <img src={heroImage} alt="An open book on a warmly lit reading desk" width={1600} height={1008} className="absolute inset-0 -z-20 size-full object-cover object-center" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary via-primary/90 to-primary/20" />
        <div className="mx-auto flex min-h-[570px] max-w-[1380px] items-center px-5 py-16 lg:min-h-[620px] lg:px-8">
          <div className="max-w-[620px]">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 text-xs font-semibold text-primary-foreground"><Sparkles className="size-3.5 text-accent" /> A world of stories, waiting</div>
            <h1 className="font-display text-5xl font-semibold leading-[1.08] sm:text-6xl lg:text-[68px]">Discover your next <span className="text-accent">favourite</span> story.</h1>
            <p className="mt-5 max-w-[500px] text-base leading-7 text-primary-foreground/75 sm:text-lg">From Tamil classics to tomorrow’s page-turners, find a story that feels like it was written just for you.</p>
            <form onSubmit={submitSearch} className="mt-8 flex max-w-[570px] items-center gap-2 rounded-lg bg-background p-2 shadow-xl">
              <Search className="ml-2 size-5 shrink-0 text-muted-foreground" />
              <Input aria-label="Search books, authors, genres" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search books, authors, genres..." className="h-11 border-0 bg-transparent shadow-none focus-visible:ring-0" />
              <Button className="h-11 shrink-0 px-5" type="submit">Search</Button>
            </form>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-primary-foreground/70"><span>Readers are loving</span><Link to="/explore" className="underline decoration-primary-foreground/40 underline-offset-4 hover:text-primary-foreground">Tamil fiction</Link><Link to="/explore" className="underline decoration-primary-foreground/40 underline-offset-4 hover:text-primary-foreground">Cozy mysteries</Link><Link to="/explore" className="underline decoration-primary-foreground/40 underline-offset-4 hover:text-primary-foreground">Graphic novels</Link></div>
          </div>
        </div>
        <div className="absolute bottom-8 right-[7%] hidden items-center gap-3 rounded-lg border border-primary-foreground/15 bg-primary/60 p-3 backdrop-blur md:flex"><span className="grid size-10 place-items-center rounded-md bg-accent text-accent-foreground"><BookOpen className="size-5" /></span><div><p className="text-xs font-semibold">Your next favourite is here</p><p className="mt-1 text-[11px] text-primary-foreground/70">Stories for every kind of reader</p></div></div>
      </section>

      <section className="mx-auto max-w-[1380px] px-5 py-12 lg:px-8 lg:py-14">
        <div className="mb-6 flex items-end justify-between gap-4"><SectionHeading eyebrow="CURATED FOR YOU" title="Stories worth staying up for" /><Link to="/explore" className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:flex">Explore all <ArrowRight className="size-4" /></Link></div>
        <BookGrid items={books.slice(0, 4)} onRead={onRead} />
      </section>

      <section className="border-y border-border bg-secondary/45">
        <div className="mx-auto max-w-[1380px] px-5 py-12 lg:px-8 lg:py-14">
          <div className="mb-6 flex items-end justify-between gap-4"><SectionHeading eyebrow="ROOTED IN EVERY LANGUAGE" title="Tamil stories, close to home" /><Link to="/explore" className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">See all <ArrowRight className="size-4" /></Link></div>
          <BookGrid items={books.filter((book) => book.language === "தமிழ்")} onRead={onRead} />
        </div>
      </section>

      <section className="mx-auto max-w-[1380px] px-5 py-12 lg:px-8 lg:py-14">
        <div className="mb-6 flex items-end justify-between gap-4"><SectionHeading eyebrow="A LITTLE SOMETHING FOR EVERYONE" title="Browse by mood" /><Link to="/categories" className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">All categories <ArrowRight className="size-4" /></Link></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{categoryTiles.map((tile) => <Link key={tile.label} to="/explore" className="group flex min-h-[116px] flex-col justify-between rounded-lg border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"><span className="grid size-9 place-items-center rounded-md bg-secondary text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">{tile.icon}</span><span className="text-sm font-semibold">{tile.label}</span></Link>)}</div>
      </section>

      <section className="border-y border-border bg-secondary/45">
        <div className="mx-auto grid max-w-[1380px] gap-8 px-5 py-12 sm:grid-cols-2 lg:px-8 lg:py-14">
          <div className="rounded-lg bg-primary p-7 text-primary-foreground sm:p-9"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">THE FREE SHELF</p><h2 className="mt-3 font-display text-3xl font-semibold">A good story shouldn’t wait.</h2><p className="mt-3 max-w-md text-sm leading-6 text-primary-foreground/70">Start reading hand-picked stories and short reads, free to enjoy.</p><Button asChild variant="secondary" className="mt-6 gap-2"><Link to="/free">Browse free books <ArrowRight className="size-4" /></Link></Button></div>
          <div className="rounded-lg border border-border bg-card p-7 sm:p-9"><div className="flex items-center gap-2 text-primary"><Crown className="size-5" /><p className="text-xs font-semibold uppercase tracking-[0.12em]">BOOKVERSE PLUS</p></div><h2 className="mt-3 font-display text-3xl font-semibold">Make room for more.</h2><p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">One membership. A growing shelf of premium reads, all year long.</p><Button asChild className="mt-6 gap-2"><Link to="/premium">Find your plan <ArrowRight className="size-4" /></Link></Button></div>
        </div>
      </section>

      <section className="mx-auto max-w-[1380px] px-5 py-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[.8fr_1.2fr] md:items-center"><div><SectionHeading eyebrow="INDEPENDENT VOICES" title="Big stories start with brave voices." /><p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">Meet the independent authors bringing fresh perspectives and unforgettable worlds to BOOKVERSE.</p><Button asChild variant="outline" className="mt-6 gap-2"><Link to="/authors">Meet our authors <ArrowRight className="size-4" /></Link></Button></div><div className="grid gap-4 sm:grid-cols-2"><AuthorSpotlight name="Ananya Krishnan" style="Literary fiction · Chennai" initials="AK" tone="bg-rose-200 text-rose-950" /><AuthorSpotlight name="Mira Venkatesh" style="Mystery · Bengaluru" initials="MV" tone="bg-emerald-200 text-emerald-950" /></div></div>
      </section>

      <section className="border-t border-border bg-secondary/45"><div className="mx-auto max-w-[1380px] px-5 py-12 text-center lg:px-8 lg:py-14"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">A NOTE FROM OUR READERS</p><p className="mx-auto mt-4 max-w-3xl font-display text-2xl leading-relaxed sm:text-3xl">“I found stories in Tamil and English I never would have discovered anywhere else. My commute has a new favourite part.”</p><p className="mt-5 text-sm font-semibold">Nivetha R. <span className="font-normal text-muted-foreground">· BOOKVERSE reader</span></p></div></section>
    </>
  );
}

const categoryTiles = [
  { label: "Romance", icon: <Heart className="size-4" /> },
  { label: "Mystery", icon: <Search className="size-4" /> },
  { label: "Fantasy", icon: <Sparkles className="size-4" /> },
  { label: "Tamil reads", icon: <BookOpen className="size-4" /> },
  { label: "Comics & manga", icon: <Users className="size-4" /> },
  { label: "Short stories", icon: <Clock3 className="size-4" /> },
];

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <div><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">{eyebrow}</p><h2 className="mt-2 font-display text-2xl font-semibold sm:text-[30px]">{title}</h2></div>;
}

function BookGrid({ items, onRead }: { items: Book[]; onRead: (book: Book) => void }) {
  if (!items.length) return <p className="rounded-lg border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">No books match those filters. Try changing your search.</p>;
      <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">{items.map((book) => <BookCard key={book.id} book={book} onRead={onRead} />)}</div>
}

function BookCard({ book, onRead }: { book: Book; onRead: (book: Book) => void }) {
  const [saved, setSaved] = useState(false);
  return (
    <article className="group min-w-0">
      <div className="relative overflow-hidden rounded-lg bg-secondary">
        <Link to="/books/$bookId" params={{ bookId: book.id }} aria-label={`View ${book.title}`} className="block aspect-[3/4] overflow-hidden">
          <img src={book.cover} alt={`${book.title} cover art`} width={768} height={1152} loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-[1.035]" />
        </Link>
        <span className="absolute left-3 top-3 rounded-sm bg-background/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground">{book.access === "Buy" ? `₹${book.price}` : book.access}</span>
        <Button variant="secondary" size="icon" aria-label={saved ? `Remove ${book.title} from wishlist` : `Save ${book.title} to wishlist`} className="absolute right-3 top-3 size-8 rounded-full bg-background/90" onClick={() => setSaved((value) => !value)}>{saved ? <Heart className="size-4 fill-primary text-primary" /> : <Heart className="size-4" />}</Button>
      </div>
      <div className="pt-3">
        <Link to="/books/$bookId" params={{ bookId: book.id }} className="line-clamp-1 text-[15px] font-semibold hover:text-primary">{book.title}</Link>
        <p className="mt-1 truncate text-xs text-muted-foreground">{book.author}</p>
        <div className="mt-2 flex items-center justify-between gap-2"><span className="inline-flex items-center gap-1 text-xs font-medium"><Star className="size-3.5 fill-accent text-accent" /> {book.rating}</span><span className="truncate text-[11px] text-muted-foreground">{book.reads} reads</span></div>
        <Button variant="outline" className="mt-3 h-9 w-full text-xs" onClick={() => onRead(book)}>{book.access === "Free" ? "Read free" : "Preview book"}</Button>
      </div>
    </article>
  );
}

function ExplorePage({ onRead, initialQuery }: { onRead: (book: Book) => void; initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [language, setLanguage] = useState("All languages");
  const [access, setAccess] = useState("All access");
  const [sort, setSort] = useState("Recommended");
  const [category, setCategory] = useState("All books");
  const results = useMemo(() => {
    const searched = searchBooks(query).filter((book) => (language === "All languages" || book.language === language) && (access === "All access" || book.access === access) && (category === "All books" || book.category.toLowerCase().includes(category.toLowerCase()) || (category === "Novels" && book.pages > 150) || (category === "English literature" && book.language === "English")));
    return [...searched].sort((a, b) => sort === "Newest" ? b.published.localeCompare(a.published) : sort === "Top rated" ? b.rating - a.rating : sort === "Price: low to high" ? a.price - b.price : 0);
  }, [query, language, access, sort, category]);
  return <PageFrame><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">THE BOOKVERSE SHELF</p><h1 className="mt-2 font-display text-4xl font-semibold">Explore stories</h1><p className="mt-2 text-sm text-muted-foreground">Find your next read, wherever the story takes you.</p></div><span className="text-sm text-muted-foreground">{results.length} titles</span></div>
    <div className="mt-7 flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center"><label className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search the catalog" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles, authors, categories..." className="h-11 pl-10" /></label><div className="grid grid-cols-2 gap-2 sm:flex"><select aria-label="Filter by language" value={language} onChange={(event) => setLanguage(event.target.value)} className="h-11 rounded-md border border-input bg-background px-3 text-sm"><option>All languages</option><option>English</option><option>தமிழ்</option></select><select aria-label="Filter by access" value={access} onChange={(event) => setAccess(event.target.value)} className="h-11 rounded-md border border-input bg-background px-3 text-sm"><option>All access</option><option>Free</option><option>Premium</option><option>Buy</option></select><select aria-label="Sort books" value={sort} onChange={(event) => setSort(event.target.value)} className="col-span-2 h-11 rounded-md border border-input bg-background px-3 text-sm sm:col-span-1"><option>Recommended</option><option>Newest</option><option>Top rated</option><option>Price: low to high</option></select></div></div>
    <div className="mt-5 flex gap-2 overflow-x-auto pb-2">{categories.map((item) => <Button key={item} variant={category === item ? "default" : "outline"} size="sm" className="shrink-0" onClick={() => setCategory(item)}>{item}</Button>)}</div>
    <div className="mt-7"><BookGrid items={results} onRead={onRead} /></div>
  </PageFrame>;
}

function CategoriesPage() {
  return <PageFrame><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">FIND YOUR KIND OF STORY</p><h1 className="mt-2 font-display text-4xl font-semibold">Browse categories</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Follow a favorite feeling, explore a new language, or let curiosity lead.</p><div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{categories.slice(1).map((category, index) => <Link key={category} to="/explore" className="group flex min-h-[118px] items-center justify-between rounded-lg border border-border bg-card px-5 py-4 transition hover:border-primary/40 hover:shadow-sm"><div><span className="text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")} · {index % 2 ? "Explore a new world" : "Readers’ favourites"}</span><h2 className="mt-2 font-display text-xl font-semibold">{category}</h2></div><span className="grid size-9 place-items-center rounded-full bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground"><ArrowRight className="size-4" /></span></Link>)}</div></PageFrame>;
}

function FreePage({ onRead }: { onRead: (book: Book) => void }) {
  const freeBooks = books.filter((book) => book.access === "Free");
  return <PageFrame><div className="grid items-center gap-8 rounded-lg bg-primary px-6 py-9 text-primary-foreground sm:px-9 md:grid-cols-[1fr_auto]"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">THE FREE SHELF</p><h1 className="mt-2 font-display text-4xl font-semibold">Good stories. No strings.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/75">A hand-picked collection of free reads, short stories, and first chapters from BOOKVERSE authors.</p></div><div className="flex items-center gap-3"><BookOpen className="size-8 text-accent" /><span className="text-3xl font-semibold">{freeBooks.length}<span className="ml-2 text-sm font-normal text-primary-foreground/70">free reads</span></span></div></div><div className="mt-9"><BookGrid items={freeBooks} onRead={onRead} /></div><p className="mt-8 border-t border-border pt-5 text-xs text-muted-foreground">Sponsored placements are not active in this preview.</p></PageFrame>;
}

function PremiumPage({ onJoin }: { onJoin: () => void }) {
  return <PageFrame><div className="text-center"><span className="mx-auto grid size-12 place-items-center rounded-full bg-accent/20 text-primary"><Crown className="size-6" /></span><p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-primary">BOOKVERSE PLUS</p><h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">More stories, more often.</h1><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted-foreground">A little more room on your shelf. Access a growing collection of premium reads with one simple membership.</p></div><div className="mx-auto mt-9 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-4">{membershipPlans.map((plan, index) => <article key={plan.name} className={`relative rounded-lg border bg-card p-5 ${index === 3 ? "border-primary shadow-sm" : "border-border"}`}>{index === 3 && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-sm bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">Best value</span>}<p className="text-sm font-semibold">{plan.name}</p><p className="mt-4 font-display text-3xl font-semibold">₹{plan.price}<span className="ml-1 text-xs font-normal text-muted-foreground">/ {plan.duration}</span></p><p className="mt-2 text-xs text-muted-foreground">Just stories. No surprises.</p><Button className="mt-5 w-full" variant={index === 3 ? "default" : "outline"} onClick={onJoin}>Choose {plan.name}</Button></article>)}</div><div className="mx-auto mt-9 grid max-w-3xl gap-3 sm:grid-cols-2">{["Access to designated premium books", "Ad-free reading experience", "A member badge on your profile", "New stories added regularly"].map((benefit) => <div key={benefit} className="flex items-center gap-2.5 text-sm"><Check className="size-4 text-primary" />{benefit}</div>)}</div><p className="mt-9 text-center text-xs text-muted-foreground">Membership checkout is not connected in this preview.</p></PageFrame>;
}

function AuthorsPage() {
  return <PageFrame><div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">THE PEOPLE BEHIND THE PAGES</p><h1 className="mt-2 font-display text-4xl font-semibold">Meet the storytellers</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Independent voices. Original worlds. Stories worth sharing.</p></div><Button asChild variant="outline" className="gap-2"><Link to="/dashboard/author">Author studio <ArrowRight className="size-4" /></Link></Button></div><div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{authorProfiles.map((author) => <article key={author.name} className="rounded-lg border border-border bg-card p-5"><div className={`grid size-14 place-items-center rounded-full font-display text-xl font-semibold ${author.tone}`}>{author.initials}</div><h2 className="mt-4 font-display text-xl font-semibold">{author.name}</h2><p className="mt-1 text-xs text-muted-foreground">{author.place} · {author.genre}</p><p className="mt-3 text-sm leading-6 text-muted-foreground">{author.bio}</p><Link to="/explore" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Browse their books <ArrowRight className="size-4" /></Link></article>)}</div></PageFrame>;
}

const authorProfiles = [
  { name: "Ananya Krishnan", place: "Chennai", genre: "Literary fiction", initials: "AK", tone: "bg-rose-200 text-rose-950", bio: "Writes about home, belonging, and the small moments that change everything." },
  { name: "Mira Venkatesh", place: "Bengaluru", genre: "Mystery & folklore", initials: "MV", tone: "bg-emerald-200 text-emerald-950", bio: "Finds the uncanny hidden in familiar places, old tales, and quiet streets." },
  { name: "கார்த்திக் ராமன்", place: "மதுரை", genre: "தமிழ் சிறுகதைகள்", initials: "கா", tone: "bg-amber-200 text-amber-950", bio: "தமிழ் மண்ணின் மணத்தோடு மனிதர்களின் கதைகளை எழுதுகிறார்." },
];

function AuthorSpotlight({ name, style, initials, tone }: { name: string; style: string; initials: string; tone: string }) {
  return <Link to="/authors" className="flex items-center gap-4 rounded-lg border border-border bg-card p-5 transition hover:shadow-sm"><span className={`grid size-14 shrink-0 place-items-center rounded-full font-display text-lg font-semibold ${tone}`}>{initials}</span><span><span className="block font-semibold">{name}</span><span className="mt-1 block text-xs text-muted-foreground">{style}</span></span><ChevronRight className="ml-auto size-4 text-muted-foreground" /></Link>;
}

function BookDetails({ book, onRead }: { book: Book; onRead: (book: Book) => void }) {
  const [saved, setSaved] = useState(false);
  return <PageFrame><Link to="/explore" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Back to explore</Link><div className="mt-7 grid gap-8 md:grid-cols-[minmax(220px,330px)_1fr] md:gap-12"><img src={book.cover} alt={`${book.title} cover art`} width={768} height={1152} className="mx-auto aspect-[3/4] w-full max-w-[320px] rounded-lg object-cover shadow-md md:mx-0" /><div className="self-center"><span className="rounded-sm bg-secondary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide">{book.category}</span><h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-5xl">{book.title}</h1><p className="mt-3 text-base text-muted-foreground">by <Link to="/authors" className="font-semibold text-foreground hover:text-primary">{book.author}</Link></p><div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Star className="size-4 fill-accent text-accent" /> {book.rating} rating</span><span>{book.pages} pages</span><span>{book.language}</span><span>{book.reads} reads</span></div><p className="mt-6 max-w-2xl text-[15px] leading-7 text-muted-foreground">{book.description}</p><div className="mt-7 flex flex-wrap gap-3"><Button className="gap-2" onClick={() => onRead(book)}><BookOpen className="size-4" /> {book.access === "Free" ? "Read now" : "Read a preview"}</Button>{book.access === "Buy" && <Button variant="outline" onClick={() => window.alert("Purchases will be available after secure checkout is connected.")}>Buy for ₹{book.price}</Button>}{book.access === "Premium" && <Button asChild variant="outline"><Link to="/premium">Included with Plus</Link></Button>}<Button variant="ghost" size="icon" aria-label={saved ? "Remove from wishlist" : "Save to wishlist"} onClick={() => setSaved((value) => !value)}>{saved ? <Heart className="size-5 fill-primary text-primary" /> : <Heart className="size-5" />}</Button></div><p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><LockKeyhole className="size-3.5" /> Full book access and purchases are not connected in this preview.</p></div></div></PageFrame>;
}

function PageFrame({ children }: { children: ReactNode }) {
  return <div className="mx-auto min-h-[65vh] max-w-[1380px] px-5 py-10 lg:px-8 lg:py-14">{children}</div>;
}

function Dashboard({ kind, onRead }: { kind: "customer" | "author" | "admin"; onRead: (book: Book) => void }) {
  const isCustomer = kind === "customer";
  const isAuthor = kind === "author";
  const title = isCustomer ? "Your reading room" : isAuthor ? "Author studio" : "Platform overview";
  const eyebrow = isCustomer ? "MY BOOKVERSE" : isAuthor ? "CREATOR SPACE" : "ADMINISTRATION";
  const items = isCustomer ? books.slice(0, 2) : isAuthor ? books.slice(0, 3) : [];
  return <PageFrame><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{eyebrow}</p><h1 className="mt-2 font-display text-4xl font-semibold">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{isCustomer ? "A quiet place for all the stories you love." : isAuthor ? "Your stories, submissions, and reader community." : "A snapshot of the BOOKVERSE preview catalog."}</p></div><span className="rounded-sm border border-border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Preview data</span></div>
    {isCustomer && <div className="mt-8 grid gap-3 sm:grid-cols-3"><Metric label="In your library" value="08" icon={<LibraryBig />} /><Metric label="Reading streak" value="4 days" icon={<Sparkles />} /><Metric label="Saved for later" value="03" icon={<Heart />} /></div>}
    {isAuthor && <div className="mt-8 grid gap-3 sm:grid-cols-3"><Metric label="Books submitted" value="03" icon={<BookOpen />} /><Metric label="Readers this month" value="1,248" icon={<Users />} /><Metric label="Author share" value="70%" icon={<ArrowDownWideNarrow />} /></div>}
    {kind === "admin" && <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Catalog titles" value="08" icon={<BookOpen />} /><Metric label="Authors" value="03" icon={<Users />} /><Metric label="Pending review" value="02" icon={<Clock3 />} /><Metric label="Preview transactions" value="—" icon={<SlidersHorizontal />} /></div>}
    <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_300px]"><div><div className="flex items-center justify-between"><h2 className="font-display text-2xl font-semibold">{isCustomer ? "Continue reading" : isAuthor ? "Your titles" : "Review queue"}</h2>{isCustomer && <Link to="/explore" className="text-sm font-semibold text-primary">Explore more</Link>}</div>{isCustomer && <div className="mt-5 flex gap-4 rounded-lg border border-border bg-card p-4"><img src={books[0].cover} alt={`${books[0].title} cover art`} width={768} height={1152} className="h-32 w-24 rounded-sm object-cover" /><div className="self-center"><p className="text-xs text-muted-foreground">LAST OPENED · 42% COMPLETE</p><h3 className="mt-2 font-display text-xl font-semibold">{books[0].title}</h3><p className="mt-1 text-xs text-muted-foreground">{books[0].author}</p><Button size="sm" className="mt-3 gap-2" onClick={() => onRead(books[0])}>Continue <ArrowRight className="size-3.5" /></Button></div></div>}
    {kind === "admin" ? <div className="mt-5 divide-y divide-border rounded-lg border border-border bg-card">{[books[5], books[6]].map((book, index) => <div key={book.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-semibold">{book.title}</p><p className="mt-1 text-xs text-muted-foreground">Submitted by {book.author} · {index ? "New submission" : "Awaiting review"}</p></div><span className="rounded-sm bg-accent/40 px-2 py-1 text-[10px] font-semibold">Needs review</span></div>)}</div> : <div className="mt-5 grid gap-4 sm:grid-cols-3">{items.map((book) => <div key={book.id} className="rounded-lg border border-border bg-card p-3"><img src={book.cover} alt={`${book.title} cover art`} width={768} height={1152} loading="lazy" className="aspect-[3/4] w-full rounded-sm object-cover" /><p className="mt-3 line-clamp-1 text-sm font-semibold">{book.title}</p><p className="mt-1 text-xs text-muted-foreground">{isCustomer ? "In your library" : "Published · Preview"}</p>{isAuthor && <p className="mt-2 text-xs text-primary">{indexFor(book)} reads this month</p>}</div>)}</div>}</div>
    <aside className="h-fit rounded-lg border border-border bg-card p-5"><h2 className="font-display text-lg font-semibold">{isCustomer ? "Your shortcuts" : isAuthor ? "Creator tools" : "Management"}</h2><div className="mt-3 grid gap-1">{(isCustomer ? [["Explore books", "/explore"], ["Free reads", "/free"], ["Membership", "/premium"]] : isAuthor ? [["Author profile", "/authors"], ["Browse catalog", "/explore"], ["Submission status", "/dashboard/author"]] : [["Book catalog", "/explore"], ["Author profiles", "/authors"], ["Free shelf", "/free"]]).map(([label, to]) => <Link key={label} to={to} className="flex items-center justify-between rounded-md px-2 py-2.5 text-sm hover:bg-secondary">{label}<ChevronRight className="size-4 text-muted-foreground" /></Link>)}</div><p className="mt-4 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">This is a UI preview. Accounts, permissions, and saved data are not connected.</p></aside></div>
    {kind === "admin" && <div className="mt-8 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-secondary/50 p-4"><Filter className="size-4 text-muted-foreground" /><span className="text-sm font-medium">Catalog settings</span><Button variant="outline" size="sm" onClick={() => window.alert("Catalog management will be available in a future phase.")}>Manage books</Button><Button variant="outline" size="sm" onClick={() => window.alert("Account management requires connected authentication.")}>Manage accounts</Button></div>}
    {isAuthor && <div className="mt-8 rounded-lg border border-dashed border-border p-5"><h2 className="font-display text-lg font-semibold">Share a new story</h2><p className="mt-1 text-sm text-muted-foreground">Book submissions will open once author accounts and secure file storage are connected.</p><Button className="mt-4" variant="outline" onClick={() => window.alert("Submissions open in a later development phase.")}>Start a submission</Button></div>}
  </PageFrame>;
}

function indexFor(book: Book) { return book.id === "monsoon-letters" ? "436" : book.id === "where-forest-ends" ? "287" : "194"; }

function Metric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return <div className="rounded-lg border border-border bg-card p-4"><span className="flex items-center justify-between text-muted-foreground">{label}<span className="grid size-8 place-items-center rounded-md bg-secondary text-primary">{icon}</span></span><span className="mt-3 block font-display text-2xl font-semibold">{value}</span></div>;
}

function AuthDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [submitted, setSubmitted] = useState(false);
  const onSubmit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSubmitted(true); };
  return <Dialog open={open} onOpenChange={(value) => { onOpenChange(value); setSubmitted(false); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[430px]"><DialogHeader><DialogTitle className="font-display text-2xl">{mode === "signin" ? "Welcome back" : "Find your next favourite"}</DialogTitle><DialogDescription>{mode === "signin" ? "Sign in to your BOOKVERSE reading room." : "Create your free reader account."}</DialogDescription></DialogHeader>{submitted ? <div className="rounded-md border border-border bg-secondary/60 p-4"><p className="text-sm font-semibold">Account access isn’t connected yet</p><p className="mt-1 text-xs leading-5 text-muted-foreground">This screen is ready for the authentication phase. No account has been created or signed in.</p></div> : <form onSubmit={onSubmit} className="mt-2 grid gap-4"><label className="grid gap-1.5 text-sm font-medium">Email address<Input type="email" required placeholder="you@example.com" /></label><label className="grid gap-1.5 text-sm font-medium">Password<Input type="password" required minLength={8} placeholder="At least 8 characters" /></label>{mode === "register" && <label className="grid gap-1.5 text-sm font-medium">I’m joining as<select className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option>A reader</option><option>An author</option></select></label>}<Button type="submit" className="w-full">{mode === "signin" ? "Sign in" : "Create account"}</Button></form>}<p className="mt-4 text-center text-xs text-muted-foreground">{mode === "signin" ? "New to BOOKVERSE?" : "Already have an account?"} <button className="font-semibold text-primary hover:underline" onClick={() => { setMode(mode === "signin" ? "register" : "signin"); setSubmitted(false); }}>{mode === "signin" ? "Join free" : "Sign in"}</button></p></DialogContent></Dialog>;
}

function ReaderDialog({ book, onOpenChange }: { book: Book | null; onOpenChange: (open: boolean) => void }) {
  const [page, setPage] = useState(1);
  const [fontSize, setFontSize] = useState(18);
  const [dark, setDark] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  if (!book) return null;
  return <Dialog open={Boolean(book)} onOpenChange={(open) => { onOpenChange(open); if (!open) setPage(1); }}><DialogContent className="max-h-[94vh] overflow-hidden p-0 sm:max-w-3xl"><div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6"><div className="min-w-0"><p className="truncate text-sm font-semibold">{book.title}</p><p className="mt-0.5 text-xs text-muted-foreground">Reading preview · {book.author}</p></div><div className="flex items-center gap-1"><Button variant="ghost" size="icon" aria-label="Decrease text size" onClick={() => setFontSize((size) => Math.max(14, size - 1))}><ZoomOut className="size-4" /></Button><Button variant="ghost" size="icon" aria-label="Increase text size" onClick={() => setFontSize((size) => Math.min(24, size + 1))}><ZoomIn className="size-4" /></Button><Button variant="ghost" size="icon" aria-label={dark ? "Use light reading theme" : "Use dark reading theme"} onClick={() => setDark((value) => !value)}>{dark ? <Sun className="size-4" /> : <Moon className="size-4" />}</Button><Button variant="ghost" size="icon" aria-label={bookmarked ? "Remove bookmark" : "Bookmark this page"} onClick={() => setBookmarked((value) => !value)}><Bookmark className={`size-4 ${bookmarked ? "fill-current text-primary" : ""}`} /></Button></div></div><div className={`max-h-[65vh] overflow-y-auto px-7 py-10 sm:px-16 sm:py-14 ${dark ? "bg-foreground text-background" : "bg-background text-foreground"}`}><p className="mx-auto max-w-[560px] font-display text-2xl leading-relaxed" style={{ fontSize }}>{book.title}</p><p className="mx-auto mt-8 max-w-[560px] text-[length:var(--reader-size)] leading-[1.9]" style={{ "--reader-size": `${fontSize}px` } as React.CSSProperties}>The rain had a way of changing the colour of the whole street. By evening, every window was lit, the old stone steps shone, and the world seemed to pause between one thought and the next.<br /><br />Somewhere beyond the rooftops, a familiar story was beginning again. It carried the scent of wet earth and the soft promise that, even after the longest journey, there was still a place to return to.<br /><br />This is a short reading preview. The complete book will be available when licensed reading access is connected.</p></div><div className="flex items-center justify-between border-t border-border px-4 py-3 sm:px-6"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ArrowLeft className="mr-1 size-4" /> Previous</Button><span className="text-xs text-muted-foreground">Preview page {page} of 3{bookmarked ? " · Bookmarked" : ""}</span><Button variant="outline" size="sm" disabled={page === 3} onClick={() => setPage((value) => Math.min(3, value + 1))}>Next <ArrowRight className="ml-1 size-4" /></Button></div></DialogContent></Dialog>;
}

function Footer() {
  return <footer className="border-t border-border bg-secondary/30"><div className="mx-auto grid max-w-[1380px] gap-8 px-5 py-9 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8"><div><Link to="/" className="inline-flex items-center gap-2 font-display text-lg font-bold"><span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground"><BookOpen className="size-4" /></span> BOOKVERSE</Link><p className="mt-3 max-w-xs text-xs leading-5 text-muted-foreground">One Platform. Endless Stories.</p></div><FooterColumn title="Discover" links={[["Explore books", "/explore"], ["Categories", "/categories"], ["Free reads", "/free"], ["BOOKVERSE Plus", "/premium"]]} /><FooterColumn title="Community" links={[["Our authors", "/authors"], ["Author studio", "/dashboard/author"], ["My library", "/dashboard"]]} /><div><p className="text-xs font-semibold">BOOKVERSE preview</p><p className="mt-3 text-xs leading-5 text-muted-foreground">Sample titles and dashboard figures are for preview only. Accounts, checkout, and saved data are not connected.</p></div></div><div className="border-t border-border"><div className="mx-auto flex max-w-[1380px] flex-wrap justify-between gap-2 px-5 py-4 text-[11px] text-muted-foreground lg:px-8"><span>© 2026 BOOKVERSE. One Platform. Endless Stories.</span><span>Independent stories. Shared with care.</span></div></div></footer>;
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return <div><p className="text-xs font-semibold">{title}</p><div className="mt-3 grid gap-2.5">{links.map(([label, to]) => <Link key={label} to={to} className="text-xs text-muted-foreground hover:text-foreground">{label}</Link>)}</div></div>;
}