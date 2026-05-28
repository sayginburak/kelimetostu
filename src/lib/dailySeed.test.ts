import { describe, expect, it } from "vitest";
import { getDailyAnswer, getDailyAnswerIndex, getDayNumber, getIstanbulDateKey } from "./dailySeed";

describe("daily seed", () => {
  it("formats Istanbul date keys", () => {
    expect(getIstanbulDateKey(new Date("2025-01-01T21:30:00.000Z"))).toBe("2025-01-02");
  });

  it("calculates daily number from start date", () => {
    expect(getDayNumber("2026-05-28")).toBe(1);
    expect(getDayNumber("2026-06-04")).toBe(8);
  });

  it("chooses deterministic answers", () => {
    const result = getDailyAnswer({
      dateKey: "2026-05-30",
      answers: ["bahar", "deniz", "kalem"],
      words: ["bahar", "deniz", "kalem"]
    });

    expect(result.answer).toBe("bahar");
    expect(result.answerIndex).toBe(0);
    expect(result.dailyNumber).toBe(3);
  });

  it("does not walk through the answer list alphabetically", () => {
    const answers = ["abacı", "bahar", "deniz", "kalem", "sabah", "zaman"];
    expect(getDailyAnswerIndex("2025-01-01", answers, answers)).not.toBe(0);
    expect(getDailyAnswerIndex("2025-01-02", answers, answers)).not.toBe(1);
  });

  it("prefers answers away from alphabetic edges", () => {
    const answers = ["abacı", "bahar", "deniz", "kalem", "sabah", "zaman"];
    const index = getDailyAnswerIndex("2026-05-27", answers, answers);

    expect(index).toBeGreaterThanOrEqual(1);
    expect(index).toBeLessThanOrEqual(4);
  });
});
