# Alingua 🚀

A playful language-learning dashboard for children, built with Next.js App Router, TypeScript, and Tailwind CSS.

## Current status

The homepage includes a featured lesson, a streak and rewards display, activity teasers, an achievement, and topic cards for Animals, Food, Space, and Colors. Each topic has five flashcards, five translation questions, and five word scrambles.

Incorrect answers use a heart and must be tried again. At zero hearts, a friendly dialog offers a fresh attempt with three hearts or a return home. The summary shows accuracy across all quiz/scramble attempts, 10 XP per correct answer, and 1–3 stars (2 at 60% accuracy, 3 at 100%).

**Finish & Return Home** saves each topic's best result in browser local storage. Dashboard stars include those best rewards plus any explicitly added bonus stars; replaying a topic does not duplicate rewards. Topic progress shows the five words as learned after completion. Progress stays on this browser/device, not an account, and storage errors are shown without discarding the summary or overwriting unreadable data.

The profile and dashboard share live progress and streaks. Standalone mini-games are not implemented yet. Pronunciation uses the browser's speech synthesis when available.

## Profile and achievements

Open the avatar in the dashboard header to visit `/profile`. The explorer avatar is a placeholder; ranks progress from New Explorer to Word Explorer (5 words) and Word Wizard (all 20 words).

`ProgressProvider` in `src/context/ProgressContext.tsx` wraps the app in the root layout. It uses an SSR-safe external-store subscription to synchronize same-page changes and cross-tab storage events without hydration mismatches or writing empty defaults over saved data:

```tsx
// src/app/layout.tsx (already configured)
import { ProgressProvider } from "@/context/ProgressContext";

// Inside the root layout's body:
<ProgressProvider>{children}</ProgressProvider>
```

Client screens import `useProgress` from the context:

```tsx
"use client";
import { useProgress } from "@/context/ProgressContext";

export function HomeStars() {
  const { stars, streak, error, isHydrated } = useProgress();
  if (error) return <p role="alert">{error}</p>;
  return <p>{isHydrated ? `${stars} stars · ${streak} day streak` : "Loading progress…"}</p>;
}

export function LessonFinish() {
  const { completeTopic, error } = useProgress();
  return (
    <>
      {error && <p role="alert">{error}</p>}
      <button onClick={() => {
        try {
          completeTopic("animals", 5);
        } catch (error) {
          console.warn("Lesson progress was not saved.", error);
        }
      }}>Finish lesson</button>
    </>
  );
}

export function ProfileStats() {
  const { learnedWordsCount, completedTopics, summary } = useProgress();
  return <p>{learnedWordsCount} words · {completedTopics.length} topics · {summary.accuracy}% accuracy</p>;
}
```

The context exposes `stars`, `streak`, `lastActiveDate` (local `YYYY-MM-DD`), `completedTopics`, and `learnedWordsCount`, plus:

- `addStars(amount)`: add a non-negative whole number of bonus stars.
- `completeTopic(topicId, wordsCount)`: mark a topic complete, count its words once, and record today's activity.
- `saveLessonResult(topicId, wordsCount, result)`: atomically complete a topic, save accuracy/XP/audio history, and award only improvements to its best stars. The real lesson screen uses this rather than separate reward/completion calls.
- `resetProgress()`: explicitly replace the save with zeroed defaults, including history. Activity starts again on the next app load or lesson completion.
- `summary`: shared profile totals, including XP, best streak, accuracy, and lesson count.

Actions save synchronously and throw on invalid input or storage failure; the context's `error` also reports failures. Only navigate away from a lesson after its save succeeds. All reads and writes are browser-only. Missing storage starts fresh; corrupted storage displays default stats with an error and stays untouched until an explicit reset.

Data is saved under `alingua_user_progress_v1`. Existing `alingua.progress.v1` results migrate automatically, retaining rewards, completion counts, dates, and audio badges; the legacy key is left intact as a backup and ignored once the new save exists.

Finishing a lesson records a completion count, the local calendar date, and whether audio was enabled, alongside its best rewards. Replays count as completed lessons but do not duplicate stars, XP, or learned words. Accuracy is the mean of each completed topic's best accuracy. Opening the app **or** completing a lesson counts as daily activity: the first day starts at 1, yesterday increments the streak, and any missed calendar day resets it to 1. Same-day visits do not increment it. Calendar dates, rather than elapsed 24-hour periods, avoid daylight-saving issues.

Badges unlock after a first completion, a three-day visiting streak, learning every topic's words, or completing a lesson with audio enabled. Earned streak badges remain unlocked even after the current streak resets. Old saves without completion counts count as one completion per topic; missing historical dates and audio usage cannot be reconstructed.

## Audio

Web Audio synthesizes soft clicks, an ascending success chime, and a filtered error buzz without audio files or dependencies. The speaker toggle in the dashboard and lesson headers mutes all audio, including pronunciation. Mute is shared across navigation for the current page session; refreshing resets it.

`src/utils/sound.ts` exposes `soundFX.playClick()`, `playSuccess()`, and `playError()`. A single lazy `AudioContext` resumes from user interactions. Unsupported/blocked audio logs a warning once and never blocks lessons.

The root `SoundControls` listener automatically adds clicks to buttons, links, and radio choices (including card taps and keyboard activation). Add `data-sound="off"` to a control to opt out. Quiz and scramble checks share the lesson action handler, so each checked answer plays one feedback sound rather than a click plus a chime.

## Getting started

You need Node.js 20.9 or later and npm. A recent Node.js 22 release (22.13 or later) is recommended to satisfy the installed lint tooling.

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run lint` | Run ESLint. |
| `npm run build` | Create a production build and check TypeScript. |
| `npm run start` | Serve the production build after `npm run build`. |

The app uses `next/font` to self-host Nunito; the build may need network access to download the font.

## Tests

Run focused lesson-state and synthesized audio checks with Node.js 22.6 or later:

```bash
node --experimental-strip-types --test tests/lesson-state.test.mjs tests/sound.test.mjs
```

With the app running in another terminal, check the dashboard and lesson routes:

```bash
node --test tests/dashboard.test.mjs
```

The test uses `http://localhost:3000` by default. To use another address:

```bash
TEST_BASE_URL=http://localhost:3141 node --test tests/dashboard.test.mjs
```

## Project structure

```text
src/app/
  layout.tsx               Global layout and Nunito font
  globals.css              Global styles
  page.tsx                 Dashboard
  topics.ts                Example topic data
  lesson/[topicId]/page.tsx  Lesson route
  profile/page.tsx         Explorer profile and achievements
src/data/                  Example lesson vocabulary
src/context/               Shared progress provider and hook
src/components/            Dashboard and interactive lesson components
src/utils/                 Browser speech and saved progress helpers
tests/                     Lesson state, profile totals, sound, and route tests
public/                    Static assets
```

Icons use Lucide React, and the mascot animation uses Framer Motion.

## Configuration and deployment

No environment variables are currently required. Keep local `.env` files and private keys out of Git; `.env.example` is reserved for non-secret example values.

For production, run `npm run build` followed by `npm run start`, or deploy the repository to a Next.js-compatible host such as [Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs).
