export interface ScrambleSlot {
  tileId: number | null;
  letter: string;
  isLockedHint: boolean;
}

export interface ScrambleBoard {
  slots: ScrambleSlot[];
  hintsUsed: number;
}

const emptySlot = (): ScrambleSlot => ({ tileId: null, letter: "", isLockedHint: false });

export function createScrambleBoard(letters: string[]): ScrambleBoard {
  return { slots: letters.map(emptySlot), hintsUsed: 0 };
}

export function scrambleAnswer(board: ScrambleBoard): string {
  return board.slots.map((slot) => slot.letter || " ").join("").trimEnd();
}

export function scrambleHintLimit(english: string): number {
  return Math.min(2, Math.max(0, [...english].length - 1));
}

export function typeScrambleAnswer(board: ScrambleBoard, letters: string[], answer: string): ScrambleBoard {
  const characters = [...answer.toUpperCase()];
  const used = new Set(board.slots.filter((slot) => slot.isLockedHint).map((slot) => slot.tileId));
  const slots = Array.from({ length: Math.max(letters.length, characters.length) }, (_, index) => {
    const previous = board.slots[index];
    if (previous?.isLockedHint) return previous;
    const character = characters[index] || "";
    const letter = character === " " && !letters.includes(" ") ? "" : character;
    const tileId = letter ? letters.findIndex((value, id) => value === letter && !used.has(id)) : -1;
    if (tileId >= 0) used.add(tileId);
    return { tileId: tileId < 0 ? null : tileId, letter, isLockedHint: false };
  });
  return { ...board, slots };
}

export function placeScrambleTile(board: ScrambleBoard, letters: string[], tileId: number): ScrambleBoard {
  if (!Number.isInteger(tileId) || tileId < 0 || tileId >= letters.length || board.slots.some((slot) => slot.tileId === tileId)) return board;
  const index = board.slots.findIndex((slot) => !slot.letter);
  if (index < 0) return board;
  const slots = [...board.slots];
  slots[index] = { tileId, letter: letters[tileId], isLockedHint: false };
  return { ...board, slots };
}

export function removeScrambleTile(board: ScrambleBoard, index: number): ScrambleBoard {
  if (!board.slots[index]?.letter || board.slots[index].isLockedHint) return board;
  const slots = [...board.slots];
  slots[index] = emptySlot();
  return { ...board, slots };
}

export function revealScrambleHint(board: ScrambleBoard, letters: string[], english: string): ScrambleBoard {
  if (board.hintsUsed >= scrambleHintLimit(english)) return board;
  const target = [...english.toUpperCase()];
  const index = target.findIndex((letter, position) => board.slots[position].letter !== letter);
  if (index < 0) return board;
  const candidates = letters.map((letter, tileId) => ({ letter, tileId }))
    .filter(({ letter, tileId }) => letter === target[index] && !board.slots.some((slot) => slot.tileId === tileId && slot.isLockedHint));
  const available = candidates.find(({ tileId }) => !board.slots.some((slot) => slot.tileId === tileId));
  const source = available ?? candidates.find(({ tileId }) => board.slots.some((slot, position) =>
    slot.tileId === tileId && slot.letter !== target[position]));
  if (!source) throw new Error("Не удалось найти букву для подсказки. Попробуй открыть урок заново.");
  const slots = board.slots.map((slot) => slot.tileId === source.tileId ? emptySlot() : slot);
  slots[index] = { tileId: source.tileId, letter: target[index], isLockedHint: true };
  return { slots, hintsUsed: board.hintsUsed + 1 };
}

export function maskScrambleExample(sentence: string, english: string): string {
  const escaped = english.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return sentence.replace(new RegExp(escaped, "gi"), "_____");
}
