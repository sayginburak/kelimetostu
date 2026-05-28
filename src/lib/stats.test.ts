import { describe, expect, it } from "vitest";
import { createGame, makeGuess } from "./game";
import {
  clearDailyStats,
  clearFreeStats,
  getAverageCompletionTimeMs,
  getGuessDistribution,
  getGroupedGuessDistribution,
  getWinPercent,
  loadDailyStats,
  loadFreeStats,
  recordGameResult,
  recordDailyResult
} from "./stats";

const words = ["bahar", "deniz", "kalem", "nehir", "öneri", "zaman"];

describe("daily stats", () => {
  it("records a finished daily game only once", () => {
    const storage = window.localStorage;
    clearDailyStats(storage);

    const game = createGame({
      answer: "kalem",
      mode: "daily",
      dateKey: "2026-05-27",
      dailyNumber: 512,
      words
    });
    const won = makeGuess({ ...game, elapsedMs: 65_000 }, "kalem", words);

    expect(recordDailyResult(won, storage).played).toBe(1);
    expect(recordDailyResult(won, storage).played).toBe(1);
    expect(loadDailyStats(storage).wins).toBe(1);
    expect(loadDailyStats(storage).guessHistory).toEqual([1]);
    expect(loadDailyStats(storage).timeHistoryMs).toEqual([65_000]);
  });

  it("updates streaks and win percent", () => {
    const storage = window.localStorage;
    clearDailyStats(storage);

    const wonGame = makeGuess(
      { ...createGame({ answer: "deniz", mode: "daily", dateKey: "2026-05-27", words }), elapsedMs: 42_000 },
      "deniz",
      words
    );
    const lostGame = {
      ...createGame({ answer: "kalem", mode: "daily", dateKey: "2026-05-28", words }),
      elapsedMs: 180_000,
      status: "lost" as const,
      guesses: Array.from({ length: 14 }, () => ({
        word: "deniz",
        index: 1,
        result: "moved_to_top" as const,
        topDistancePercentAfterGuess: 0,
        bottomDistancePercentAfterGuess: 0,
        intervalPositionAfterGuess: 0.5
      }))
    };

    recordDailyResult(wonGame, storage);
    const stats = recordDailyResult(lostGame, storage);

    expect(stats.played).toBe(2);
    expect(stats.wins).toBe(1);
    expect(stats.currentStreak).toBe(0);
    expect(stats.bestStreak).toBe(1);
    expect(getWinPercent(stats)).toBe(50);
    expect(stats.guessHistory).toEqual([1]);
    expect(stats.timeHistoryMs).toEqual([42_000, 180_000]);
    expect(getAverageCompletionTimeMs(stats)).toBe(111_000);
  });

  it("keeps daily and free stats separate", () => {
    const storage = window.localStorage;
    clearDailyStats(storage);
    clearFreeStats(storage);

    const dailyGame = makeGuess(
      { ...createGame({ answer: "deniz", mode: "daily", dateKey: "2026-05-27", words }), elapsedMs: 50_000 },
      "deniz",
      words
    );
    const freeGame = makeGuess(
      { ...createGame({ answer: "kalem", mode: "free", words }), elapsedMs: 80_000 },
      "kalem",
      words
    );

    recordGameResult(dailyGame, storage);
    recordGameResult(freeGame, storage);

    expect(loadDailyStats(storage).played).toBe(1);
    expect(loadDailyStats(storage).timeHistoryMs).toEqual([50_000]);
    expect(loadFreeStats(storage).played).toBe(1);
    expect(loadFreeStats(storage).timeHistoryMs).toEqual([80_000]);
  });

  it("normalizes missing time and guess storage", () => {
    const storage = window.localStorage;
    clearDailyStats(storage);
    storage.setItem(
      "kelime-tostu:daily-stats",
      JSON.stringify({
        played: 2,
        wins: 1,
        currentStreak: 1,
        bestStreak: 1,
        guessHistory: [2, 4.4, -1, "bad"],
        timeHistoryMs: [10_000, -1, Number.NaN, "bad"],
        completedDailyIds: ["2026-05-27"]
      })
    );

    expect(loadDailyStats(storage).guessHistory).toEqual([2, 4, 1]);
    expect(loadDailyStats(storage).timeHistoryMs).toEqual([10_000, 0, 0, 0]);
    expect(loadDailyStats(storage).completedDailyIds).toEqual(["2026-05-27"]);
  });

  it("builds guess distribution for won games", () => {
    expect(getGuessDistribution({ guessHistory: [1, 2, 2, 14, 99] }, 14)).toEqual([
      1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1
    ]);
  });

  it("groups guess distribution into readable ranges", () => {
    expect(getGroupedGuessDistribution({ guessHistory: [1, 2, 3, 4, 6, 7, 12, 13, 14, 99] }, 14)).toEqual([
      { label: "1-3", min: 1, max: 3, count: 3 },
      { label: "4-6", min: 4, max: 6, count: 2 },
      { label: "7-9", min: 7, max: 9, count: 1 },
      { label: "10-12", min: 10, max: 12, count: 1 },
      { label: "13-14", min: 13, max: 14, count: 2 }
    ]);
  });
});
