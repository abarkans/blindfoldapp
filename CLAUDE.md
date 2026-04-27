# Blindfold — Mystery Dating App

Next.js 16 App Router + Supabase (PostgreSQL + Auth). Couples onboard (5 steps), receive AI-generated or venue-based date ideas via Google Places API + Vercel AI SDK (Claude). Server actions + `revalidatePath` invalidate RSC; dashboard shows date card state + XP/badge gamification.

---

## Build & Test

```bash
npm install
npm run dev      # localhost:3000
npm run build    # prod build — also runs TS type-check
npx tsc --noEmit # type-check only, no emit
```

No test suite. No lint script. TypeScript strict mode on. Build is the CI gate.

**Environment:** copy `.env.local.example` → `.env.local`. All API keys are server-only vars.

---

## Style Guidelines

1. **Fixed Bottom Nav:** `h-dvh` outer + `flex-col`. Nav = `shrink-0` outside scroll container. Header scrolls inside content area. Mobile-only nav: `md:hidden`. Desktop inline buttons: `hidden md:flex` below content.
2. **Form Submission:** `useRef(continueTrigger)` mount guard pattern. Parent increments counter; child `useEffect` fires only when `continueTrigger > mountTrigger.current`. Never trigger on mount.
3. **React 19 setState Rule:** Never pass callbacks containing `setState` to children via props or store them in parent state. React 19 + Turbopack throws render conflict. Communicate state upward via plain values (e.g., `onSubstepChange(subStep)`) — not function refs containing child setters.
4. **Motion & Stacking:** Render nav outside `AnimatePresence` to prevent transform stacking context bugs on mobile.
5. **Server Actions:** Always end with `revalidatePath("/dashboard")`. Mutations must trigger RSC re-render.
6. **Validation:** React Hook Form + Zod in components. Validate at system boundaries only (user input, external APIs). Trust internal state.
7. **Naming:** DB snake_case (`partner_names`, `plan_type`). JS camelCase. `preferred_radius` stored in meters (DB), displayed in km (UI) — convert on every read/write.
8. **Free Plan Lock:** Free interests (`["food", "nature", "romance"]`) enforced server-side AND client-side. Never trust client filtering alone.

---

## Project Context

### Database
- **profiles:** `partner_names` (JSONB), `interests` (array), `constraints` (JSONB: budget_max, has_car, prefers_walking), `plan_type` ("free"|"subscription"), `cadence` (weekly|biweekly|monthly|spontaneous), `onboarding_complete` (bool), `date_idea` (JSONB), `last_lat`/`last_long`, `preferred_radius`.
- **date_ideas:** History log. Tracks revealed/completed. Prevents repeat venues/titles.
- **user_badges:** Awarded by Postgres trigger on `dates_completed_count` update. Milestones: First Spark, Triple Threat, High Five, Perfect 10.
- RLS enabled. Users read/write own rows only.

### Onboarding (5 Steps)
Flow: Identity → Plan → Interests → Logistics → Location

- **Step Coordination:** `OnboardingFlow` owns `continueTrigger` counter + nav state (`canContinue`, `continueLabel`). All steps accept `continueTrigger` + `onCanContinueChange`. Use `useRef` mount guard in every step.
- **StepPlan substep:** Internal "plan" → "frequency" substep. Reports current substep via `onSubstepChange(substep: "plan" | "frequency")`. Parent stores in `planSubStep` state; `handleBack()` reads it to decide: reset to plan substep or call `goBack()`.
- **Stripe mid-flow:** Step 2 (Plus) → names saved → `/api/stripe/checkout` → Stripe redirect → `upgrade/page.tsx` writes plan + cadence → back to `/onboarding` at step 3.
- **Subscription skip:** Step 1 jumps to Step 3 when `plan_type === "subscription"` (step 2 already done).

### Date Generation
- **Venue Mode:** Google Places API → filter by interests/rating ≥ 4.0 → Claude enriches title/description/vibe.
- **AI Fallback:** No location → pure AI generation with `previousTitles` dedup.
- **Reveal Cadence:** Server-side cooldown. Reroll: 1 lifetime (free), 1 per date (Plus).

### Dashboard
- **Home:** Date card states: blurred → reveal → teaser → full reveal → completed. `HoldToCompleteButton` (1300ms → `completeDate()` → XP + badge detect).
- **Progress:** Badge grid, Framer Motion rotateY flip on earn.
- **Gamification:** XP = 100/date. Level = `floor(sqrt(xp / 100)) + 1`. Badge poll: `earned_at >= now - 10s` window after complete.

### Stripe
- Checkout: session with `cadence` + `user_id` metadata.
- `upgrade/page.tsx`: reads metadata → upserts plan + cadence → redirects.
- Webhook handles subscription lifecycle.

### Proxy / Middleware
- Next.js 16: `proxy.ts` (NOT `middleware.ts`). Exports `proxy` fn + `proxyConfig`.
- Beta gate: HMAC-signed `site_access` cookie. Invalid → `/gate`. Gate page issues token from `BETA_GATE_SECRET`.
- Auth routing: unauthenticated → `/login`. Incomplete onboarding enforced in RSC.

---

## Key Patterns & Gotchas

- **Type Guards:** `isVenue(idea)` discriminates venue vs AI ideas (shapes differ: photo/place_id present on venue).
- **Nominatim:** Client-side, no API key, rate-limited. Debounce 350ms autocomplete. Reverse geocodes coords → city name.
- **Place Photos:** Proxy via `/api/place-photo?ref=<photo_name>`. Hides key, 24h cache.
- **Reroll Atomicity:** `rerollDate()` conditional UPDATE claims eligibility; rolls back on generation failure.
- **Badge Detection:** Postgres trigger awards. Client polls `earned_at >= now - 10s`. Not event-driven.
- **Supabase RLS:** Always test schema changes with RLS enabled.
- **flushSync unavailable:** Turbopack (Next.js 16 + React 19) doesn't expose it. Use `setTimeout(..., 0)` for deferred state updates if needed.
