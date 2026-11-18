import type { WordItem } from "@/data/lessons";

export type LessonStep =
  | { kind: "learn"; word: WordItem }
  | { kind: "quiz"; word: WordItem; options: WordItem[] }
  | { kind: "scramble"; word: WordItem }
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
  wasCorrect: boolean;
}

export type LessonAction =
  | { type: "reveal" }
  | { type: "answer"; answer: string }
  | { type: "check" }
  | { type: "next" }
  | { type: "retry" };

export function createLesson(words: WordItem[]): LessonState {
  const steps: LessonStep[] = words.map((word) => ({ kind: "learn", word }));
  words.forEach((word, index) => {
    const options = Array.from({ length: 4 }, (_, offset) => words[(index + offset) % words.length]);
    const shift = (index + 1) % options.length;
    steps.push({ kind: "quiz", word, options: [...options.slice(shift), ...options.slice(0, shift)] });
  });
  steps.push(...words.map((word): LessonStep => ({ kind: "scramble", word })), { kind: "complete" });
  return {
    steps, stepIndex: 0, phase: "answering", revealed: false, answer: "",
    lives: 3, attempts: 0, correct: 0, wasCorrect: false,
  };
}

export function lessonReducer(state: LessonState, action: LessonAction): LessonState {
  const step = state.steps[state.stepIndex];
  if (action.type === "retry") {
    if (state.phase !== "retry") return state;
    return { ...state, stepIndex: 0, phase: "answering", revealed: false, answer: "", lives: 3, attempts: 0, correct: 0, wasCorrect: false };
  }
  if (state.phase === "retry" || state.phase === "complete") return state;

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
      : state.answer.trim().toLowerCase() === step.word.english.toLowerCase();
    return {
      ...state, phase: "feedback", wasCorrect, attempts: state.attempts + 1,
      correct: state.correct + Number(wasCorrect),
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
  return { accuracy, xp: state.correct * 10, stars: 1 + Number(accuracy >= 60) + Number(accuracy === 100) };
}
