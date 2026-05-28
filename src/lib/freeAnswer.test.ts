import { describe, expect, it } from "vitest";
import { groupWordsByFirstLetter, pickFreeAnswer } from "./freeAnswer";

describe("free answer picker", () => {
  it("groups answer words by first letter", () => {
    expect(groupWordsByFirstLetter(["armut", "ayran", "deniz"]).get("a")).toEqual(["armut", "ayran"]);
  });

  it("avoids recent answers when possible", () => {
    const answer = pickFreeAnswer({
      answers: ["armut", "deniz", "kalem"],
      recentAnswers: ["armut", "deniz"],
      random: () => 0
    });

    expect(answer).toBe("kalem");
  });

  it("avoids recent first letters when possible", () => {
    const answer = pickFreeAnswer({
      answers: ["armut", "ayran", "deniz", "kalem"],
      recentAnswers: ["armut"],
      random: () => 0
    });

    expect(answer[0]).not.toBe("a");
  });
});
