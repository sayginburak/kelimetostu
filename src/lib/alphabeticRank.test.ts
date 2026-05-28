import { describe, expect, it } from "vitest";
import {
  getAlphabeticDistancePercent,
  getAlphabeticIntervalPosition,
  getAlphabeticRankSpace,
  getAlphabeticWordRank,
  getTurkishLetterRank
} from "./alphabeticRank";

describe("alphabetic rank", () => {
  it("ranks Turkish letters in game alphabet order", () => {
    expect(getTurkishLetterRank("c")).toBeLessThan(getTurkishLetterRank("ç"));
    expect(getTurkishLetterRank("g")).toBeLessThan(getTurkishLetterRank("ğ"));
    expect(getTurkishLetterRank("h")).toBeLessThan(getTurkishLetterRank("ı"));
    expect(getTurkishLetterRank("ı")).toBeLessThan(getTurkishLetterRank("i"));
    expect(getTurkishLetterRank("o")).toBeLessThan(getTurkishLetterRank("ö"));
    expect(getTurkishLetterRank("s")).toBeLessThan(getTurkishLetterRank("ş"));
    expect(getTurkishLetterRank("u")).toBeLessThan(getTurkishLetterRank("ü"));
  });

  it("converts five-letter Turkish words to base alphabet ranks", () => {
    expect(getAlphabeticWordRank("aaaaa")).toBe(0);
    expect(getAlphabeticWordRank("aaaab")).toBe(1);
    expect(getAlphabeticWordRank("aaaac")).toBe(2);
    expect(getAlphabeticWordRank("aaaaç")).toBe(3);
    expect(getAlphabeticWordRank("hzzzz")).toBeLessThan(getAlphabeticWordRank("ıaaaa"));
    expect(getAlphabeticWordRank("ıaaaa")).toBeLessThan(getAlphabeticWordRank("iaaaa"));
    expect(getAlphabeticWordRank("zzzzz")).toBe(getAlphabeticRankSpace());
  });

  it("calculates interval position from alphabetic distance", () => {
    const middlePosition = getAlphabeticWordRank("maaaa") / getAlphabeticWordRank("zzzzz");
    expect(getAlphabeticIntervalPosition({ topWord: "aaaaa", answer: "maaaa", bottomWord: "zzzzz" })).toBeCloseTo(middlePosition);
    expect(getAlphabeticIntervalPosition({ topWord: "maaaa", answer: "aaaaa", bottomWord: "zzzzz" })).toBe(0);
    expect(getAlphabeticIntervalPosition({ topWord: "zzzzz", answer: "maaaa", bottomWord: "aaaaa" })).toBe(0.5);
    expect(getAlphabeticIntervalPosition({ topWord: "aaaaa", answer: "zzzzz", bottomWord: "maaaa" })).toBe(1);
    expect(getAlphabeticIntervalPosition({ topWord: "aaaaa", answer: "kalem", bottomWord: "zzzzz" })).toBeGreaterThan(0);
  });

  it("calculates distance percent safely", () => {
    expect(getAlphabeticDistancePercent({ fromWord: "aaaaa", toWord: "aaaaa" })).toBe(0);
    expect(getAlphabeticDistancePercent({ fromWord: "aaaaa", toWord: "zzzzz" })).toBe(100);
    expect(getAlphabeticDistancePercent({ fromWord: "abc", toWord: "zzzzz" })).toBe(0);
    expect(getAlphabeticDistancePercent({ fromWord: "aaaaa", toWord: "xxxxx" })).toBe(0);
  });

  it("keeps close alphabetic distances positive before display formatting", () => {
    const closeDistance = getAlphabeticDistancePercent({ fromWord: "şekil", toWord: "şeker" });
    expect(closeDistance).toBeGreaterThan(0);
    expect(closeDistance).toBeLessThan(0.01);
  });
});
