-- BOOKVERSE Phase 2: Database Schema, RBAC, and Row Level Security
-- Migration: 20260401000000_phase2_backend_schema.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- ============================================================================
-- 2. USER ROLES TABLE (RBAC)
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
-- 4. BOOK CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.book_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name TEXT NOT NULL UNIQUE,
    description TEXT,
    language TEXT NOT NULL DEFAULT 'All',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_categories_name ON public.book_categories(category_name);

-- ============================================================================
-- 5. BOOKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    author_id UUID REFERENCES public.authors(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.book_categories(id) ON DELETE SET NULL,
    language TEXT NOT NULL DEFAULT 'English',
    cover_image TEXT,
    book_format TEXT NOT NULL DEFAULT 'ebook',
    file_path TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
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
-- 6. READING PROGRESS TABLE
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

-- ============================================================================
-- 7. BOOKMARKS TABLE
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

-- ============================================================================
-- 8. FAVOURITES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.favourites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_favourites_user_book UNIQUE (user_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_favourites_user ON public.favourites(user_id);

-- ============================================================================
-- 9. NOTIFICATIONS TABLE
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
-- HELPER FUNCTIONS FOR SECURITY DEFINER ROLE CHECKS
-- ============================================================================
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

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(_user_id, 'admin');
$$;

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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_authors_updated_at ON public.authors;
CREATE TRIGGER set_authors_updated_at
    BEFORE UPDATE ON public.authors
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_books_updated_at ON public.books;
CREATE TRIGGER set_books_updated_at
    BEFORE UPDATE ON public.books
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- AUTHENTICATION TRIGGER: USER CREATION
-- Automatically provisions profiles, default customer role, and author application
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
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    requested_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'requested_role', 'customer'));

    -- 1. Create Profile
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, user_full_name)
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);

    -- 2. Every registered user is granted the 'customer' role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'customer')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- 3. If joining as author, register pending author application (NEVER auto-grant author/admin role)
    IF requested_role = 'author' THEN
        INSERT INTO public.authors (user_id, author_name, application_status)
        VALUES (NEW.id, user_full_name, 'pending')
        ON CONFLICT (user_id) DO NOTHING;

        -- Send initial notification
        INSERT INTO public.notifications (user_id, title, message, notification_type)
        VALUES (
            NEW.id,
            'Author Application Received',
            'Your author application has been submitted and is pending review by the BOOKVERSE editorial team.',
            'author_application'
        );
    ELSE
        -- Customer welcome notification
        INSERT INTO public.notifications (user_id, title, message, notification_type)
        VALUES (
            NEW.id,
            'Welcome to BOOKVERSE!',
            'Explore stories across Tamil and English literature, novels, and comics.',
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

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favourites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- PROFILES POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own profile or admins view all" ON public.profiles;
CREATE POLICY "Users can view their own profile or admins view all"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can update their own profile or admins update all" ON public.profiles;
CREATE POLICY "Users can update their own profile or admins update all"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_admin(auth.uid()))
    WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Profiles insert allowed for user or admin" ON public.profiles;
CREATE POLICY "Profiles insert allowed for user or admin"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- USER ROLES POLICIES (Users cannot elevate their own roles!)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read their own roles or admin read all" ON public.user_roles;
CREATE POLICY "Users can read their own roles or admin read all"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Only admins can insert user roles" ON public.user_roles;
CREATE POLICY "Only admins can insert user roles"
    ON public.user_roles FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Only admins can update user roles" ON public.user_roles;
CREATE POLICY "Only admins can update user roles"
    ON public.user_roles FOR UPDATE
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Only admins can delete user roles" ON public.user_roles;
CREATE POLICY "Only admins can delete user roles"
    ON public.user_roles FOR DELETE
    USING (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- AUTHORS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view approved authors, authors view own, admin view all" ON public.authors;
CREATE POLICY "Public can view approved authors, authors view own, admin view all"
    ON public.authors FOR SELECT
    USING (
        application_status = 'approved'
        OR auth.uid() = user_id
        OR public.is_admin(auth.uid())
    );

DROP POLICY IF EXISTS "Users can submit author application" ON public.authors;
CREATE POLICY "Users can submit author application"
    ON public.authors FOR INSERT
    WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authors update own pending profile, admins update any" ON public.authors;
CREATE POLICY "Authors update own pending profile, admins update any"
    ON public.authors FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
    WITH CHECK (
        -- Regular authors cannot set application_status to 'approved' themselves!
        public.is_admin(auth.uid())
        OR (auth.uid() = user_id AND application_status = 'pending')
    );

-- ----------------------------------------------------------------------------
-- BOOK CATEGORIES POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view categories" ON public.book_categories;
CREATE POLICY "Anyone can view categories"
    ON public.book_categories FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.book_categories;
CREATE POLICY "Admins can manage categories"
    ON public.book_categories FOR ALL
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- BOOKS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view published books" ON public.books;
CREATE POLICY "Anyone can view published books"
    ON public.books FOR SELECT
    USING (
        publication_status = 'published'
        OR public.is_admin(auth.uid())
        OR author_id IN (SELECT id FROM public.authors WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Approved authors or admins can insert books" ON public.books;
CREATE POLICY "Approved authors or admins can insert books"
    ON public.books FOR INSERT
    WITH CHECK (
        public.is_admin(auth.uid())
        OR (
            public.is_approved_author(auth.uid())
            AND author_id IN (SELECT id FROM public.authors WHERE user_id = auth.uid())
            -- Authors cannot directly publish books without review
            AND publication_status IN ('draft', 'pending')
        )
    );

DROP POLICY IF EXISTS "Authors update own drafts/pending, admins update all" ON public.books;
CREATE POLICY "Authors update own drafts/pending, admins update all"
    ON public.books FOR UPDATE
    USING (
        public.is_admin(auth.uid())
        OR (
            author_id IN (SELECT id FROM public.authors WHERE user_id = auth.uid())
            AND publication_status != 'published'
        )
    )
    WITH CHECK (
        public.is_admin(auth.uid())
        OR (
            author_id IN (SELECT id FROM public.authors WHERE user_id = auth.uid())
            -- Authors cannot self-approve to published
            AND publication_status != 'published'
        )
    );

DROP POLICY IF EXISTS "Admins can delete books" ON public.books;
CREATE POLICY "Admins can delete books"
    ON public.books FOR DELETE
    USING (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- READING PROGRESS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read own reading progress" ON public.reading_progress;
CREATE POLICY "Users can read own reading progress"
    ON public.reading_progress FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own reading progress" ON public.reading_progress;
CREATE POLICY "Users can insert own reading progress"
    ON public.reading_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reading progress" ON public.reading_progress;
CREATE POLICY "Users can update own reading progress"
    ON public.reading_progress FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reading progress" ON public.reading_progress;
CREATE POLICY "Users can delete own reading progress"
    ON public.reading_progress FOR DELETE
    USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- BOOKMARKS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can view own bookmarks"
    ON public.bookmarks FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can insert own bookmarks"
    ON public.bookmarks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can delete own bookmarks"
    ON public.bookmarks FOR DELETE
    USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- FAVOURITES POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own favourites" ON public.favourites;
CREATE POLICY "Users can view own favourites"
    ON public.favourites FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own favourites" ON public.favourites;
CREATE POLICY "Users can insert own favourites"
    ON public.favourites FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own favourites" ON public.favourites;
CREATE POLICY "Users can delete own favourites"
    ON public.favourites FOR DELETE
    USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notification read status" ON public.notifications;
CREATE POLICY "Users can update own notification read status"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins or system can insert notifications" ON public.notifications;
CREATE POLICY "Admins or system can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()) OR auth.uid() = user_id);

-- ============================================================================
-- STORAGE BUCKETS CONFIGURATION (PREPARATION)
-- ============================================================================
-- Insert public and private buckets if storage extension is installed
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('book_covers', 'book_covers', true),
    ('manuscripts', 'manuscripts', false)
ON CONFLICT (id) DO NOTHING;

-- Public cover access
DROP POLICY IF EXISTS "Cover images are publicly accessible" ON storage.objects;
CREATE POLICY "Cover images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'book_covers');

-- Manuscripts are private to author and admin
DROP POLICY IF EXISTS "Manuscripts are private to author and admin" ON storage.objects;
CREATE POLICY "Manuscripts are private to author and admin"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'manuscripts'
        AND (
            public.is_admin(auth.uid())
            OR (auth.uid()::text = (storage.foldername(name))[1])
        )
    );

