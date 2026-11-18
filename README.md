# Alingua 🚀

A playful language-learning dashboard for children, built with Next.js App Router, TypeScript, and Tailwind CSS.

## Current status

The homepage includes a featured lesson, a streak and rewards display, activity teasers, an achievement, and topic cards for Animals, Food, Space, and Colors. Each topic has five flashcards, five translation questions, and five word scrambles.

Incorrect answers use a heart and must be tried again. At zero hearts, a friendly dialog offers a fresh attempt with three hearts or a return home. The summary shows accuracy across all quiz/scramble attempts, 10 XP per correct answer, and 1–3 stars (2 at 60% accuracy, 3 at 100%).

**Finish & Return Home** saves each topic's best result in browser local storage. Dashboard stars and XP total those best results; replaying a topic does not duplicate rewards. Topic progress shows the five words as learned after completion. Progress stays on this browser/device, not an account, and storage errors are shown without discarding the summary or overwriting unreadable data.

The profile and dashboard share live progress and streaks. Standalone mini-games are not implemented yet. Pronunciation uses the browser's speech synthesis when available.

## Profile and achievements

Open the avatar in the dashboard header to visit `/profile`. The explorer avatar is a placeholder; ranks progress from New Explorer to Word Explorer (5 words) and Word Wizard (all 20 words).

`useProgress()` in `src/utils/progress.ts` subscribes to both same-page updates and cross-tab storage events. It reads the local date only on the client to keep prerendering deterministic. `getProgressSummary(progress, topics, today)` supplies the shared totals, streak, and accuracy to the profile and homepage. New screens can reuse these directly:

```tsx
const { progress, error, today } = useProgress();
const stats = getProgressSummary(progress, topics, today);
```

Finishing a lesson records a completion count, the local calendar date, and whether audio was enabled, alongside its best rewards. Replays count as completed lessons but do not duplicate stars, XP, or learned words. Accuracy is the mean of each completed topic's best accuracy. A daily streak stays active if the last completion was today or yesterday; multiple lessons on one day count once.

Badges unlock after a first completion, a three-day streak, learning every topic's words, or completing a lesson with audio enabled. Earned streak badges remain unlocked even after the current streak expires. Existing saved results remain readable and count as one completion per topic; historical dates and audio usage cannot be reconstructed, so those badges start tracking with new completions.

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
src/components/            Dashboard and interactive lesson components
src/utils/                 Browser speech and saved progress helpers
tests/                     Lesson state, profile totals, sound, and route tests
public/                    Static assets
```

Icons use Lucide React, and the mascot animation uses Framer Motion.

## Configuration and deployment

No environment variables are currently required. Keep local `.env` files and private keys out of Git; `.env.example` is reserved for non-secret example values.

For production, run `npm run build` followed by `npm run start`, or deploy the repository to a Next.js-compatible host such as [Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs).
