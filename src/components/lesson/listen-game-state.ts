import type { LessonStep } from "./lesson-state";

type ListenRound = Extract<LessonStep, { kind: "listen" }>;

export interface ListenGameState {
  rounds: ListenRound[];
  roundIndex: number;
  phase: "ready" | "answering" | "feedback" | "complete";
  answer: string;
  correct: number;
  wasCorrect: boolean;
}

export const initialListenGame: ListenGameState = {
  rounds: [], roundIndex: 0, phase: "ready", answer: "", correct: 0, wasCorrect: false,
};

type ListenGameAction =
  | { type: "start"; rounds: ListenRound[] }
  | { type: "answer"; answer: string }
  | { type: "check" }
  | { type: "next" }
  | { type: "restart" };

export function listenGameReducer(state: ListenGameState, action: ListenGameAction): ListenGameState {
  if (action.type === "restart") return state.phase === "complete" ? initialListenGame : state;
  if (action.type === "start") {
    if (state.phase !== "ready") return state;
    if (action.rounds.length !== 5) throw new Error("A listening challenge must have five rounds.");
    return { ...initialListenGame, rounds: action.rounds, phase: "answering" };
  }
  const round = state.rounds[state.roundIndex];
  if (action.type === "answer" && state.phase === "answering") {
    return round.options.some((option) => option.id === action.answer) ? { ...state, answer: action.answer } : state;
  }
  if (action.type === "check" && state.phase === "answering" && state.answer) {
    const wasCorrect = state.answer === round.word.id;
    return { ...state, phase: "feedback", wasCorrect, correct: state.correct + Number(wasCorrect) };
  }
  if (action.type === "next" && state.phase === "feedback") {
    const roundIndex = state.roundIndex + 1;
    return {
      ...state, roundIndex, answer: "", wasCorrect: false,
      phase: roundIndex === state.rounds.length ? "complete" : "answering",
    };
  }
  return state;
}
