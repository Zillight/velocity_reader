# Velocity Reader — Design Document (Source of Truth)

> This is the authoritative spec for the app. **Read this before any development task.**
> Derived from the Google Stitch export. Keep code aligned with the design system,
> screens, and flows below. If a change conflicts with this doc, update the doc first.

## 1. Product Summary
Velocity Reader is a **mobile-first speed-reading app** (RSVP — Rapid Serial Visual
Presentation). Users import a document (PDF) or paste text, set a reading purpose,
then read via word-chunks flashed at an adjustable WPM. A library/archive tracks
documents and reading stats.

- Layout: single column, `max-width: 480px`, centered.
- Theme: dark, Material Design 3 inspired.
- Keep features lean — no auth, no backend, no EPUB.

## 2. Tech Stack
- React 18 + Vite (JavaScript)
- React Router for navigation
- Tailwind CSS (PostCSS build) using the tokens in section 5
- `pdfjs-dist` for client-side PDF text extraction
- `localStorage` for library, archive, stats
- Fonts: Inter + Material Symbols Outlined (Google Fonts)

## 3. Screens & Routes
| Route | Screen | Purpose |
|-------|--------|---------|
| `/` | Splash | Animated bolt logo + progress bar; auto-redirect to `/home` after ~2s |
| `/home` | Home dashboard | "Currently Reading" resume card, bento stats (avg WPM, read time), Library actions |
| `/import` | Choose material | Tabs: Upload PDF (pdf.js) and Paste Text; "Next" when text ready |
| `/purpose` | Reading purpose | Primary element is a 30-second reflection countdown ring (MM:SS) that auto-starts reading at zero. A keyboard icon (bottom-right) switches to typing mode: it cancels the countdown and reveals the purpose textarea (char counter, max 150); reading then opens only via "Start Reading". "Start Reading" always available for manual start |
| `/read` | RSVP reader | Word-chunk flashing (1–4 words per flash, set in Settings), adjustable WPM, play/pause, progress; saves on exit/finish. Multi-word chunks render centered with the ORP highlight on the centre word so the eye stays on the focus point; type scales down as the chunk grows. With **break-at-punctuation** on (default), a chunk ends after a word carrying `. , ! ? ; :` so the next word starts fresh, plus a short "breath" pause. "Jump to page" opens a text-preview pager (`JumpToPages`, ~250 words/page) to pick a start point via "Start here" |
| `/archive` | Library | Search field + "+" add button (upload/paste → `/import`); list of docs w/ kebab (rename/delete, closes on outside click); empty state when none |
| `/drills` | Drills | Drill launcher (cards). **Schultz Table**: 5×5 grid of shuffled 1–25, tap in ascending order while gazing at the accent-bordered center cell; count-up timer (MM:SS.s, warning color), per-tap success/error feedback, completion overlay with final + best time (`localStorage` `schultz_best_time`). **Raining Letters**: 60s peripheral-vision game — letters fall in 3 columns, fixate the center dot and tap the side where the target letter appears; score/accuracy results + high score (`localStorage` `raining_letters_high_score`). Both drills accrue play-time toward the streak |
| `/settings` | Settings | Theme toggle (light/dark), daily streak goal, **reading speed** (default WPM 100–900, `useWpm` → `velocity.wpm`, applied to new docs + as reader fallback), **words per flash** (chunk size 1–4, `useChunkSize` → `velocity.chunkSize`) with a **break-at-punctuation** toggle (`velocity.smartChunk`, default on; only meaningful for chunks > 1), saved doc count, clear-all-data |

The **reader fills exactly one viewport** (`fixed inset-0`, `overflow-hidden`) so controls and the "Jump to page" button never scroll out of view.

Shared chrome: fixed **TopAppBar** and a floating **pill BottomNav** (Home / Library / **Read** / Drills / Settings). The **Read** item only appears when a document exists and deep-links to the most recently touched in-progress doc (`/read?id=…`) for instant resume from anywhere.

## 4. Core Logic
- **Document model**: `{ id, title, text, wordIndex, wpm, purpose, createdAt, updatedAt, completed }`
- **`useLibrary` hook**: CRUD over `documents` array in `localStorage`.
- **RSVP engine**: split text into words; `setInterval` paced by `60000 / wpm`;
  highlight current word (optional fixation letter). Play/pause/reset; persist `wordIndex`.
- **Drill practice time**: both drills feed the streak via `useStreak().addPracticeSeconds`,
  the same way the Reader does — wall-clock time spent actively playing is committed on
  round end / game end / exit (drill-by-drill, not just reading).
- **Stats**: derive avg WPM and total read time from saved sessions.
- **PDF extraction**: `pdfjs-dist` → read pages → concatenate `textContent` → store as document.
- **Reading streak** (`useStreak`): accumulates **practice seconds per day** in
  `localStorage` `velocity.activity` (`{ 'YYYY-MM-DD': seconds }`); the Reader adds
  wall-clock time while playing. A day only counts once it meets the **daily goal**
  (`velocity.goal`, minutes, default **1**, adjustable in Settings: 1/5/10/15/20/30 or
  custom via stepper). Streak = consecutive goal-met days ending today (or yesterday if
  today's goal isn't met yet). Shown as a flame badge in the TopAppBar that opens a
  **calendar popover** (`StreakCalendar`) marking met days (flame), partial days (tint),
  and today.

## 5. Design System (Tailwind tokens)

### Colors
```
on-surface-variant: #c7c4d8   outline-variant: #464555      surface-bright: #393939
tertiary-fixed-dim: #ffb785   on-secondary-container:#00302d primary-container:#8781ff
on-background: #e5e2e1        text-secondary: #888888       surface-container:#201f1f
primary: #c4c0ff             primary-fixed-dim:#c4c0ff      on-tertiary-fixed-variant:#713700
on-primary-fixed:#100069     bg-tertiary:#2A2A2A           surface-container-high:#2a2a2a
on-tertiary-fixed:#301400    on-primary-container:#1b0091  surface-tint:#c4c0ff
on-tertiary-container:#461f00 on-primary-fixed-variant:#3622ca error:#FF6B6B
error-container:#93000a      outline:#918fa1               border:#333333
tertiary-fixed:#ffdcc6       text-heading:#E0E0E0          inverse-primary:#4f44e2
surface-container-highest:#353534 on-primary:#2000a4       surface-container-lowest:#0e0e0e
tertiary-container:#db761f   bg-secondary:#1E1E1E          surface:#131313
on-error:#690005             primary-fixed:#e3dfff         secondary-fixed-dim:#5dd9d0
on-error-container:#ffdad6   on-tertiary:#502500           on-secondary-fixed-variant:#00504c
inverse-surface:#e5e2e1      warning:#FFD93D               secondary-container:#00a29a
surface-variant:#353534      background:#121212/#131313    on-surface:#e5e2e1
on-secondary-fixed:#00201e   secondary:#5dd9d0             secondary-fixed:#7cf6ec
tertiary:#ffb785             text-primary:#C8C8C8          surface-container-low:#1c1b1b
inverse-on-surface:#313030   on-secondary:#003734          surface-dim:#131313
```

### Border Radius
`DEFAULT: 0.25rem`, `lg: 0.5rem`, `xl: 0.75rem`, `full: 9999px`

### Spacing
`padding-screen: 16px`, `gutter: 16px`, `base: 8px`, `max-width: 480px`

### Font Family
All Inter: `button, body, caption, h2, h1, reader-chunk-mobile, reader-chunk`

### Font Sizes (size / lineHeight / weight / letterSpacing)
```
button:  15px / 20px / 600 / 0.05em
body:    16px / 24px / 400
caption: 13px / 18px / 400
h2:      20px / 28px / 600
h1:      24px / 32px / 700
reader-chunk-mobile: 32px / 40px / 600 / -0.02em
reader-chunk:        48px / 56px / 600 / -0.02em
```

### Key UI patterns
- TopAppBar: fixed floating **pill** (`top-2`, h-14, `rounded-full`, `border`, `shadow-lg`), `bg-background/80 backdrop-blur-md`, brand "Velocity" in `text-primary`. Right slot shows a **reading-streak flame badge** (`local_fire_department` + day count). When the **daily goal is first reached**, a subtle **star burst + glow** plays around the badge for ~2s (`streak-star`/`streak-glow` keyframes). Settings is reached via the BottomNav.
- BottomNav: floating **pill** (`bottom-4`, `rounded-full`, `border`, `shadow-lg`), `bg-bg-secondary`; active item `text-primary` with filled icon. Includes a **Read** shortcut to resume the current document.
- Cards: `bg-bg-secondary border border-border rounded-xl`; `active:scale-[0.98]` press feedback.
- Atmospheric blurred radial glows using `primary/5` and `secondary/5`.
- Icons: Material Symbols Outlined, `font-variation-settings` for FILL/wght.

### Theming (light / dark)
The app defaults to **dark**. Users can switch to **light** in Settings; the choice
persists in `localStorage` (`velocity.theme`) and applies a `light`/`dark` class on
`<html>`. Semantic tokens used by the UI are driven by **CSS variables** (RGB triplets,
so Tailwind `/opacity` modifiers still work) defined in `src/index.css` and referenced
from `tailwind.config.js` as `rgb(var(--token) / <alpha-value>)`. The dark values match
section 5. Light theme mapping (key tokens):

```
background:#F7F6FB  bg-secondary:#FFFFFF  bg-tertiary:#ECEAF4  surface-container:#EEEDF4
border:#DAD8E3      text-primary:#2A2A2E  text-secondary:#6B6A73  text-heading:#16151A
primary:#4F44E2     on-primary:#FFFFFF    on-primary-container:#FFFFFF  outline:#74737B
secondary:#00807A   tertiary:#B35E12      error:#BA1A1A         on-surface-variant:#49454F
```
Accent brand colors keep good contrast in both themes (primary shifts to a deeper indigo
in light mode). Non-structural accent tokens not listed remain as defined in section 5.

## 6. Out of Scope
Auth/backend, EPUB, real haptics, server sync, automated test suite. Settings is lean.

## 7. Drills
- **Launcher** (`/drills`): list of focus drills as cards; tapping one opens it full-screen (`fixed inset-0`).
- **Schultz Table** (`src/components/SchultzTable.jsx`): peripheral-vision drill.
  - **Grid**: 5×5, numbers 1–25 randomized (Fisher–Yates), re-shuffled on every round. CSS `grid-cols-5` + 4px gap, `aspect-square` cells (≥44px touch target), `rounded-lg` (8px).
  - **Center cell** (index 12): 2px border in accent `#6C63FF` to anchor the gaze; still tapped in sequence.
  - **Gameplay**: tap ascending 1→25. Correct → cell fades to success (`#4ECDC4` @15% bg, `#4ECDC4` text, 150ms) and stays; incorrect → snaps to `error` (`#FF6B6B`) bg for 200ms then fades back; target unchanged. `Find: X` indicator below the grid (`aria-live="polite"`), label `#E0E0E0` 16px + number `#6C63FF` 22px/700.
  - **Timer**: count-up from 00:00.0, `setInterval` 100ms, precision via `performance.now()`; shown top-right, `warning` (`#FFD93D`) 18px/600, format MM:SS.s.
  - **Top bar**: back chevron (`text-secondary`) left, centered title "Schultz Table" (`text-heading` 18px/600), timer right.
  - **Completion**: overlay (`bg-black/60` backdrop fade 300ms + card scale 0.95→1) with "Complete!", final time large in `#6C63FF`, and either "New Record!" (`warning`) or "Best: XX.Xs" (`text-secondary`). Buttons: **Play Again** (`#6C63FF` filled, `rounded-xl`) and **Back** (text-only). Cell taps disabled once complete.
  - **Persistence**: all-time best (ms) in `localStorage` `schultz_best_time`.
  - **State**: `grid`, `nextTarget`, `found` (Set), `flashingCell`, `isComplete`, `elapsedTime`, `bestTime` via `useState`; timer/flash handles via `useRef`.
  - Overlay keyframes `schultz-backdrop-in` / `schultz-card-in` live in `src/index.css`.
  - Active round time accrues toward the streak (`addPracticeSeconds`).
- **Raining Letters** (`src/components/RainingLetters.jsx`): 60-second peripheral-vision reaction game.
  - **Phases**: `countdown` (3-2-1-GO!, `raining-countdown-pop`) → `playing` → `results`.
  - **Columns**: 3 falling streams — left (22%), center (50%), right (78%); regular letters spawn every 800–1200ms per column (randomized), fall at ~120px/s via a single `requestAnimationFrame` loop. Letters are imperative DOM nodes in a `Map` ref (not React state) for 60fps; capped at ~18 concurrent and culled off-screen.
  - **Center dot**: fixed `#6C63FF` 10px dot with pulsing glow (`raining-dot`), always on top; the gaze anchor. Targets never spawn in the center column. Regular spawns exclude the current target char so the target letter is unique on screen.
  - **Target**: shown as `Find: X` (`#6C63FF` 22px/700) top-center; appears in a random peripheral column every ~3–5s, with a 1–2s cooldown after each hit/miss before a new target is chosen.
  - **Input**: two invisible full-height tap zones (`role="button"`, `aria-label`). Correct side while target present → +10, `#4ECDC4` flash + `+10` float; wrong side while present → −5 (counts toward accuracy); tap with no target present → −5 false tap + edge flash (excluded from accuracy). Miss (target exits bottom) → −5, `#FF6B6B` flash. Score floored at 0.
  - **HUD**: timer `0:SS` top-right (`warning` 16px/600), live score, `Find: X`.
  - **Results**: overlay with "Time's Up!", score (`#6C63FF` 28px), Hits `correctHits / totalTargetsShown`, Accuracy `correctHits / totalTaps` (taps while a target was present), and "New High Score!" (`warning`) or "Best: N" (`text-secondary`). Play Again / Back.
  - **Persistence**: best score in `localStorage` `raining_letters_high_score`.
  - **Refs**: `letters` Map, `stats` (`totalTargetsShown`/`correctHits`/`totalTaps`), target lifecycle, rAF/timeout handles; React state only for `gamePhase`, `score`, `timeRemaining`, `targetLetter`, floats, edge flash, results. All rAF/intervals/timeouts cleaned up on unmount; play-time accrues toward the streak.
  - Keyframes `raining-dot-pulse` / `raining-score-float` / `raining-edge-flash` / `raining-countdown-pop` live in `src/index.css`.
