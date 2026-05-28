import type { GameState } from "./types";
import type { GameMode } from "./types";
import { normalizeElapsedMs } from "./timer";

const legacyStorageKey = "kelime-tostu:game-state";
const dailyStorageKey = "kelime-tostu:game-state:daily";
const freeStorageKey = "kelime-tostu:game-state:free";
const lastModeStorageKey = "kelime-tostu:last-mode";
const recentFreeAnswersStorageKey = "kelime-tostu:recent-free-answers";
const maxRecentFreeAnswers = 20;

function getStateStorageKey(mode: GameMode): string {
  return mode === "daily" ? dailyStorageKey : freeStorageKey;
}

function normalizeSavedGameState(value: GameState): GameState {
  const fallbackId =
    value.mode === "daily"
      ? `daily:${value.dateKey ?? value.dailyNumber ?? value.answer}`
      : `free:${value.answer}:${value.guesses.length}:${value.status}`;

  return {
    ...value,
    gameId: typeof value.gameId === "string" && value.gameId.length > 0 ? value.gameId : fallbackId,
    elapsedMs: normalizeElapsedMs(value.elapsedMs)
  };
}

export function loadGameState(storage: Storage = localStorage): GameState | null {
  const raw = storage.getItem(legacyStorageKey);
  if (!raw) return null;

  try {
    return normalizeSavedGameState(JSON.parse(raw) as GameState);
  } catch {
    return null;
  }
}

export function saveGameState(state: GameState, storage: Storage = localStorage): void {
  storage.setItem(legacyStorageKey, JSON.stringify(state));
}

export function loadModeGameState(mode: GameMode, storage: Storage = localStorage): GameState | null {
  const raw = storage.getItem(getStateStorageKey(mode));
  if (!raw) return null;

  try {
    return normalizeSavedGameState(JSON.parse(raw) as GameState);
  } catch {
    return null;
  }
}

export function saveModeGameState(state: GameState, storage: Storage = localStorage): void {
  storage.setItem(getStateStorageKey(state.mode), JSON.stringify(state));
  storage.setItem(lastModeStorageKey, state.mode);
}

export function clearModeGameState(mode: GameMode, storage: Storage = localStorage): void {
  storage.removeItem(getStateStorageKey(mode));
}

export function loadLastMode(storage: Storage = localStorage): GameMode | null {
  const value = storage.getItem(lastModeStorageKey);
  return value === "daily" || value === "free" ? value : null;
}

export function saveLastMode(mode: GameMode, storage: Storage = localStorage): void {
  storage.setItem(lastModeStorageKey, mode);
}

export function loadRecentFreeAnswers(storage: Storage = localStorage): string[] {
  const raw = storage.getItem(recentFreeAnswersStorageKey);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function saveRecentFreeAnswer(answer: string, storage: Storage = localStorage): void {
  const previous = loadRecentFreeAnswers(storage).filter((word) => word !== answer);
  const next = [...previous, answer].slice(-maxRecentFreeAnswers);
  storage.setItem(recentFreeAnswersStorageKey, JSON.stringify(next));
}

export function clearGameState(storage: Storage = localStorage): void {
  storage.removeItem(legacyStorageKey);
  storage.removeItem(dailyStorageKey);
  storage.removeItem(freeStorageKey);
  storage.removeItem(lastModeStorageKey);
  storage.removeItem(recentFreeAnswersStorageKey);
  storage.removeItem("kelime-tostu:daily-stats");
  storage.removeItem("kelime-tostu:free-stats");
}
