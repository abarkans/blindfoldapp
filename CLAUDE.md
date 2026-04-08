# Blindfold — Mystery Dating App

## Project Overview
A mystery dating web-app MVP where couples receive surprise date suggestions curated around their interests, budget, and lifestyle. The UI mirrors Tinder's sleek, mobile-first aesthetic.

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
| Deployment | Vercel |

---

## Rules & Requirements

### 1. Database Schema (Supabase)
The `profiles` table must contain:
- `id` — UUID, references `auth.users`
- `partner_names` — JSONB `{ partner1: string, partner2: string }`
- `interests` — Text array
- `constraints` — JSONB `{ budget_max: number, has_car: boolean, prefers_walking: boolean }`
- `cadence` — Text (`weekly` | `biweekly` | `monthly` | `spontaneous`)
- `onboarding_complete` — Boolean, default `false`

Row Level Security (RLS) must be enabled. Users may only read/write their own row.

### 2. Registration / Onboarding Flow (5 Steps)
1. **Auth** — Email/password + Google OAuth (via Supabase)
2. **Identity** — Two partner name fields
3. **Interests** — Card-style multi-select grid (min 1, max 10)
4. **Logistics** — Budget slider (€10–€200) + car/walking toggles
5. **Frequency** — Weekly / Bi-weekly / Monthly / Spontaneous options

**Requirement:** Framer Motion `AnimatePresence` slide transitions between each step (direction-aware: forward slides right→left, back slides left→right).

### 3. Post-Registration Routing & Dashboard
- On final step submit: upsert profile with `onboarding_complete: true`, then `router.replace("/dashboard")`.
- **Dashboard** — Shows partner names, stats bar, and mystery date card with blurred/locked content.
- **Settings** (`/dashboard/settings`) — Edit all onboarding data (names, interests, budget, transport, cadence).

### 4. Middleware Logic (`middleware.ts`)
- Unauthenticated → `/dashboard` or `/onboarding` redirects to `/login`
- Authenticated → `/login` or `/register` redirects to `/dashboard`
- Authenticated + `onboarding_complete: false` → always redirect to `/onboarding`
- Authenticated + `onboarding_complete: true` → accessing `/onboarding` redirects to `/dashboard`

### 5. Validation Rules
- All form inputs validated via **Zod schemas** (see `lib/schemas/onboarding.ts`)
- Partner names: required, max 50 chars
- Interests: min 1, max 10 selected
- Budget: 10–200 (integer)
- Cadence: must be one of the four enum values

---

## File Structure

```
blindfoldapp/
├── CLAUDE.md
├── middleware.ts                    # Auth + onboarding redirect guard
├── .env.local.example
├── supabase/migrations/
│   └── 001_initial_schema.sql
├── lib/
│   ├── supabase/client.ts           # Browser Supabase client
│   ├── supabase/server.ts           # Server Supabase client (cookies)
│   ├── schemas/onboarding.ts        # All Zod validation schemas
│   ├── types.ts                     # Database types
│   └── utils.ts                     # cn() utility
├── components/
│   ├── ui/Button.tsx
│   ├── ui/Input.tsx
│   ├── ui/Slider.tsx
│   ├── onboarding/
│   │   ├── OnboardingFlow.tsx        # Step orchestrator with Framer Motion
│   │   ├── ProgressBar.tsx
│   │   └── steps/
│   │       ├── StepIdentity.tsx
│   │       ├── StepInterests.tsx
│   │       ├── StepLogistics.tsx
│   │       └── StepFrequency.tsx
│   └── dashboard/
│       ├── DateCard.tsx             # Mystery locked/blurred date card
│       └── SettingsPanel.tsx        # Edit all onboarding prefs
└── app/
    ├── layout.tsx
    ├── globals.css
    ├── page.tsx                     # Root redirect (→ dashboard or login)
    ├── (auth)/login/page.tsx
    ├── (auth)/register/page.tsx
    ├── auth/callback/route.ts       # OAuth code exchange
    ├── onboarding/page.tsx
    └── dashboard/
        ├── page.tsx
        └── settings/page.tsx
```

---

## Environment Variables
Copy `.env.local.example` → `.env.local` and fill in:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Design Principles
- Mobile-first, max-width `sm` (384px) centered layout
- Dark background: `#0d0d14`
- Primary accent: pink-500 → rose-500 gradient
- Cards use `bg-white/5` + `border-white/10` frosted glass style
- All interactive elements have `active:scale-95` feedback
- Framer Motion used for page transitions and micro-interactions only
