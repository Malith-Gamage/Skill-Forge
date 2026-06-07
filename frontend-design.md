c

# SkillForge — Frontend Design Plan

## Styling & UI Stack

```
Styling        : Tailwind CSS v4 + shadcn/ui components
Framework      : Next.js 16.2.6 — App Router, TypeScript, strict mode
```

---

## Component Structure

```
components/
  ui/                               ← shadcn/ui primitives
  layout/
    Navbar.tsx
    Sidebar.tsx
    Footer.tsx
  auth/
    LoginForm.tsx
    RegisterForm.tsx
  dashboard/
    RoadmapCard.tsx
    TaskList.tsx
    StreakBadge.tsx
    CoinWidget.tsx
    NotificationPanel.tsx
  roadmap/
    RoadmapSearch.tsx
    CheckpointSidebar.tsx
    TaskItem.tsx
    ProgressBar.tsx
  gamification/
    BadgeGallery.tsx
    CoinHistory.tsx
    GoldenBadge.tsx
  community/
    PostCard.tsx
    AnswerThread.tsx
    LeaderboardTable.tsx
  expert/
    ExpertCard.tsx
    BookingForm.tsx
  admin/
    KpiWidget.tsx
    UserTable.tsx
```

---

## Page Routes

```
src/app/
  page.tsx                          ← Landing page (from Capture.PNG design)
  layout.tsx                        ← Root layout
  (auth)/
    login/page.tsx
    register/page.tsx
    forgot-password/page.tsx
    reset-password/[token]/page.tsx
    verify-email/page.tsx
  (dashboard)/
    page.tsx                        ← /dashboard home
    tasks/page.tsx
    notifications/page.tsx
    layout.tsx
  (roadmap)/
    search/page.tsx
    [roadmapId]/page.tsx
    [roadmapId]/checkpoint/[checkpointId]/page.tsx
    layout.tsx
  (gamification)/
    coins/page.tsx
    badges/page.tsx
    achievements/[badgeId]/page.tsx
  (community)/
    page.tsx
    feed/page.tsx
    post/new/page.tsx
    post/[postId]/page.tsx
    leaderboard/page.tsx
  (expert)/
    page.tsx
    [expertId]/page.tsx
    [expertId]/book/page.tsx
    sessions/page.tsx
  (admin)/
    page.tsx                        ← Analytics dashboard
    users/page.tsx
    roadmaps/page.tsx
    experts/page.tsx
```

---

## Phase 1 — Landing Page + Auth Pages (Day 3–5)

### Landing Page (`src/app/page.tsx`)
- **Navbar:** SkillForge logo (star icon), dark mode toggle, "Get Started" button (→ /register)
- **Hero section:**
  - "AI-Powered Learning Platform" pill badge
  - "Transform Your Skills, Forge Your Future" gradient heading (blue → purple)
  - Subtitle paragraph
  - "Start Learning Free →" CTA button (→ /register)
  - "Watch Demo" outline button
- **Color palette:** `#4F46E5` (indigo) to `#7C3AED` (violet) gradient, light gray background `#F8F9FA`
- **Floating help button** (bottom-right `?`)

### Auth Pages
- `/login` — Login form
- `/register` — Registration form
- `/forgot-password` — Password reset request
- `/reset-password/[token]` — New password form
- `/verify-email` — Email verification confirmation

**Critical files:**
- `src/app/page.tsx`
- `src/middleware.ts`
- `src/app/api/auth/*/route.ts`

**Verification:** Register → verify email → login → redirects to /dashboard. Unauth access to /dashboard → redirected to /login.

---

## Phase 2 — Dashboard + Roadmap UI (Day 6–10)

### Dashboard (`/dashboard`)
- Layout with **persistent sidebar** (nav links) and **top header** (coin balance, notifications bell, user avatar)
- **Dashboard home:**
  - Active roadmap cards with progress bars
  - Today's pending tasks
  - Coin balance widget
  - Learning streak counter (flame icon)
- **Notifications panel** (bell dropdown) — unread count badge, read-on-click

### Roadmap Pages
- `/roadmap/search` — Search form, triggers roadmap generation, loading skeleton during generation, redirect to `/roadmap/[id]`
- `/roadmap/[id]` — Checkpoint sidebar (locked / in-progress / completed states), task list, resources section

**Critical files:**
- `src/app/(roadmap)/search/page.tsx`
- `src/app/(roadmap)/[roadmapId]/page.tsx`
- `src/components/dashboard/RoadmapCard.tsx`
- `src/components/dashboard/TaskList.tsx`
- `src/components/dashboard/CoinWidget.tsx`
- `src/components/dashboard/NotificationPanel.tsx`
- `src/components/roadmap/CheckpointSidebar.tsx`
- `src/components/roadmap/ProgressBar.tsx`

**Verification:** Search "Python" → roadmap generated with ≥5 checkpoints → task marked complete → coins awarded → progress bar updates → checkpoint badge awarded on checkpoint completion.

---

## Phase 3 — Gamification Pages (Day 11–12)

### Pages
- `/gamification/coins` — Paginated transaction history (20/page), credit/debit color coding, "Earned today" widget
- `/gamification/badges` — Badge gallery grid (checkpoint badges + community badges + golden badge), **animated reveal on hover**
- `/achievements/[badgeId]` — Public share page (no auth required), Open Graph meta tags for social sharing (`og:title`, `og:image`, `og:description`)

**Critical files:**
- `src/app/(gamification)/coins/page.tsx`
- `src/app/(gamification)/badges/page.tsx`
- `src/app/(gamification)/achievements/[badgeId]/page.tsx`
- `src/components/gamification/BadgeGallery.tsx`
- `src/components/gamification/CoinHistory.tsx`
- `src/components/gamification/GoldenBadge.tsx`

**Verification:** Complete a checkpoint → badge appears in gallery. Complete full roadmap → golden badge awarded → `/achievements/[slug]` accessible without login.

---

## Phase 4 — Community Pages (Day 13–16)

### Pages
- `/community` — Gate check → redirect to feed or locked state page
- `/community/feed` — Paginated post list (20/page), filter by skill_domain, sort newest/most answered
- `/community/post/new` — Form to submit question (shows coin cost = 10 SCS, user's current balance)
- `/community/post/[postId]` — Full Q&A thread, answer submission, "Accept Answer" button (author only)
- `/community/leaderboard` — Ranked table by total_answers + coins_earned

**Access Gate:** Users with zero completed roadmaps see a locked state page.

**Critical files:**
- `src/app/(community)/feed/page.tsx`
- `src/app/(community)/post/[postId]/page.tsx`
- `src/components/community/PostCard.tsx`
- `src/components/community/AnswerThread.tsx`
- `src/components/community/LeaderboardTable.tsx`

**Verification:** User with 1 completed roadmap can post (10 SCS deducted). User with 0 roadmaps sees locked page. Accept answer → answerer gains 5 SCS.

---

## Phase 5 — Expert Pages (Day 17–19)

### Pages
- `/expert` — Expert cards grid, filter by field_of_expertise, shows availability_status badge
- `/expert/[expertId]` — Bio, expertise, availability, "Book Session (100 SCS)" button
- `/expert/[expertId]/book` — Booking form (topic, preferred time), shows coin balance vs cost
- `/expert/sessions` — User's upcoming and past sessions with status badges

**Critical files:**
- `src/app/(expert)/page.tsx`
- `src/app/(expert)/[expertId]/book/page.tsx`
- `src/components/expert/ExpertCard.tsx`
- `src/components/expert/BookingForm.tsx`

**Verification:** User with ≥100 coins books session → balance deducted → status PENDING. User with <100 coins → error shown, no record created.

---

## Phase 6 — Admin Pages (Day 20–22)

### Pages (all require `role=ADMIN`)
- `/admin` — KPI dashboard: DAU, total roadmaps, coin circulation, community posts today
- `/admin/users` — Paginated user table, search, deactivate action
- `/admin/roadmaps` — Flagged roadmap queue, remove action
- `/admin/experts` — CRUD for expert profiles

**Critical files:**
- `src/app/(admin)/page.tsx`
- `src/components/admin/KpiWidget.tsx`
- `src/components/admin/UserTable.tsx`

**Verification:** Admin can deactivate user → user gets 403 on next login. Flagged roadmap removed → hidden from user dashboard.

---

## Phase 7 — Polish, Performance & Accessibility (Day 23–25)

- [ ] Add `loading.tsx` and `error.tsx` to all route groups
- [ ] Add skeleton loaders for all RSC data fetches
- [ ] `next/image` for all images with correct `sizes` props
- [ ] Open Graph meta in `layout.tsx` and per-page metadata exports
- [ ] `sitemap.ts` using Next.js built-in sitemap generation
- [ ] `robots.ts` — disallow `/admin/*` and `/api/*`
- [ ] WCAG 2.1 AA — audit color contrast, add `aria-label` to all interactive elements
- [ ] Responsive layout audit: test 320px → 2560px breakpoints
- [ ] Add `Content-Security-Policy` and `X-Frame-Options` headers in `next.config.ts`
- [ ] DOMPurify sanitisation of all user Markdown content before DB storage
- [ ] Lighthouse CI audit — target: Performance ≥ 90, SEO ≥ 95, Accessibility ≥ 90
