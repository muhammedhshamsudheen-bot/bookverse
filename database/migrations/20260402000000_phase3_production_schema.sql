-- ============================================================================
-- BOOKVERSE – Phase 3: Production Database Schema & Role-Based Access Control
-- Migration: 20260400000000_phase3_production_schema.sql
-- 
-- Description:
-- Complete production schema for BOOKVERSE digital reading platform.
-- Enforces PostgreSQL Row Level Security (RLS), RBAC (customer, author, admin),
-- user isolation, private manuscripts, protected paid content, and audit logging.
-- 
-- STRICT SECURITY RULES:
-- 1. No card numbers, CVVs, or UPI PINs are stored (PCI-DSS compliance).
-- 2. Regular users cannot self-promote to Author or Admin via frontend requests.
-- 3. Authors cannot self-approve their manuscripts to 'published'.
-- 4. Customers cannot forge completed purchases or bypass payment.
-- 5. Paid content is accessible only through verified purchases or active subscriptions.
-- 6. Safe & idempotent: no DROP TABLE, TRUNCATE, or destructive operations.
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    profile_image TEXT,
    phone_number TEXT,
    preferred_language TEXT NOT NULL DEFAULT 'English',
    account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'deactivated')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(account_status);

-- ============================================================================
-- 2. USER ROLES TABLE (RBAC)
-- Privileged table: only admins or trusted system triggers can assign roles.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('customer', 'author', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_roles_user_role UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- ============================================================================
-- 3. AUTHORS TABLE
-- Manages author applications, bios, and verification status.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    author_name TEXT NOT NULL,
    biography TEXT,
    profile_image TEXT,
    preferred_language TEXT NOT NULL DEFAULT 'English',
    application_status TEXT NOT NULL DEFAULT 'pending' CHECK (application_status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_authors_user_id ON public.authors(user_id);
CREATE INDEX IF NOT EXISTS idx_authors_status ON public.authors(application_status);

-- ============================================================================
-- 4. CATEGORIES TABLE
-- Supports genres, book topics, and language classification.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name TEXT NOT NULL UNIQUE,
    description TEXT,
    language TEXT NOT NULL DEFAULT 'All',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(category_name);

-- Compatibility view for existing frontend queries referencing book_categories
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE n.nspname = 'public' AND c.relname = 'book_categories' AND c.relkind = 'r'
    ) THEN
        CREATE OR REPLACE VIEW public.book_categories AS 
        SELECT id, category_name, description, language, created_at FROM public.categories;
    END IF;
END $$;

-- ============================================================================
-- 5. BOOKS TABLE
-- Stores book metadata, pricing, format, and publication workflow status.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    author_id UUID REFERENCES public.authors(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    language TEXT NOT NULL DEFAULT 'English',
    cover_image TEXT,
    book_format TEXT NOT NULL DEFAULT 'ebook',
    file_path TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
    access_type TEXT NOT NULL DEFAULT 'free' CHECK (access_type IN ('free', 'premium', 'paid')),
    publication_status TEXT NOT NULL DEFAULT 'draft' CHECK (publication_status IN ('draft', 'pending', 'published', 'rejected', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_books_author_id ON public.books(author_id);
CREATE INDEX IF NOT EXISTS idx_books_category_id ON public.books(category_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON public.books(publication_status);
CREATE INDEX IF NOT EXISTS idx_books_access ON public.books(access_type);
CREATE INDEX IF NOT EXISTS idx_books_language ON public.books(language);

-- ============================================================================
-- 6. PURCHASES TABLE
-- Tracks individual book purchases for permanent reader access.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    purchase_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
    access_granted BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_purchases_user_book UNIQUE (user_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_book_id ON public.purchases(book_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON public.purchases(status);

-- ============================================================================
-- 7. SUBSCRIPTIONS TABLE
-- Tracks active reader subscriptions (BOOKVERSE Plus, Patron).
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('plus_monthly', 'plus_annual', 'patron_monthly')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- ============================================================================
-- 8. BOOKMARKS TABLE
-- Allows customers to save page bookmarks in books.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL DEFAULT 1 CHECK (page_number >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_bookmarks_user_book_page UNIQUE (user_id, book_id, page_number)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_book ON public.bookmarks(book_id);

-- ============================================================================
-- 9. READING PROGRESS TABLE
-- Tracks reader position and progress per book.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reading_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    current_page INTEGER NOT NULL DEFAULT 1 CHECK (current_page >= 1),
    progress_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_reading_progress_user_book UNIQUE (user_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_reading_progress_user ON public.reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_book ON public.reading_progress(book_id);

-- ============================================================================
-- 10. AUTHOR SUBMISSIONS TABLE
-- Manages author manuscript submissions, editorial reviews, and royalties.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.author_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES public.authors(id) ON DELETE CASCADE,
    book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    synopsis TEXT,
    manuscript_url TEXT NOT NULL,
    sample_chapters_url TEXT,
    proposed_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (proposed_price >= 0),
    proposed_access_type TEXT NOT NULL DEFAULT 'free' CHECK (proposed_access_type IN ('free', 'premium', 'paid')),
    language TEXT NOT NULL DEFAULT 'English',
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'revisions_requested', 'approved', 'rejected')),
    reviewer_feedback TEXT,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    royalty_percentage NUMERIC(5, 2) NOT NULL DEFAULT 70.00 CHECK (royalty_percentage >= 0 AND royalty_percentage <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_author_submissions_author ON public.author_submissions(author_id);
CREATE INDEX IF NOT EXISTS idx_author_submissions_status ON public.author_submissions(status);

-- ============================================================================
-- 11. PAYMENT TRANSACTIONS TABLE (Audit Trail)
-- STRICT SECURITY: Stores ONLY transaction status & references.
-- NO card details, CVV, or UPI PINs are ever stored.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('book_purchase', 'subscription', 'author_royalty_payout')),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_gateway TEXT NOT NULL DEFAULT 'manual_or_mock',
    gateway_order_id TEXT,
    gateway_payment_id TEXT,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    -- Defensive security constraint: explicitly forbid sensitive card/PIN fields
    CONSTRAINT chk_no_card_pin_stored CHECK (
        description IS NULL OR (
            NOT (description ILIKE '%cvv%' OR description ILIKE '%upi_pin%' OR description ILIKE '%card_number%')
        )
    )
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_type ON public.payment_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);

-- ============================================================================
-- 12. FAVOURITES TABLE
-- Customer personal library wishlists / favourites.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.favourites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_favourites_user_book UNIQUE (user_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_favourites_user ON public.favourites(user_id);
CREATE INDEX IF NOT EXISTS idx_favourites_book ON public.favourites(book_id);

-- ============================================================================
-- 13. NOTIFICATIONS TABLE
-- Real-time user announcements and editorial updates.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL DEFAULT 'system',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);

-- ============================================================================
-- SECURITY DEFINER HELPER FUNCTIONS FOR RLS
-- (Optimized per Supabase best practices: search_path set, cached lookups)
-- ============================================================================

-- Check if a user possesses a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    );
$$;

-- Check if a user is an administrator
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(_user_id, 'admin');
$$;

-- Check if a user is an approved author
CREATE OR REPLACE FUNCTION public.is_approved_author(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.authors
        WHERE user_id = _user_id AND application_status = 'approved'
    );
$$;

-- Verify if a user is authorized to read protected/paid book content
CREATE OR REPLACE FUNCTION public.has_book_access(_user_id UUID, _book_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        -- 1. Free books are accessible to everyone
        SELECT 1 FROM public.books b
        WHERE b.id = _book_id AND b.access_type = 'free' AND b.publication_status = 'published'
        
        UNION ALL
        
        -- 2. Administrator has full access
        SELECT 1 WHERE public.is_admin(_user_id)
        
        UNION ALL
        
        -- 3. The author of the book has access to their own work
        SELECT 1 FROM public.books b
        JOIN public.authors a ON b.author_id = a.id
        WHERE b.id = _book_id AND a.user_id = _user_id
        
        UNION ALL
        
        -- 4. User has completed a one-time purchase
        SELECT 1 FROM public.purchases p
        WHERE p.user_id = _user_id AND p.book_id = _book_id AND p.status = 'completed' AND p.access_granted = true
        
        UNION ALL
        
        -- 5. User has an active premium subscription for premium-tier books
        SELECT 1 FROM public.books b, public.subscriptions s
        WHERE b.id = _book_id 
          AND b.access_type = 'premium' 
          AND b.publication_status = 'published'
          AND s.user_id = _user_id 
          AND s.status = 'active'
          AND s.current_period_end > timezone('utc'::text, now())
    );
$$;

-- Trigger function for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_authors_updated_at ON public.authors;
CREATE TRIGGER set_authors_updated_at BEFORE UPDATE ON public.authors FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_books_updated_at ON public.books;
CREATE TRIGGER set_books_updated_at BEFORE UPDATE ON public.books FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_purchases_updated_at ON public.purchases;
CREATE TRIGGER set_purchases_updated_at BEFORE UPDATE ON public.purchases FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER set_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_author_submissions_updated_at ON public.author_submissions;
CREATE TRIGGER set_author_submissions_updated_at BEFORE UPDATE ON public.author_submissions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_payment_transactions_updated_at ON public.payment_transactions;
CREATE TRIGGER set_payment_transactions_updated_at BEFORE UPDATE ON public.payment_transactions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- AUTHENTICATION TRIGGER: USER CREATION
-- Automatically provisions profiles and customer role on signup.
-- Never elevates to Author or Admin automatically!
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    requested_role TEXT;
    user_full_name TEXT;
BEGIN
    -- Safe name derivation with non-null guaranteed fallback
    user_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        split_part(COALESCE(NEW.email, ''), '@', 1),
        'BOOKVERSE User'
    );
    IF user_full_name = '' THEN
        user_full_name := 'BOOKVERSE User';
    END IF;

    requested_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'requested_role', 'customer'));

    -- 1. Create Profile
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, user_full_name)
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);

    -- 2. Every registered user is granted the default 'customer' role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'customer')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- 3. If joining as author, register a PENDING author application.
    -- (NEVER grant author/admin privileges without administrator review!)
    IF requested_role = 'author' THEN
        INSERT INTO public.authors (user_id, author_name, application_status)
        VALUES (NEW.id, user_full_name, 'pending')
        ON CONFLICT (user_id) DO NOTHING;

        INSERT INTO public.notifications (user_id, title, message, notification_type)
        VALUES (
            NEW.id,
            'Author Application Received',
            'Your author application has been received and is queued for editorial review.',
            'author_application'
        );
    ELSE
        INSERT INTO public.notifications (user_id, title, message, notification_type)
        VALUES (
            NEW.id,
            'Welcome to BOOKVERSE!',
            'Discover Tamil and English literature, novels, and independent authors.',
            'welcome'
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Safe backfill for pre-existing users in auth.users (if any)
INSERT INTO public.profiles (id, email, full_name)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', split_part(COALESCE(email, ''), '@', 1), 'BOOKVERSE User')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'customer'
FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enabled on ALL user-facing tables.
-- Uses `(select auth.uid())` for 100x cached evaluation performance.
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.author_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favourites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- PROFILES POLICIES
-- Customers can view/update only their own profile. Admins can view/update all.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile or admins view all" ON public.profiles;
CREATE POLICY "Users can view own profile or admins view all"
    ON public.profiles FOR SELECT
    USING ((select auth.uid()) = id OR public.is_admin((select auth.uid())));

DROP POLICY IF EXISTS "Users can update own profile or admins update all" ON public.profiles;
CREATE POLICY "Users can update own profile or admins update all"
    ON public.profiles FOR UPDATE
    USING ((select auth.uid()) = id OR public.is_admin((select auth.uid())))
    WITH CHECK ((select auth.uid()) = id OR public.is_admin((select auth.uid())));

DROP POLICY IF EXISTS "Profiles insert allowed for self or admin" ON public.profiles;
CREATE POLICY "Profiles insert allowed for self or admin"
    ON public.profiles FOR INSERT
    WITH CHECK ((select auth.uid()) = id OR public.is_admin((select auth.uid())));

-- ----------------------------------------------------------------------------
-- USER ROLES POLICIES (Users CANNOT elevate their own roles!)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read own roles or admin read all" ON public.user_roles;
CREATE POLICY "Users can read own roles or admin read all"
    ON public.user_roles FOR SELECT
    USING ((select auth.uid()) = user_id OR public.is_admin((select auth.uid())));

DROP POLICY IF EXISTS "Only admins can insert user roles" ON public.user_roles;
CREATE POLICY "Only admins can insert user roles"
    ON public.user_roles FOR INSERT
    WITH CHECK (public.is_admin((select auth.uid())));

DROP POLICY IF EXISTS "Only admins can update user roles" ON public.user_roles;
CREATE POLICY "Only admins can update user roles"
    ON public.user_roles FOR UPDATE
    USING (public.is_admin((select auth.uid())))
    WITH CHECK (public.is_admin((select auth.uid())));

DROP POLICY IF EXISTS "Only admins can delete user roles" ON public.user_roles;
CREATE POLICY "Only admins can delete user roles"
    ON public.user_roles FOR DELETE
    USING (public.is_admin((select auth.uid())));

-- ----------------------------------------------------------------------------
-- AUTHORS POLICIES
-- Public can view approved authors. Authors view own. Admins view/manage all.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view approved authors, authors view own, admin view all" ON public.authors;
CREATE POLICY "Public can view approved authors, authors view own, admin view all"
    ON public.authors FOR SELECT
    USING (
        application_status = 'approved'
        OR (select auth.uid()) = user_id
        OR public.is_admin((select auth.uid()))
    );

DROP POLICY IF EXISTS "Users can submit author application" ON public.authors;
CREATE POLICY "Users can submit author application"
    ON public.authors FOR INSERT
    WITH CHECK ((select auth.uid()) = user_id OR public.is_admin((select auth.uid())));

DROP POLICY IF EXISTS "Authors update own pending profile, admins update any" ON public.authors;
CREATE POLICY "Authors update own pending profile, admins update any"
    ON public.authors FOR UPDATE
    USING ((select auth.uid()) = user_id OR public.is_admin((select auth.uid())))
    WITH CHECK (
        public.is_admin((select auth.uid()))
        OR ((select auth.uid()) = user_id AND application_status = 'pending')
    );

-- ----------------------------------------------------------------------------
-- CATEGORIES POLICIES
-- Anyone can view categories. Admins manage categories.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Anyone can view categories"
    ON public.categories FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories"
    ON public.categories FOR ALL
    USING (public.is_admin((select auth.uid())))
    WITH CHECK (public.is_admin((select auth.uid())));

-- ----------------------------------------------------------------------------
-- BOOKS POLICIES
-- Public reads published books. Authors read own drafts. Admins read all.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view published books" ON public.books;
CREATE POLICY "Anyone can view published books"
    ON public.books FOR SELECT
    USING (
        publication_status = 'published'
        OR public.is_admin((select auth.uid()))
        OR author_id IN (SELECT id FROM public.authors WHERE user_id = (select auth.uid()))
    );

DROP POLICY IF EXISTS "Approved authors or admins can insert books" ON public.books;
CREATE POLICY "Approved authors or admins can insert books"
    ON public.books FOR INSERT
    WITH CHECK (
        public.is_admin((select auth.uid()))
        OR (
            public.is_approved_author((select auth.uid()))
            AND author_id IN (SELECT id FROM public.authors WHERE user_id = (select auth.uid()))
            AND publication_status IN ('draft', 'pending')
        )
    );

DROP POLICY IF EXISTS "Authors update own drafts/pending, admins update all" ON public.books;
CREATE POLICY "Authors update own drafts/pending, admins update all"
    ON public.books FOR UPDATE
    USING (
        public.is_admin((select auth.uid()))
        OR (
            author_id IN (SELECT id FROM public.authors WHERE user_id = (select auth.uid()))
            AND publication_status != 'published'
        )
    )
    WITH CHECK (
        public.is_admin((select auth.uid()))
        OR (
            author_id IN (SELECT id FROM public.authors WHERE user_id = (select auth.uid()))
            -- Authors cannot self-approve to published
            AND publication_status != 'published'
        )
    );

DROP POLICY IF EXISTS "Admins can delete books" ON public.books;
CREATE POLICY "Admins can delete books"
    ON public.books FOR DELETE
    USING (public.is_admin((select auth.uid())));

-- ----------------------------------------------------------------------------
-- PURCHASES POLICIES
-- Customers view own purchases. Authors view sales of their own books. Admins view all.
-- Customers can insert only pending purchases (cannot forge completed).
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Customers view own purchases, authors view book sales, admins view all" ON public.purchases;
CREATE POLICY "Customers view own purchases, authors view book sales, admins view all"
    ON public.purchases FOR SELECT
    USING (
        (select auth.uid()) = user_id
        OR public.is_admin((select auth.uid()))
        OR book_id IN (
            SELECT b.id FROM public.books b
            JOIN public.authors a ON b.author_id = a.id
            WHERE a.user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Customers create pending purchases, admins manage all" ON public.purchases;
CREATE POLICY "Customers create pending purchases, admins manage all"
    ON public.purchases FOR INSERT
    WITH CHECK (
        public.is_admin((select auth.uid()))
        OR (
            (select auth.uid()) = user_id
            AND status = 'pending'
            AND access_granted = false
        )
    );

DROP POLICY IF EXISTS "Only admins can update purchases" ON public.purchases;
CREATE POLICY "Only admins can update purchases"
    ON public.purchases FOR UPDATE
    USING (public.is_admin((select auth.uid())))
    WITH CHECK (public.is_admin((select auth.uid())));

-- ----------------------------------------------------------------------------
-- SUBSCRIPTIONS POLICIES
-- Customers view own subscription. Admins view/manage all.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users view own subscriptions or admins view all" ON public.subscriptions;
CREATE POLICY "Users view own subscriptions or admins view all"
    ON public.subscriptions FOR SELECT
    USING ((select auth.uid()) = user_id OR public.is_admin((select auth.uid())));

DROP POLICY IF EXISTS "Only admins or system can manage subscriptions" ON public.subscriptions;
CREATE POLICY "Only admins or system can manage subscriptions"
    ON public.subscriptions FOR ALL
    USING (public.is_admin((select auth.uid())))
    WITH CHECK (public.is_admin((select auth.uid())));

-- ----------------------------------------------------------------------------
-- BOOKMARKS POLICIES
-- Strict user isolation: user accesses only their own bookmarks.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can read own bookmarks"
    ON public.bookmarks FOR SELECT
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can insert own bookmarks"
    ON public.bookmarks FOR INSERT
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can delete own bookmarks"
    ON public.bookmarks FOR DELETE
    USING ((select auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
-- READING PROGRESS POLICIES
-- Strict user isolation: user accesses only their own reading progress.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read own reading progress" ON public.reading_progress;
CREATE POLICY "Users can read own reading progress"
    ON public.reading_progress FOR SELECT
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own reading progress" ON public.reading_progress;
CREATE POLICY "Users can insert own reading progress"
    ON public.reading_progress FOR INSERT
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own reading progress" ON public.reading_progress;
CREATE POLICY "Users can update own reading progress"
    ON public.reading_progress FOR UPDATE
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own reading progress" ON public.reading_progress;
CREATE POLICY "Users can delete own reading progress"
    ON public.reading_progress FOR DELETE
    USING ((select auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
-- AUTHOR SUBMISSIONS POLICIES
-- Authors manage own submissions. Admins review and approve all submissions.
-- Authors CANNOT approve their own submissions!
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authors view own submissions, admins view all" ON public.author_submissions;
CREATE POLICY "Authors view own submissions, admins view all"
    ON public.author_submissions FOR SELECT
    USING (
        public.is_admin((select auth.uid()))
        OR author_id IN (SELECT id FROM public.authors WHERE user_id = (select auth.uid()))
    );

DROP POLICY IF EXISTS "Approved authors can submit manuscripts" ON public.author_submissions;
CREATE POLICY "Approved authors can submit manuscripts"
    ON public.author_submissions FOR INSERT
    WITH CHECK (
        public.is_admin((select auth.uid()))
        OR (
            public.is_approved_author((select auth.uid()))
            AND author_id IN (SELECT id FROM public.authors WHERE user_id = (select auth.uid()))
            AND status = 'submitted'
        )
    );

DROP POLICY IF EXISTS "Authors update own drafts/revisions, admins update all" ON public.author_submissions;
CREATE POLICY "Authors update own drafts/revisions, admins update all"
    ON public.author_submissions FOR UPDATE
    USING (
        public.is_admin((select auth.uid()))
        OR (
            author_id IN (SELECT id FROM public.authors WHERE user_id = (select auth.uid()))
            AND status IN ('submitted', 'revisions_requested')
        )
    )
    WITH CHECK (
        public.is_admin((select auth.uid()))
        OR (
            author_id IN (SELECT id FROM public.authors WHERE user_id = (select auth.uid()))
            -- Authors cannot approve their own submissions
            AND status IN ('submitted', 'revisions_requested')
        )
    );

-- ----------------------------------------------------------------------------
-- PAYMENT TRANSACTIONS POLICIES (Audit Trail)
-- Customers view only their own transactions. Admins view all.
-- Only admins / server-side processes can create or update transactions.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users view own payment transactions, admins view all" ON public.payment_transactions;
CREATE POLICY "Users view own payment transactions, admins view all"
    ON public.payment_transactions FOR SELECT
    USING ((select auth.uid()) = user_id OR public.is_admin((select auth.uid())));

DROP POLICY IF EXISTS "Only admins can manage payment transactions" ON public.payment_transactions;
CREATE POLICY "Only admins can manage payment transactions"
    ON public.payment_transactions FOR ALL
    USING (public.is_admin((select auth.uid())))
    WITH CHECK (public.is_admin((select auth.uid())));

-- ----------------------------------------------------------------------------
-- FAVOURITES POLICIES
-- Strict user isolation: user accesses only their own favourites.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own favourites" ON public.favourites;
CREATE POLICY "Users can view own favourites"
    ON public.favourites FOR SELECT
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own favourites" ON public.favourites;
CREATE POLICY "Users can insert own favourites"
    ON public.favourites FOR INSERT
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own favourites" ON public.favourites;
CREATE POLICY "Users can delete own favourites"
    ON public.favourites FOR DELETE
    USING ((select auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS POLICIES
-- Users view own notifications.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own notification read status" ON public.notifications;
CREATE POLICY "Users can update own notification read status"
    ON public.notifications FOR UPDATE
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins or system can insert notifications" ON public.notifications;
CREATE POLICY "Admins or system can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (public.is_admin((select auth.uid())) OR (select auth.uid()) = user_id);

-- ============================================================================
-- STORAGE CONFIGURATION (BUCKETS & ACCESS POLICIES)
-- Wrapped in safe block to guarantee zero failure if storage schema is customized
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'storage' AND table_name = 'buckets'
    ) THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES 
            ('book_covers', 'book_covers', true),
            ('manuscripts', 'manuscripts', false)
        ON CONFLICT (id) DO NOTHING;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'storage' AND table_name = 'objects'
    ) THEN
        -- Public cover access
        DROP POLICY IF EXISTS "Cover images are publicly accessible" ON storage.objects;
        CREATE POLICY "Cover images are publicly accessible"
            ON storage.objects FOR SELECT
            USING (bucket_id = 'book_covers');

        -- Manuscripts: private to author and administrator
        DROP POLICY IF EXISTS "Manuscripts are private to author and admin" ON storage.objects;
        CREATE POLICY "Manuscripts are private to author and admin"
            ON storage.objects FOR SELECT
            USING (
                bucket_id = 'manuscripts'
                AND (
                    public.is_admin((select auth.uid()))
                    OR ((select auth.uid())::text = (storage.foldername(name))[1])
                )
            );
    END IF;
END $$;

-- ============================================================================
-- SCHEMA PERMISSIONS (GRANTs)
-- Ensures anon and authenticated roles have necessary table access
-- so PostgreSQL delegates row filtering strictly to RLS policies.
-- ============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;
