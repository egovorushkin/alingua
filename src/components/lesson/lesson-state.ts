import type { WordItem } from "@/data/lessons";
import {
  createScrambleBoard, placeScrambleTile, removeScrambleTile, revealScrambleHint,
  scrambleAnswer, typeScrambleAnswer, type ScrambleBoard,
} from "./scramble-state.ts";

export type LessonStep =
  | { kind: "learn"; word: WordItem }
  | { kind: "quiz"; word: WordItem; options: WordItem[] }
  | { kind: "listen"; word: WordItem; options: WordItem[] }
  | { kind: "scramble"; word: WordItem; letters: string[] }
  | { kind: "complete" };

export interface LessonState {
  steps: LessonStep[];
  stepIndex: number;
  phase: "answering" | "feedback" | "retry" | "complete";
  revealed: boolean;
  answer: string;
  lives: number;
  attempts: number;
  correct: number;
  bonusStars: number;
  wasCorrect: boolean;
  boss: boolean;
  review: boolean;
  combo: number;
  bestCombo: number;
  scramble: ScrambleBoard;
}

export type LessonAction =
  | { type: "shuffle"; steps: LessonStep[] }
  | { type: "reveal" }
  | { type: "answer"; answer: string }
  | { type: "scramble-tile"; tileId: number }
  | { type: "scramble-remove"; index: number }
  | { type: "hint" }
  | { type: "check" }
  | { type: "next" }
  | { type: "retry" };

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
  }
  return shuffled;
}

function uniqueWords(words: WordItem[]) {
  return [...new Map(words.map((word) => [word.id, word])).values()];
}

export function createChoices(word: WordItem, pool: WordItem[], random: () => number): WordItem[] {
  const distractors = [...new Map(uniqueWords(pool)
    .filter((item) => item.id !== word.id && item.russian.toLowerCase() !== word.russian.toLowerCase())
    .map((item) => [item.russian.toLowerCase(), item])).values()];
  if (distractors.length < 3) throw new Error("An exercise needs at least four distinct words.");
  return shuffle([word, ...shuffle(distractors, random).slice(0, 3)], random);
}

export function createListeningRounds(pool: WordItem[], random: () => number) {
  const words = uniqueWords(pool);
  if (words.length < 5) throw new Error("A listening game needs at least five distinct words.");
  return shuffle(words, random).slice(0, 5).map((word) => ({
    kind: "listen" as const, word, options: createChoices(word, words, random),
  }));
}

export function matchesWord(word: WordItem, answer: string): boolean {
  return answer.trim().toLowerCase() === word.english.toLowerCase();
}

function scrambleStep(word: WordItem, random: () => number): LessonStep {
  const letters = shuffle([...word.english.toUpperCase()], random);
  if (letters.join("") === word.english.toUpperCase()) {
    const different = letters.findIndex((letter) => letter !== letters[0]);
    if (different > 0) [letters[0], letters[different]] = [letters[different], letters[0]];
  }
  return { kind: "scramble", word, letters };
}

function exercises(word: WordItem, pool: WordItem[], random: () => number): LessonStep[] {
  const scramble = scrambleStep(word, random);
  return [
    { kind: "quiz", word, options: createChoices(word, pool, random) },
    { kind: "listen", word, options: createChoices(word, pool, random) },
    scramble,
  ];
}

export function createLesson(words: WordItem[], random: () => number = () => 0.5, boss = false): LessonState {
  if (boss && uniqueWords(words).length < 8) throw new Error("A boss challenge needs at least eight distinct words.");
  let steps: LessonStep[] = [];
  const targets = boss ? shuffle(uniqueWords(words), random).slice(0, 10) : words;
  targets.forEach((word, index) => {
    const review = exercises(word, words, random);
    if (boss) steps.push(review[index % review.length]);
    else steps.push({ kind: "learn", word }, ...review);
  });
  if (boss) steps = shuffle(steps, random);
  steps.push({ kind: "complete" });
  return {
    steps, stepIndex: 0, phase: "answering", revealed: false, answer: "",
    lives: 3, attempts: 0, correct: 0, bonusStars: 0, wasCorrect: false, boss, review: false, combo: 0, bestCombo: 0,
    scramble: createScrambleBoard(steps[0].kind === "scramble" ? steps[0].letters : []),
  };
}

export function createMistakeReview(words: WordItem[], pool: WordItem[], random: () => number = () => 0.5): LessonState {
  if (!words.length) throw new Error("A review needs at least one word.");
  const choicesAvailable = new Set(pool.map((word) => word.russian.toLowerCase())).size >= 4;
  const offset = Math.floor(random() * 3);
  const steps = shuffle(uniqueWords(words), random).map((word, index) =>
    choicesAvailable ? exercises(word, pool, random)[(index + offset) % 3] : scrambleStep(word, random));
  return {
    steps: [...steps, { kind: "complete" }], stepIndex: 0, phase: "answering", revealed: false,
    answer: "", lives: 3, attempts: 0, correct: 0, bonusStars: 0, wasCorrect: false,
    boss: false, review: true, combo: 0, bestCombo: 0,
    scramble: createScrambleBoard(steps[0].kind === "scramble" ? steps[0].letters : []),
  };
}

export function lessonReducer(state: LessonState, action: LessonAction): LessonState {
  const step = state.steps[state.stepIndex];
  if (action.type === "retry") {
    if (state.phase !== "retry") return state;
    return { ...state, stepIndex: 0, phase: "answering", revealed: false, answer: "", lives: 3, attempts: 0, correct: 0, bonusStars: 0, wasCorrect: false, combo: 0, bestCombo: 0, scramble: createScrambleBoard(state.steps[0].kind === "scramble" ? state.steps[0].letters : []) };
  }
  if (state.phase === "retry" || state.phase === "complete") return state;

  if (action.type === "shuffle") {
    return state.stepIndex === 0 && state.phase === "answering" && !state.revealed && !state.answer && state.attempts === 0 ? {
      ...state, steps: action.steps,
      scramble: createScrambleBoard(action.steps[0].kind === "scramble" ? action.steps[0].letters : []),
    } : state;
  }
  if (action.type === "reveal") {
    return step.kind === "learn" ? { ...state, revealed: true } : state;
  }
  if (action.type === "answer") {
    if (state.phase !== "answering" || (step.kind !== "quiz" && step.kind !== "listen" && step.kind !== "scramble")) return state;
    if ((step.kind === "quiz" || step.kind === "listen") && !step.options.some((word) => word.id === action.answer)) return state;
    if (step.kind === "scramble") {
      const scramble = typeScrambleAnswer(state.scramble, step.letters, action.answer);
      return { ...state, scramble, answer: scrambleAnswer(scramble) };
    }
    return { ...state, answer: action.answer };
  }
  if (action.type === "hint" || action.type === "scramble-tile" || action.type === "scramble-remove") {
    if (state.phase !== "answering" || step.kind !== "scramble") return state;
    const scramble = action.type === "hint" ? revealScrambleHint(state.scramble, step.letters, step.word.english)
      : action.type === "scramble-tile" ? placeScrambleTile(state.scramble, step.letters, action.tileId)
        : removeScrambleTile(state.scramble, action.index);
    return scramble === state.scramble ? state : { ...state, scramble, answer: scrambleAnswer(scramble) };
  }
  if (action.type === "check") {
    if (state.phase !== "answering" || !state.answer.trim() || (step.kind !== "quiz" && step.kind !== "listen" && step.kind !== "scramble")) return state;
    const wasCorrect = step.kind === "scramble" ? matchesWord(step.word, state.answer) : state.answer === step.word.id;
    return {
      ...state, phase: "feedback", wasCorrect, attempts: state.attempts + 1,
      correct: state.correct + Number(wasCorrect),
      combo: wasCorrect ? state.combo + 1 : 0,
      bestCombo: Math.max(state.bestCombo, wasCorrect ? state.combo + 1 : 0),
      bonusStars: state.bonusStars + (!state.review && wasCorrect && (step.kind === "scramble" || step.kind === "listen") ? step.kind === "scramble" && state.scramble.hintsUsed ? 1 : 2 : 0),
      lives: state.lives - Number(!wasCorrect && !state.review),
    };
  }
  if (action.type === "next") {
    if (state.phase === "feedback" && !state.wasCorrect) {
      if (state.review || state.lives === 0 || step.kind !== "listen") {
        const scramble = step.kind === "scramble" ? typeScrambleAnswer(state.scramble, step.letters, "") : state.scramble;
        return { ...state, phase: state.lives === 0 ? "retry" : "answering", answer: step.kind === "scramble" ? scrambleAnswer(scramble) : "", scramble };
      }
    }
    if (!(step.kind === "learn" && state.revealed) && !(state.phase === "feedback" && (state.wasCorrect || step.kind === "listen"))) return state;
    const stepIndex = state.stepIndex + 1;
    return {
      ...state, stepIndex,
      phase: state.steps[stepIndex].kind === "complete" ? "complete" : "answering",
      revealed: false, answer: "", wasCorrect: false,
      scramble: createScrambleBoard(state.steps[stepIndex].kind === "scramble" ? state.steps[stepIndex].letters : []),
    };
  }
  return state;
}

export function lessonResult(state: LessonState) {
  const accuracy = state.attempts === 0 ? 0 : Math.round((state.correct / state.attempts) * 100);
  return { accuracy, xp: state.correct * 10, stars: 1 + Number(accuracy >= 60) + Number(accuracy === 100), bonusStars: state.bonusStars };
}
