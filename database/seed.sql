-- ============================================================================
-- BOOKVERSE – Phase 3: Development Seed Data
-- File: database/seed.sql
-- 
-- CAUTION:
-- This file is intended ONLY for development and local testing environments.
-- DO NOT execute against production if you do not want demo catalog items.
-- ============================================================================

-- 1. BOOK CATEGORIES (Production-safe base categories)
INSERT INTO public.categories (category_name, description, language)
VALUES 
    ('Tamil Literature', 'Classic and contemporary Tamil literature, Sangam poetry, and epics', 'Tamil'),
    ('Tamil Novels', 'Engaging contemporary and historical fiction written in Tamil', 'Tamil'),
    ('Novels', 'Full-length fictional prose narratives exploring human experiences', 'English'),
    ('Short Stories', 'Brief, evocative works of prose fiction', 'English'),
    ('Romance', 'Heartfelt tales of connection, love, and relationships', 'English'),
    ('Mystery & Thriller', 'Gripping detective, whodunit, and suspense mysteries', 'English'),
    ('Fantasy', 'Magical realms, mythical creatures, and epic adventures', 'English'),
    ('Science Fiction', 'Futuristic voyages, cosmic journeys, and speculative science', 'English'),
    ('Comics & Graphic Novels', 'Graphic sequential art and illustrated narratives', 'English'),
    ('Manga', 'Japanese-inspired illustrated graphic narratives and serials', 'English')
ON CONFLICT (category_name) DO UPDATE
SET description = EXCLUDED.description,
    language = EXCLUDED.language;

-- 2. SAMPLE DEVELOPMENT BOOKS (Clearly labeled for development only)
-- NOTE: author_id is left NULL initially until real author accounts are approved
INSERT INTO public.books (
    title,
    description,
    category_id,
    language,
    cover_image,
    book_format,
    price,
    access_type,
    publication_status
)
SELECT 
    'Ponniyin Selvan (Sample Excerpt)',
    'The historical saga of the Chola dynasty, intrigue, and naval adventure.',
    c.id,
    'Tamil',
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
    'ebook',
    0.00,
    'free',
    'published'
FROM public.categories c
WHERE c.category_name = 'Tamil Literature'
ON CONFLICT DO NOTHING;

INSERT INTO public.books (
    title,
    description,
    category_id,
    language,
    cover_image,
    book_format,
    price,
    access_type,
    publication_status
)
SELECT 
    'The Celestial Observatory',
    'An atmospheric science fiction mystery set on a deep-space research station orbiting a dying star.',
    c.id,
    'English',
    'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&q=80&w=600',
    'ebook',
    199.00,
    'paid',
    'published'
FROM public.categories c
WHERE c.category_name = 'Science Fiction'
ON CONFLICT DO NOTHING;

INSERT INTO public.books (
    title,
    description,
    category_id,
    language,
    cover_image,
    book_format,
    price,
    access_type,
    publication_status
)
SELECT 
    'The Whispering Archive',
    'Curated stories and lost manuscripts available exclusively to BOOKVERSE Plus subscribers.',
    c.id,
    'English',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600',
    'ebook',
    0.00,
    'premium',
    'published'
FROM public.categories c
WHERE c.category_name = 'Mystery & Thriller'
ON CONFLICT DO NOTHING;
