# Blindfold — Mystery Dating App

**Core Architecture:** Next.js 16 App Router + Supabase (PostgreSQL + Auth). Couples onboard (5 steps), receive AI-generated or venue-based date ideas via Google Places API + Vercel AI SDK (Claude). Server actions + revalidatePath invalidate RSC, dashboard shows current date card state + gamification (XP/badges).

---

## Quick Start

```bash
npm install
npm run dev              # localhost:3000
npm run build            # prod build
```

No formal test suite. ESLint/Prettier: check `package.json` for config.

**Environment:** See `.env.local.example`. Sensitive vars (API keys) server-only. Deploy to Vercel.

---

## Style Guidelines

1. **Fixed Bottom Nav:** Use `h-dvh` outer + `flex-col`. Nav = `shrink-0` outside scroll container. Header inside overflow area scrolls with content.
2. **Form Submission:** `useRef(continueTrigger)` pattern avoids re-firing on mount. Parent increments counter, child useEffect checks `continueTrigger > mountTrigger.current`.
3. **Motion & Stacking:** Render nav outside `AnimatePresence` to prevent transform stacking context bugs.
4. **Server Actions:** Always end with `revalidatePath("/dashboard")`. Mutations → RSC re-render.
5. **Validation:** React Hook Form + Zod in components. Trust internal state. Validate at system boundaries only (user input, external APIs).
6. **Naming:** DB uses snake_case (`partner_names`, `plan_type`, `cadence`). JS uses camelCase.
7. **Free Plan Lock:** Free interests (`["food", "nature", "romance"]`) enforced server-side + client-side. Never trust client filtering alone.

---

## Project Context

### Database
- **profiles:** User account + preferences. Stores `partner_names` (JSONB), `interests` (array), `constraints` (JSONB: budget_max, has_car, prefers_walking), `plan_type` ("free"|"subscription"), `cadence` (weekly|biweekly|monthly|spontaneous), `onboarding_complete` (bool), `date_idea` (JSONB), `last_lat`/`last_long` (location).
- **date_ideas:** History log. Tracks revealed/completed statuses. Prevents repeat venues/titles.
- **user_badges:** Milestone badges (First Spark, Triple Threat, High Five, Perfect 10) awarded by Postgres trigger when `dates_completed_count` updates.
- RLS enabled. Users read/write own rows only.

### Onboarding (5 Steps)
1. Identity → 2. Plan (free vs Plus; Plus → Stripe mid-flow) → 3. Interests (free locked to 3; Plus all 12) → 4. Logistics (budget slider, car/walking toggles) → 5. Location (GPS or Nominatim search + radius).
- **Stripe Flow:** Names saved → checkout session created → redirect to Stripe → return to upgrade page → plan_type + cadence written → redirect back to onboarding step 3.
- **Step Coordination:** `OnboardingFlow` orchestrates via `continueTrigger` counter + `onCanContinueChange` callback. All steps accept `continueTrigger` number + callback, use `useRef` mount guard.

### Date Generation
- **Venue Mode:** Google Places API search nearby → filter by interests/rating ≥ 4.0 → Claude enriches with title/description/vibe (Vercel AI SDK).
- **AI Fallback:** No location → pure AI generation using `previousTitles` to avoid repeats.
- **Reveal Cadence:** Server-side cooldown enforced (weekly/biweekly/monthly/spontaneous = 3-day). Reroll: 1 lifetime (free), 1 per date (Plus).

### Dashboard
- **Home Tab:** Date card (blurred → reveal → teaser → full reveal → completed). XP progress bar. HoldToCompleteButton (1300ms hold → `completeDate()` → XP + badge detection).
- **Progress Tab:** Badge grid (trophy room). Earned badges show flip animation (Framer Motion Y-axis rotateY).
- **Gamification:** XP = 100/date. Level = `floor(sqrt(xp / 100)) + 1`. Badges auto-awarded by DB trigger; detected client-side within 10-second window.

### Stripe Integration
- Checkout route creates session with `cadence` + `user_id` in metadata.
- Success redirects to `upgrade/page.tsx` → reads metadata → writes plan + cadence → redirects to `/onboarding` (if incomplete) or `/dashboard`.
- Webhook handles subscription events.

### Proxy / Middleware (`proxy.ts`)
- Next.js 16 uses `proxy.ts` (NOT `middleware.ts`). Exports `proxy` fn + `proxyConfig`.
- Beta gate: HMAC-signed `site_access` cookie required. Invalid → `/gate`. Gate page accepts `BETA_GATE_SECRET`, issues signed token.
- Auth routing: unauthenticated → `/login`; authenticated + onboarding incomplete → enforced in RSC.

---

## Key Patterns & Gotchas

- **Type Guards:** Use `isVenue(idea)` to discriminate venue vs AI ideas before rendering (shapes differ in shape/photo/place_id).
- **Nominatim (Client-Side):** No API key. Rate-limited. Debounced at 350ms for autocomplete. Reverse geocode coords → city name.
- **Place Photos:** Proxied via `/api/place-photo?ref=<photo_name>`. Hides API key. Cached 24h.
- **`preferred_radius`:** Stored in meters (DB). Displayed in km (UI). Convert on read/write.
- **Reroll Atomicity:** `rerollDate()` uses conditional UPDATE to claim eligibility (prevents concurrent race). Rolls back on generation failure.
- **Badge Detection:** Postgres trigger awards badges. Client polls with 10-second window (`earned_at >= now - 10s`). Not event-driven.
- **Supabase RLS:** All CRUD operations filtered by user context. Test schema changes with RLS enabled.

---

## Recent Changes
- Onboarding nav bar refactored: `h-dvh` outer container, header scrolls inside content, nav fixed at bottom.
- All 5 step components use `continueTrigger` pattern for form submission (no internal buttons).
- `StepPlan` supports Stripe mid-flow redirect with state preservation.
