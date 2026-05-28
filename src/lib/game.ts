import { gameConfig } from "../config/gameConfig";
import { validWords } from "../data/validWords";
import type { GameMode, GameState, Guess, GuessResult } from "./types";
import { displayTurkishWord, hasOnlyTurkishGameLetters, normalizeTurkishWord } from "./turkishSort";

export type GuessValidation =
  | { ok: true }
  | { ok: false; message: string; reason: "length" | "letters" | "invalid" | "range" | "duplicate" | "finished" };

export function getWordIndex(word: string, words: readonly string[] = validWords): number {
  return words.indexOf(normalizeTurkishWord(word));
}

function createGameId(mode: GameMode): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${mode}:${crypto.randomUUID()}`;
  }
  return `${mode}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

export function createGame(params: {
  answer: string;
  mode?: GameMode;
  dateKey?: string;
  dailyNumber?: number;
  words?: readonly string[];
  maxGuesses?: number;
}): GameState {
  const words = params.words ?? validWords;
  const answer = normalizeTurkishWord(params.answer);
  const answerIndex = getWordIndex(answer, words);

  if (answerIndex < 0) {
    throw new Error(`Answer "${answer}" must exist in validWords.`);
  }

  return {
    gameId: createGameId(params.mode ?? "daily"),
    mode: params.mode ?? "daily",
    dateKey: params.dateKey,
    dailyNumber: params.dailyNumber,
    answer,
    answerIndex,
    guesses: [],
    topBoundIndex: -1,
    bottomBoundIndex: words.length,
    currentInput: "",
    status: "playing",
    maxGuesses: params.maxGuesses ?? gameConfig.maxGuesses,
    elapsedMs: 0
  };
}

export function getTopBound(state: GameState, words: readonly string[] = validWords): string {
  return state.topBoundIndex >= 0 ? words[state.topBoundIndex] : gameConfig.virtualTopBound;
}

export function getBottomBound(state: GameState, words: readonly string[] = validWords): string {
  return state.bottomBoundIndex < words.length ? words[state.bottomBoundIndex] : gameConfig.virtualBottomBound;
}

export function getBounds(state: GameState, words: readonly string[] = validWords) {
  return {
    topBound: getTopBound(state, words),
    bottomBound: getBottomBound(state, words),
    topLabel: displayTurkishWord(getTopBound(state, words)),
    bottomLabel: displayTurkishWord(getBottomBound(state, words))
  };
}

export function isGuessInsideCurrentRange(guessIndex: number, state: GameState): boolean {
  return guessIndex > state.topBoundIndex && guessIndex < state.bottomBoundIndex;
}

export function isValidGuess(guess: string, state: GameState, words: readonly string[] = validWords): GuessValidation {
  if (state.status !== "playing") {
    return { ok: false, message: "Oyun bitti", reason: "finished" };
  }

  const word = normalizeTurkishWord(guess);
  if (word.length !== gameConfig.wordLength) {
    return { ok: false, message: "Tahmin 5 harfli olmalı", reason: "length" };
  }

  if (!hasOnlyTurkishGameLetters(word)) {
    return { ok: false, message: "Q, W, X veya geçersiz karakter kullanılamaz", reason: "letters" };
  }

  const guessIndex = getWordIndex(word, words);
  if (guessIndex < 0) {
    return { ok: false, message: "Bu kelime listede yok", reason: "invalid" };
  }

  if (state.guesses.some((item) => item.word === word)) {
    return { ok: false, message: "Bu kelimeyi zaten denedin", reason: "duplicate" };
  }

  if (!isGuessInsideCurrentRange(guessIndex, state)) {
    return { ok: false, message: "Tahmin mevcut aralığın dışında", reason: "range" };
  }

  return { ok: true };
}

export function getGuessResult(guessIndex: number, answerIndex: number): GuessResult {
  if (guessIndex === answerIndex) return "correct";
  return guessIndex < answerIndex ? "moved_to_top" : "moved_to_bottom";
}

export function getIntervalPosition(
  state: Pick<GameState, "topBoundIndex" | "bottomBoundIndex" | "answerIndex">,
): number {
  const width = state.bottomBoundIndex - state.topBoundIndex;
  if (width <= 0) return 0.5;
  const position = (state.answerIndex - state.topBoundIndex) / width;
  if (!Number.isFinite(position)) return 0.5;
  return Math.min(1, Math.max(0, position));
}

export function getTopDistancePercent(
  state: Pick<GameState, "topBoundIndex" | "answerIndex">,
  words: readonly string[] = validWords
): number {
  if (words.length === 0) return 0;
  return ((state.answerIndex - state.topBoundIndex) / words.length) * 100;
}

export function getBottomDistancePercent(
  state: Pick<GameState, "bottomBoundIndex" | "answerIndex">,
  words: readonly string[] = validWords
): number {
  if (words.length === 0) return 0;
  return ((state.bottomBoundIndex - state.answerIndex) / words.length) * 100;
}

export function formatDistancePercent(value: number): string {
  if (!Number.isFinite(value)) return "?";
  if (value >= 10) return String(Math.round(value));
  if (value >= 1) return value.toFixed(1);
  return value.toFixed(2);
}

export function makeGuess(state: GameState, guess: string, words: readonly string[] = validWords): GameState {
  const validation = isValidGuess(guess, state, words);
  if (!validation.ok) {
    throw new Error(validation.message);
  }

  const word = normalizeTurkishWord(guess);
  const guessIndex = getWordIndex(word, words);
  const result = getGuessResult(guessIndex, state.answerIndex);
  const nextState: GameState = {
    ...state,
    currentInput: "",
    topBoundIndex: result === "moved_to_top" ? guessIndex : state.topBoundIndex,
    bottomBoundIndex: result === "moved_to_bottom" ? guessIndex : state.bottomBoundIndex,
    status: result === "correct" ? "won" : state.status
  };

  const nextGuess: Guess = {
    word,
    index: guessIndex,
    result,
    topDistancePercentAfterGuess: getTopDistancePercent(nextState, words),
    bottomDistancePercentAfterGuess: getBottomDistancePercent(nextState, words),
    intervalPositionAfterGuess: getIntervalPosition(nextState)
  };

  const guesses = [...state.guesses, nextGuess];
  const status = result === "correct" ? "won" : guesses.length >= state.maxGuesses ? "lost" : "playing";

  return {
    ...nextState,
    guesses,
    status
  };
}
