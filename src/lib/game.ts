import { gameConfig } from "../config/gameConfig";
import { validWords } from "../data/validWords";
import { getAlphabeticDistancePercent, getAlphabeticIntervalPosition } from "./alphabeticRank";
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
  words: readonly string[] = validWords
): number {
  return getIntervalPositionForWords({
    topWord: state.topBoundIndex >= 0 ? words[state.topBoundIndex] : gameConfig.virtualTopBound,
    answer: words[state.answerIndex],
    bottomWord: state.bottomBoundIndex < words.length ? words[state.bottomBoundIndex] : gameConfig.virtualBottomBound
  });
}

function getIntervalPositionForWords({
  topWord,
  answer,
  bottomWord
}: {
  topWord: string;
  answer: string;
  bottomWord: string;
}): number {
  return getAlphabeticIntervalPosition({ topWord, answer, bottomWord });
}

export function getTopDistancePercent(
  state: Pick<GameState, "topBoundIndex" | "answerIndex">,
  words: readonly string[] = validWords
): number {
  const topWord = state.topBoundIndex >= 0 ? words[state.topBoundIndex] : gameConfig.virtualTopBound;
  const answer = words[state.answerIndex];
  return getAlphabeticDistancePercent({ fromWord: topWord, toWord: answer });
}

export function getBottomDistancePercent(
  state: Pick<GameState, "bottomBoundIndex" | "answerIndex">,
  words: readonly string[] = validWords
): number {
  const bottomWord = state.bottomBoundIndex < words.length ? words[state.bottomBoundIndex] : gameConfig.virtualBottomBound;
  const answer = words[state.answerIndex];
  return getAlphabeticDistancePercent({ fromWord: bottomWord, toWord: answer });
}

export function formatDistancePercent(value: number): string {
  if (!Number.isFinite(value)) return "?";
  if (value >= 10) return String(Math.round(value));
  if (value >= 1) return value.toFixed(1);
  if (value > 0 && value < 0.01) return "0.01";
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
    intervalPositionAfterGuess: getIntervalPosition(nextState, words)
  };

  const guesses = [...state.guesses, nextGuess];
  const status = result === "correct" ? "won" : guesses.length >= state.maxGuesses ? "lost" : "playing";

  return {
    ...nextState,
    guesses,
    status
  };
}
