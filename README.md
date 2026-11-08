# BOOKVERSE — Digital Reading Platform

**Tagline:** One Platform. Endless Stories.

BOOKVERSE is a production-oriented digital reading platform where users can discover, read, and purchase digital books across Tamil and English literature, novels, short stories, comics, and manga.

---

## 1. BACKEND ARCHITECTURE & PHASE 3 PRODUCTION FOUNDATION

BOOKVERSE Phase 3 establishes the complete production database foundation, Role-Based Access Control (RBAC), and security policies built around **Supabase (PostgreSQL 15+, Supabase Auth, Row Level Security, and Storage)** with **TanStack Start / React 19** SSR:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          BOOKVERSE FRONTEND                            │
│           (TanStack Start, Vite, React 19, Tailwind CSS v4)            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────────────┐
│         Supabase Auth Engine         │  │        Supabase PostgREST API        │
│  - Session JWT persistence           │  │  - Strongly typed client queries     │
│  - Email/Password auth               │  │  - Performance-optimized RLS queries │
│  - Password reset workflows          │  │  - Direct connection pooling         │
└──────────────────┬───────────────────┘  └──────────────────┬───────────────────┘
                   │                                         │
                   ▼                                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      SUPABASE POSTGRESQL DATABASE                      │
│                                                                        │
│  [Core Tables - Phase 3]                                               │
│   profiles               user_roles             authors                │
│   categories             books                  purchases              │
│   subscriptions          bookmarks              reading_progress       │
│   author_submissions     payment_transactions   favourites             │
│   notifications                                                        │
│                                                                        │
│  [Security & Protection Layer]                                         │
│   - Row Level Security (RLS) on ALL tables with (select auth.uid())    │
│   - No credit cards, CVVs, or UPI PINs stored (PCI-DSS compliance)     │
│   - Private manuscripts & paid content gating (has_book_access)        │
│   - Role escalation prevention (strict server checks)                  │
│   - Automated triggers: handle_new_user, handle_updated_at             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. PRODUCTION DATABASE SCHEMA (10 Core Tables)

The version-controlled Phase 3 migration file is located at [`database/migrations/20260402000000_phase3_production_schema.sql`](file:///Users/muhammedhshamsu/bookverse-reading-nook/database/migrations/20260402000000_phase3_production_schema.sql):

| Table | Primary Key | Key Foreign Keys | Purpose & Security Scope |
|---|---|---|---|
| **`profiles`** | `id UUID` | `id -> auth.users(id)` | User profile metadata, preferred language, account status. Strict self-update or admin-update. |
| **`user_roles`** | `id UUID` | `user_id -> auth.users(id)` | RBAC roles (`customer`, `author`, `admin`). Strict admin-only modification; no self-promotion. |
| **`authors`** | `id UUID` | `user_id -> auth.users(id)` | Author verification state, bio, portrait, application status (`pending`, `approved`, `rejected`). |
| **`categories`** | `id UUID` | None | Book taxonomy and language classification. Public read; admin manage. Includes `book_categories` compatibility view. |
| **`books`** | `id UUID` | `author_id -> authors(id)`, `category_id -> categories(id)` | Book catalog with pricing, format, and publication status (`draft`, `pending`, `published`). Public reads published only. |
| **`purchases`** | `id UUID` | `user_id -> auth.users(id)`, `book_id -> books(id)` | One-time book purchases. Customers access only their own purchases; authors see book sales; admins see all. |
| **`subscriptions`** | `id UUID` | `user_id -> auth.users(id)` | Reader subscriptions (`plus_monthly`, `plus_annual`, `patron_monthly`). Managed by server/admin; customers read own. |
| **`bookmarks`** | `id UUID` | `user_id -> auth.users(id)`, `book_id -> books(id)` | Reader page markers. Isolated strictly to the owning user. |
| **`reading_progress`**| `id UUID` | `user_id -> auth.users(id)`, `book_id -> books(id)` | Real-time reading position and progress percentage (0-100%). Strict owner isolation. |
| **`author_submissions`**| `id UUID` | `author_id -> authors(id)`, `book_id -> books(id)` | Manuscript submissions for editorial review. Authors view own; cannot self-approve. Admins review and approve. |
| **`payment_transactions`**| `id UUID` | `user_id -> auth.users(id)` | Payment audit log. **STRICT RULE:** Stores only status and external gateway reference. No card numbers, CVVs, or PINs. |
| **`favourites`** | `id UUID` | `user_id -> auth.users(id)`, `book_id -> books(id)` | Saved books and personal reader wishlist. Strict owner isolation. |
| **`notifications`**| `id UUID` | `user_id -> auth.users(id)` | Platform notifications and editorial alerts. |

---

## 3. ROLE-BASED ACCESS CONTROL (RBAC)

The platform enforces three distinct user roles managed in `public.user_roles`:

| Role | Access Scope | Capabilities | Restrictions |
|---|---|---|---|
| **CUSTOMER** | Customer Dashboard (`/library`) | Manage profile, view personal library, view purchases, track reading progress, manage bookmarks, save favourites, receive notifications. | Cannot access Author Studio, Admin Control, or alter system roles. |
| **AUTHOR** | Author Studio (`/author-studio`) | Manage author profile, view submitted manuscripts, view approved/published books, track sales and earnings. | Cannot self-approve manuscripts or books to `published`. Cannot access Admin Control. |
| **ADMIN** | Admin Control (`/admin`) | Approve/reject author applications, review and approve author manuscripts, manage categories, oversee users & roles. | Full administrative oversight secured by PostgreSQL RLS. |

> [!IMPORTANT]
> **Privilege Escalation Prevention:** Role assignment is strictly locked down. Regular users cannot assign themselves `author` or `admin` roles via frontend requests. When a user requests author status at signup, an application record is placed into `public.authors` with `status = 'pending'`, which must be reviewed by an administrator before publishing privileges are granted.

---

## 4. ROW LEVEL SECURITY (RLS) POLICIES & SECURITY DESIGN

Row Level Security is enabled on **every** user-facing table:

- **100x Cached RLS Performance:** All policies wrap the caller identity in `(select auth.uid())` per Supabase performance best practices, eliminating per-row function evaluation.
- **Foreign Key Indexing:** Every foreign key column used in RLS policies (`user_id`, `book_id`, `author_id`, `category_id`, `status`) is explicitly indexed.
- **Paid Content Access (`public.has_book_access`):**
  - Free books are readable by all visitors.
  - Author always retains access to their own manuscripts.
  - Administrators retain platform oversight.
  - Paid books require a completed purchase record (`purchases.status = 'completed'` AND `access_granted = true`).
  - Premium-tier books require an active subscription (`subscriptions.status = 'active'`).
- **Payment & Financial Security (PCI-DSS Compliance):**
  - Credit card numbers, CVVs, and UPI PINs are **NEVER** stored in application tables.
  - Defensive `CHECK` constraint on `payment_transactions` forbids storage of card/PIN attributes.
- **Manuscript File Privacy:**
  - Manuscripts are stored in a private Supabase Storage bucket (`manuscripts`) accessible only to the author and platform administrators. Book cover images are served from the public `book_covers` bucket.

---

## 5. MIGRATION INSTRUCTIONS

To apply the Phase 3 schema to your Supabase project:

### Option A: Supabase Dashboard SQL Editor (Recommended)
1. Open your [Supabase Dashboard](https://supabase.com/dashboard/project/xcwhwkbyhkxtmelclpgr).
2. Click on **SQL Editor** in the left sidebar.
3. Open [`database/migrations/20260402000000_phase3_production_schema.sql`](file:///Users/muhammedhshamsu/bookverse-reading-nook/database/migrations/20260402000000_phase3_production_schema.sql) and paste its contents into the SQL Editor.
4. Click **Run** to execute the migration.
5. (Optional development seed): To populate sample categories and development demo books, run [`database/seed.sql`](file:///Users/muhammedhshamsu/bookverse-reading-nook/database/seed.sql).

### Option B: Supabase CLI
```sh
npx supabase link --project-ref xcwhwkbyhkxtmelclpgr
npx supabase db push
```

---

## 6. ENVIRONMENT VARIABLES

Ensure your `.env` contains your Supabase project URL and publishable key:

```env
# Supabase Project API URL
VITE_SUPABASE_URL=https://xcwhwkbyhkxtmelclpgr.supabase.co

# Supabase Public Publishable/Anonymous Key
VITE_SUPABASE_ANON_KEY=sb_publishable_tYYljRePNaL18BDGI5AUIA_-UsIXFnI
```

> [!CAUTION]
> **Never include the Supabase `service_role` key in frontend code or environment files.** The frontend requires only the public publishable key; all security, isolation, and access controls are strictly enforced at the database level by PostgreSQL Row Level Security (RLS).

---

## 7. AUTOMATED VERIFICATION & TEST SUITE

The test suite validates authentication rules, RBAC guards, database RLS constraints, and credential exposure prevention:

```sh
# Run all Phase 3 tests
npm test
```

### Test Coverage Summary (44 Tests, 6 Suites):
- [`src/test/supabase-connection.test.ts`](file:///Users/muhammedhshamsu/bookverse-reading-nook/src/test/supabase-connection.test.ts): Live Auth HTTP 200 ping, session check, publishable key verification.
- [`src/test/auth.test.ts`](file:///Users/muhammedhshamsu/bookverse-reading-nook/src/test/auth.test.ts): Configuration detection, password validation, email regex, terms acceptance.
- [`src/test/rbac-permissions.test.ts`](file:///Users/muhammedhshamsu/bookverse-reading-nook/src/test/rbac-permissions.test.ts): Customer, Author, and Administrator route and capability guards, self-elevation prevention.
- [`src/test/database-rls.test.ts`](file:///Users/muhammedhshamsu/bookverse-reading-nook/src/test/database-rls.test.ts): Profiles isolation, reading progress bounds, bookmark & favourite ownership, manuscript storage privacy, purchases & subscriptions isolation, author submission rules, paid content protection (`has_book_access`).
- [`src/test/security.test.ts`](file:///Users/muhammedhshamsu/bookverse-reading-nook/src/test/security.test.ts): Zero exposed secret keys, `.gitignore` `.env` protection, environment placeholder validation, PCI-sensitive data exclusion.
- [`src/test/app-routing.test.tsx`](file:///Users/muhammedhshamsu/bookverse-reading-nook/src/test/app-routing.test.tsx): TanStack route tree resolution.

---

## 8. LOCAL DEVELOPMENT

```sh
# Install dependencies
npm install

# Run development server
npm run dev

# Run test suite
npm test

# Build for production
npm run build
```
