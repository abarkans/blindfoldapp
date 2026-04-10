# Blindfold — Mystery Dating App

## Project Overview
A mystery dating web-app MVP where couples receive surprise date suggestions curated around their interests, budget, and location. The UI mirrors Tinder's sleek, mobile-first aesthetic.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Icons | Lucide React |
| Backend/Auth | Supabase (PostgreSQL + Auth) |
| Validation | React Hook Form + Zod |
| AI | Vercel AI SDK (`ai` + `@ai-sdk/anthropic`) |
| Venue Search | Google Places API (New) — `places.googleapis.com/v1` |
| Geocoding | Nominatim (OpenStreetMap) — client-side only, no key required |
| Deployment | Vercel |

---

## Database Schema (Supabase)

### `profiles` table
- `id` — UUID, references `auth.users`
- `partner_names` — JSONB `{ partner1: string, partner2: string }`
- `interests` — Text array
- `constraints` — JSONB `{ budget_max: number, has_car: boolean, prefers_walking: boolean }`
- `cadence` — Text (`weekly` | `biweekly` | `monthly` | `spontaneous`)
- `onboarding_complete` — Boolean, default `false`
- `date_idea` — JSONB | null — the current active date idea stored on the profile
- `revealed_at` — Timestamp | null — when the last date was revealed
- `total_xp` — Integer, default 0
- `dates_completed_count` — Integer, default 0
- `preferred_radius` — Integer (meters), default 10000
- `last_lat` / `last_long` — Float | null — user's saved location

### `date_ideas` table (history log)
- `id`, `user_id`, `idea` (JSONB), `status` (`revealed` | `completed`), `generated_at`, `revealed_at`
- Used to avoid repeating venues/titles and to track completion state

### `milestones` table (static, seeded in migration 004)
- 4 milestones: First Spark (1 date), Triple Threat (3), High Five (5), Perfect 10 (10)
- Badge PNG assets in `public/badges/`

### `user_badges` table
- Awarded automatically by a Postgres trigger (`award_milestone_badges()`) when `dates_completed_count` is updated
- `earned_at` timestamp used by `completeDate()` to detect newly awarded badges (10-second window)

RLS is enabled on all tables. Users may only read/write their own rows.

### Migrations (in order)
1. `001_initial_schema.sql` — profiles table
2. `002_add_date_reveal.sql` — `date_idea` + `revealed_at` columns
3. `003_add_date_ideas_table.sql` — history table
4. `004_gamification.sql` — XP, levels, milestones, user_badges, DB trigger
5. `005_add_location_fields.sql` — `last_lat`, `last_long`, `preferred_radius`

---

## Onboarding Flow (6 Steps)

Steps are orchestrated by `OnboardingFlow.tsx` with Framer Motion `AnimatePresence` direction-aware slide transitions (forward: right→left, back: left→right).

1. **Identity** — Two partner name fields
2. **Interests** — Card-style multi-select grid (min 1, max 10)
3. **Logistics** — Budget slider (€10–€200) + car/walking toggles
4. **Frequency** — Weekly / Bi-weekly / Monthly / Spontaneous
5. **Location** (`StepLocation.tsx`) — GPS permission flow OR Nominatim city search + radius slider (1–50 km). Saves `last_lat`, `last_long`, `preferred_radius` to profile.

On final submit: upsert profile with `onboarding_complete: true`, then `router.replace("/dashboard")`.

---

## Date Generation — Two Modes

### Mode 1: Venue-based (when `last_lat` + `last_long` are set)
1. `searchNearbyVenues()` (`lib/places/search.ts`) — calls Google Places API (New) `searchNearby` endpoint
   - Maps user interests → place types via `INTEREST_TO_PLACE_TYPES`
   - Filters: rating ≥ 4.0, not in `previousPlaceIds` (last 50 dates), excludes accommodation/event types
   - Returns a `VenueDateIdea` with rich metadata: photo, rating, price level, editorial summary, attributes (live music, outdoor seating, etc.), review excerpts
2. `generateAIDateIdea()` (`lib/ai/generate-date.ts`) — called with venue data to produce AI enrichment (title, description, emoji, vibe, tags, budget range)
   - Uses `claude-haiku-4-5-20251001` via Vercel AI SDK `generateText` + `Output.object({ schema: DateIdeaSchema })`
   - Prompt instructs model to write as "a friend who's been there" using only provided data

### Mode 2: Pure AI fallback (no location saved)
- `generateAIDateIdea()` called without venue, uses `previousTitles` from history to avoid repeats
- Returns a generic `AIDateIdea` shape (no place_id, no photo)

Both modes are triggered by the `revealDate()` server action, which enforces cadence cooldown server-side.

### Place Photo Proxy
`app/api/place-photo/route.ts` — proxies Google Places photo requests server-side (hides API key), caches with `Cache-Control: public, max-age=86400`.

---

## Dashboard Architecture

`app/dashboard/page.tsx` — async Server Component. Fetches profile, current revealed date idea, and earned badges in parallel. Passes everything to `DashboardTabs` (client component).

### Tabs (inside `DashboardTabs.tsx`)
- **Home tab** — `DateCard` + `XPProgressBar` + partner names
- **Progress tab** — `BadgeGrid` (trophy room)
- Navigation via `BottomNav.tsx`

`app/dashboard/progress/page.tsx` redirects to `/dashboard` (progress is now a tab, not a separate page).

### DateCard States
1. **Locked** — blurred preview, reveal button (disabled if on cooldown, with relative countdown)
2. **Loading** — animated dots + rotating loading messages
3. **Revealed (venue)** — photo, AI title/description/vibe, rating badge, navigate-to-maps link, `HoldToCompleteButton`
4. **Revealed (AI-only)** — emoji + title + description + tags, `HoldToCompleteButton`
5. **Completed** — collapsed card + live countdown to next reveal date

`HoldToCompleteButton` — custom hold-to-confirm interaction using `requestAnimationFrame` and a clip-path fill animation (1300ms hold duration).

### Gamification
- **XP**: 100 XP per completed date. `calcLevel(xp)` = `floor(sqrt(xp / 100)) + 1`
- **XPProgressBar** — animated level bar shown in Home tab
- **Badges**: 4 milestone badges with custom PNG artwork in `public/badges/`. Awarded by Postgres trigger, detected client-side via 10-second cutoff window after update.
- **BadgeGrid** — shows all 4 milestones (locked = blurred + greyscale). Earned badges open a `BadgeModal` with a swipe-to-flip Y-axis coin-toss animation (Framer Motion `useMotionValue` + `useSpring`).
- **CompleteDateModal** — shown after `completeDate()` resolves, displays XP gain + any newly earned badges.

---

## Server Actions

| Action | File | What it does |
|---|---|---|
| `revealDate()` | `app/actions/reveal.ts` | Enforces cooldown, picks venue or AI date, inserts into `date_ideas`, updates `profiles.date_idea` + `revealed_at` |
| `completeDate()` | `app/actions/complete-date.ts` | Marks revealed idea as completed, increments XP + count, reads newly awarded badges |

Both call `revalidatePath("/dashboard")` to trigger RSC re-render.

---

## Middleware Logic (`middleware.ts`)

- Unauthenticated → `/dashboard` or `/onboarding` redirects to `/login`
- Authenticated → `/login` or `/register` redirects to `/dashboard`
- Authenticated + `onboarding_complete: false` → always redirect to `/onboarding`
- Authenticated + `onboarding_complete: true` → accessing `/onboarding` redirects to `/dashboard`

---

## File Structure (current)

```
blindfoldapp/
├── CLAUDE.md
├── middleware.ts
├── proxy.ts
├── .env.local.example
├── supabase/migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_add_date_reveal.sql
│   ├── 003_add_date_ideas_table.sql
│   ├── 004_gamification.sql
│   └── 005_add_location_fields.sql
├── public/badges/
│   ├── First_Spark.png
│   ├── Triple_Threat.png
│   ├── High_Five.png
│   └── Perfect_Ten.png
├── lib/
│   ├── ai/generate-date.ts          # AI date generation (Vercel AI SDK)
│   ├── places/search.ts             # Google Places API (New) venue search
│   ├── supabase/client.ts           # Browser Supabase client
│   ├── supabase/server.ts           # Server Supabase client (cookies)
│   ├── schemas/onboarding.ts        # Zod validation schemas
│   ├── types.ts                     # DB types + VenueDateIdea, CompleteDateResult
│   └── utils.ts                     # cn(), calcLevel(), xpForLevel(), xpProgress()
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Slider.tsx
│   │   └── CadenceSelect.tsx
│   ├── landing/
│   │   └── DateCarousel.tsx
│   ├── onboarding/
│   │   ├── OnboardingFlow.tsx        # Step orchestrator + Framer Motion transitions
│   │   ├── ProgressBar.tsx
│   │   └── steps/
│   │       ├── StepIdentity.tsx
│   │       ├── StepInterests.tsx
│   │       ├── StepLogistics.tsx
│   │       ├── StepFrequency.tsx
│   │       └── StepLocation.tsx      # GPS + Nominatim city search + radius slider
│   └── dashboard/
│       ├── DashboardTabs.tsx         # Tab switcher (Home / Progress)
│       ├── BottomNav.tsx             # Tab navigation bar
│       ├── DateCard.tsx              # Full date card with all states
│       ├── CompleteDateModal.tsx     # XP + badge reward modal
│       ├── BadgeGrid.tsx             # Trophy room + BadgeModal (flip animation)
│       ├── XPProgressBar.tsx         # Animated level bar
│       └── SettingsPanel.tsx         # Edit all onboarding prefs
└── app/
    ├── layout.tsx
    ├── globals.css
    ├── page.tsx                      # Root redirect
    ├── (auth)/login/page.tsx
    ├── (auth)/register/page.tsx
    ├── auth/callback/route.ts        # OAuth code exchange
    ├── onboarding/page.tsx
    ├── api/place-photo/route.ts      # Google Places photo proxy
    └── dashboard/
        ├── layout.tsx
        ├── page.tsx                  # RSC: fetches profile + data, renders DashboardTabs
        ├── settings/page.tsx
        └── progress/page.tsx         # Redirects → /dashboard (progress is a tab now)
    └── actions/
        ├── reveal.ts                 # revealDate() server action
        └── complete-date.ts          # completeDate() server action
```

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GOOGLE_MAPS_API_KEY=               # Server-only — used by Places API + photo proxy
ANTHROPIC_API_KEY=                 # Server-only — used by Vercel AI SDK
```

`GOOGLE_MAPS_API_KEY` and `ANTHROPIC_API_KEY` are never exposed to the client.

---

## Validation Rules (Zod — `lib/schemas/onboarding.ts`)
- Partner names: required, max 50 chars
- Interests: min 1, max 10 selected
- Budget: 10–200 (integer)
- Cadence: `weekly` | `biweekly` | `monthly` | `spontaneous`

---

## Design Principles
- Mobile-first, max-width `sm` (384px) centered layout
- Dark background: `#0d0d14`
- Primary accent: pink-500 → rose-500 gradient
- Cards use `bg-white/5` + `border-white/10` frosted glass style
- All interactive elements have `active:scale-95` feedback
- Framer Motion used for page transitions, card state changes, and micro-interactions
- Badge modal uses Y-axis `rotateY` spring physics for coin-toss flip on swipe

---

## Key Patterns & Gotchas

- **Venue idea shape** vs **AI idea shape**: `DateCard` uses `isVenue(idea)` type guard (`idea.type === "venue"`) to branch rendering. Both shapes are stored as JSONB in `date_idea` on the profile and in `date_ideas` history.
- **Cadence cooldown**: enforced both client-side (disables reveal button) and server-side (throws in `revealDate()`). `spontaneous` cadence = 3-day cooldown.
- **Badge detection**: `completeDate()` reads badges with `earned_at >= now - 10s` after the profile update. The actual award happens in a Postgres trigger — this is a polling window, not an event subscription.
- **Nominatim usage**: called client-side from `StepLocation` for autocomplete and reverse geocoding. No API key needed but has rate limits — debounced at 350ms.
- **Place photos**: always served through `/api/place-photo?ref=<photo_name>` to keep the Google API key server-side. Response is cached 24 hours.
- **`preferred_radius`** stored in meters in the DB, displayed in km in the UI.
- **`date_ideas` history**: queried on every reveal to avoid repeating `place_id` (venue mode) or `title` (AI mode). Limited to last 50 entries.

---

Do not make any changes until you have 95% confidence in what you need to build. Ask me follow-up questions until you reach that confidence.
