# Alingua 🚀

A playful language-learning dashboard for children, built with Next.js App Router, TypeScript, and Tailwind CSS.

## Current status

The homepage includes a featured lesson, a streak and rewards display, activity teasers, an achievement, and topic cards for Animals, Food, Space, and Colors. Each topic links to a lesson placeholder.

Progress, rewards, and the profile are example data. Lessons, mini-games, and saved progress are not implemented yet.

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

## Smoke test

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
  lesson/[topicId]/page.tsx  Lesson placeholder
src/components/            Reusable cards, button, and animated mascot
tests/                     Dashboard navigation smoke test
public/                    Static assets
```

Icons use Lucide React, and the mascot animation uses Framer Motion.

## Configuration and deployment

No environment variables are currently required. Keep local `.env` files and private keys out of Git; `.env.example` is reserved for non-secret example values.

For production, run `npm run build` followed by `npm run start`, or deploy the repository to a Next.js-compatible host such as [Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs).
