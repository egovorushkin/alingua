import type { WordItem } from "@/data/lessons";

export type LessonStep =
  | { kind: "learn"; word: WordItem }
  | { kind: "quiz"; word: WordItem; options: WordItem[] }
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
}

export type LessonAction =
  | { type: "shuffle"; steps: LessonStep[] }
  | { type: "reveal" }
  | { type: "answer"; answer: string }
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

export function matchesWord(word: WordItem, answer: string): boolean {
  return answer.trim().toLowerCase() === word.english.toLowerCase();
}

export function createLesson(words: WordItem[], random: () => number = () => 0.5): LessonState {
  const steps: LessonStep[] = [];
  words.forEach((word) => {
    const distractors = shuffle(words.filter((item) => item.id !== word.id), random).slice(0, 3);
    const letters = shuffle([...word.english.toUpperCase()], random);
    if (letters.join("") === word.english.toUpperCase()) {
      const different = letters.findIndex((letter) => letter !== letters[0]);
      if (different > 0) [letters[0], letters[different]] = [letters[different], letters[0]];
    }
    steps.push(
      { kind: "learn", word },
      { kind: "quiz", word, options: shuffle([word, ...distractors], random) },
      { kind: "scramble", word, letters },
    );
  });
  steps.push({ kind: "complete" });
  return {
    steps, stepIndex: 0, phase: "answering", revealed: false, answer: "",
    lives: 3, attempts: 0, correct: 0, bonusStars: 0, wasCorrect: false,
  };
}

export function lessonReducer(state: LessonState, action: LessonAction): LessonState {
  const step = state.steps[state.stepIndex];
  if (action.type === "retry") {
    if (state.phase !== "retry") return state;
    return { ...state, stepIndex: 0, phase: "answering", revealed: false, answer: "", lives: 3, attempts: 0, correct: 0, bonusStars: 0, wasCorrect: false };
  }
  if (state.phase === "retry" || state.phase === "complete") return state;

  if (action.type === "shuffle") {
    return state.stepIndex === 0 && !state.revealed ? { ...state, steps: action.steps } : state;
  }
  if (action.type === "reveal") {
    return step.kind === "learn" ? { ...state, revealed: true } : state;
  }
  if (action.type === "answer") {
    if (state.phase !== "answering" || (step.kind !== "quiz" && step.kind !== "scramble")) return state;
    if (step.kind === "quiz" && !step.options.some((word) => word.id === action.answer)) return state;
    return { ...state, answer: action.answer };
  }
  if (action.type === "check") {
    if (state.phase !== "answering" || !state.answer.trim() || (step.kind !== "quiz" && step.kind !== "scramble")) return state;
    const wasCorrect = step.kind === "quiz"
      ? state.answer === step.word.id
      : matchesWord(step.word, state.answer);
    return {
      ...state, phase: "feedback", wasCorrect, attempts: state.attempts + 1,
      correct: state.correct + Number(wasCorrect),
      bonusStars: state.bonusStars + (wasCorrect && step.kind === "scramble" ? 2 : 0),
      lives: state.lives - Number(!wasCorrect),
    };
  }
  if (action.type === "next") {
    if (state.phase === "feedback" && !state.wasCorrect) {
      return { ...state, phase: state.lives === 0 ? "retry" : "answering", answer: "" };
    }
    if (!(step.kind === "learn" && state.revealed) && !(state.phase === "feedback" && state.wasCorrect)) return state;
    const stepIndex = state.stepIndex + 1;
    return {
      ...state, stepIndex,
      phase: state.steps[stepIndex].kind === "complete" ? "complete" : "answering",
      revealed: false, answer: "", wasCorrect: false,
    };
  }
  return state;
}

export function lessonResult(state: LessonState) {
  const accuracy = state.attempts === 0 ? 0 : Math.round((state.correct / state.attempts) * 100);
  return { accuracy, xp: state.correct * 10, stars: 1 + Number(accuracy >= 60) + Number(accuracy === 100), bonusStars: state.bonusStars };
}
