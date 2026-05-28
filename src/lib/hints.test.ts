import { describe, expect, it } from "vitest";
import { getPossibleNextLetters, getPossibleNextLettersForAlphabeticBounds } from "./hints";

const words = ["abacı", "bahar", "sabah", "sabit", "saçak", "saint", "sakin", "sanat", "temiz", "zaman"];

function possible(prefix: string, topBoundIndex = -1, bottomBoundIndex = words.length, guessedWords = new Set<string>()) {
  return getPossibleNextLetters({
    prefix,
    validWords: words,
    topBoundIndex,
    bottomBoundIndex,
    guessedWords
  });
}

describe("possible letter hints", () => {
  it("returns only first letters that can start in the current range", () => {
    expect([...possible("")]).toEqual(["a", "b", "s", "t", "z"]);
  });

  it("disables letters after a saint bottom bound", () => {
    const active = possible("", -1, words.indexOf("saint"));

    expect(active.has("s")).toBe(true);
    expect(active.has("t")).toBe(false);
    expect(active.has("z")).toBe(false);
  });

  it("calculates second and third letters from prefix", () => {
    expect([...possible("s")]).toEqual(["a"]);
    expect([...possible("sa")]).toEqual(["b", "ç", "i", "k", "n"]);
  });

  it("recomputes when prefix is shortened", () => {
    expect([...possible("sa")]).not.toContain("t");
    expect([...possible("s")]).toEqual(["a"]);
  });

  it("excludes guessed words when they are the only candidate", () => {
    expect(possible("sai", -1, words.length, new Set(["saint"])).has("n")).toBe(false);
  });

  it("excludes out of range words", () => {
    expect(possible("t", -1, words.indexOf("temiz")).has("e")).toBe(false);
  });
});

describe("alphabetic bound letter hints", () => {
  function byBounds(prefix: string, topBound = "aaaaa", bottomBound = "zzzzz") {
    return getPossibleNextLettersForAlphabeticBounds({ prefix, topBound, bottomBound });
  }

  it("uses only alphabetic bounds, not validWords existence", () => {
    const active = byBounds("sa", "aaaaa", "saint");

    expect(active.has("a")).toBe(true);
    expect(active.has("h")).toBe(true);
    expect(active.has("i")).toBe(true);
    expect(active.has("t")).toBe(false);
  });

  it("disables letters that cannot fit under the bottom bound", () => {
    const active = byBounds("", "aaaaa", "saint");

    expect(active.has("a")).toBe(true);
    expect(active.has("s")).toBe(true);
    expect(active.has("ş")).toBe(false);
    expect(active.has("t")).toBe(false);
    expect(active.has("z")).toBe(false);
  });

  it("disables letters that cannot fit above the top bound", () => {
    const active = byBounds("", "sabah", "zzzzz");

    expect(active.has("a")).toBe(false);
    expect(active.has("r")).toBe(false);
    expect(active.has("s")).toBe(true);
    expect(active.has("t")).toBe(true);
  });
});
