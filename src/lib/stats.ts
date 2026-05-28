import { normalizeElapsedMs } from "./timer";
import type { GameMode, GameState } from "./types";

export type DailyStats = {
  played: number;
  wins: number;
  currentStreak: number;
  bestStreak: number;
  guessHistory: number[];
  timeHistoryMs: number[];
  completedDailyIds: string[];
};

export type GuessDistributionGroup = {
  label: string;
  min: number;
  max: number;
  count: number;
};

const dailyStatsStorageKey = "kelime-tostu:daily-stats";
const freeStatsStorageKey = "kelime-tostu:free-stats";
const defaultGuessDistributionRanges = [
  [1, 3],
  [4, 6],
  [7, 9],
  [10, 12],
  [13, 14]
] as const;

function getStatsStorageKey(mode: GameMode): string {
  return mode === "daily" ? dailyStatsStorageKey : freeStatsStorageKey;
}

export const emptyDailyStats: DailyStats = {
  played: 0,
  wins: 0,
  currentStreak: 0,
  bestStreak: 0,
  guessHistory: [],
  timeHistoryMs: [],
  completedDailyIds: []
};

function normalizeStats(value: Partial<DailyStats> | null): DailyStats {
  const guessHistory = Array.isArray(value?.guessHistory)
    ? value.guessHistory
        .filter((item): item is number => typeof item === "number" && Number.isFinite(item))
        .map((item) => Math.max(1, Math.round(item)))
    : [];
  const timeHistoryMs = Array.isArray(value?.timeHistoryMs)
    ? value.timeHistoryMs.map(normalizeElapsedMs)
    : [];

  return {
    played: value?.played ?? 0,
    wins: value?.wins ?? 0,
    currentStreak: value?.currentStreak ?? 0,
    bestStreak: value?.bestStreak ?? 0,
    guessHistory,
    timeHistoryMs,
    completedDailyIds: Array.isArray(value?.completedDailyIds)
      ? value.completedDailyIds.filter((item): item is string => typeof item === "string")
      : []
  };
}

export function loadStats(mode: GameMode, storage: Storage = localStorage): DailyStats {
  const raw = storage.getItem(getStatsStorageKey(mode));
  if (!raw) return { ...emptyDailyStats, guessHistory: [], timeHistoryMs: [] };

  try {
    return normalizeStats(JSON.parse(raw) as Partial<DailyStats>);
  } catch {
    return { ...emptyDailyStats, guessHistory: [], timeHistoryMs: [] };
  }
}

export function loadDailyStats(storage: Storage = localStorage): DailyStats {
  return loadStats("daily", storage);
}

export function loadFreeStats(storage: Storage = localStorage): DailyStats {
  return loadStats("free", storage);
}

export function saveStats(mode: GameMode, stats: DailyStats, storage: Storage = localStorage): void {
  storage.setItem(getStatsStorageKey(mode), JSON.stringify(stats));
}

export function saveDailyStats(stats: DailyStats, storage: Storage = localStorage): void {
  saveStats("daily", stats, storage);
}

export function clearDailyStats(storage: Storage = localStorage): void {
  storage.removeItem(dailyStatsStorageKey);
}

export function clearFreeStats(storage: Storage = localStorage): void {
  storage.removeItem(freeStatsStorageKey);
}

export function getGameCompletionId(state: Pick<GameState, "gameId" | "mode" | "dateKey" | "dailyNumber">): string | null {
  if (state.mode === "free") return state.gameId ? `free:${state.gameId}` : null;
  if (state.dateKey) return state.dateKey;
  if (state.dailyNumber) return `daily-${state.dailyNumber}`;
  return null;
}

export function getDailyCompletionId(state: Pick<GameState, "gameId" | "mode" | "dateKey" | "dailyNumber">): string | null {
  return state.mode === "daily" ? getGameCompletionId(state) : null;
}

export function getWinPercent(stats: Pick<DailyStats, "played" | "wins">): number {
  if (stats.played === 0) return 0;
  return Math.round((stats.wins / stats.played) * 100);
}

export function getAverageCompletionTimeMs(stats: Pick<DailyStats, "timeHistoryMs">): number {
  if (stats.timeHistoryMs.length === 0) return 0;
  return Math.round(stats.timeHistoryMs.reduce((total, time) => total + time, 0) / stats.timeHistoryMs.length);
}

export function getGuessDistribution(stats: Pick<DailyStats, "guessHistory">, maxGuesses: number): number[] {
  const distribution = Array.from({ length: maxGuesses }, () => 0);
  for (const guessCount of stats.guessHistory) {
    if (guessCount >= 1 && guessCount <= maxGuesses) {
      distribution[guessCount - 1] += 1;
    }
  }
  return distribution;
}

export function getGroupedGuessDistribution(
  stats: Pick<DailyStats, "guessHistory">,
  maxGuesses: number
): GuessDistributionGroup[] {
  const ranges = defaultGuessDistributionRanges.filter(([min]) => min <= maxGuesses);
  return ranges.map(([min, rawMax]) => {
    const max = Math.min(rawMax, maxGuesses);
    const count = stats.guessHistory.filter((guessCount) => guessCount >= min && guessCount <= max).length;
    return {
      label: min === max ? String(min) : `${min}-${max}`,
      min,
      max,
      count
    };
  });
}

export function recordDailyResult(state: GameState, storage: Storage = localStorage): DailyStats {
  return recordGameResult(state, storage);
}

export function recordGameResult(state: GameState, storage: Storage = localStorage): DailyStats {
  const previous = loadStats(state.mode, storage);
  const completionId = getGameCompletionId(state);
  if (!completionId || state.status === "playing" || previous.completedDailyIds.includes(completionId)) {
    return previous;
  }

  const won = state.status === "won";
  const currentStreak = won ? previous.currentStreak + 1 : 0;
  const next: DailyStats = {
    played: previous.played + 1,
    wins: previous.wins + (won ? 1 : 0),
    currentStreak,
    bestStreak: Math.max(previous.bestStreak, currentStreak),
    guessHistory: won ? [...previous.guessHistory, state.guesses.length] : previous.guessHistory,
    timeHistoryMs: [...previous.timeHistoryMs, normalizeElapsedMs(state.elapsedMs)],
    completedDailyIds: [...previous.completedDailyIds, completionId]
  };

  saveStats(state.mode, next, storage);
  return next;
}
