import { describe, expect, it } from "vitest";
import { cleanCandidate, isConservativeAnswerCandidate, normalizeSourceWord, sortUnique } from "./word-list-utils";

describe("word list build helpers", () => {
  it("normalizes Turkish words and circumflex letters", () => {
    expect(normalizeSourceWord("İNCİR")).toBe("incir");
    expect(normalizeSourceWord("IŞIK")).toBe("ışık");
    expect(normalizeSourceWord("kâğıt")).toBe("kağıt");
  });

  it("accepts valid 5-letter Turkish words", () => {
    expect(cleanCandidate("abacı")).toEqual({ accepted: true, word: "abacı" });
  });

  it("rejects invalid raw candidates", () => {
    expect(cleanCandidate("abajur")).toMatchObject({ accepted: false, reason: "not-five-letters" });
    expect(cleanCandidate("iki söz")).toMatchObject({ accepted: false, reason: "blocked-character" });
    expect(cleanCandidate("can'ın")).toMatchObject({ accepted: false, reason: "blocked-character" });
    expect(cleanCandidate("qatar")).toMatchObject({ accepted: false, reason: "qwx" });
    expect(cleanCandidate("Anıt")).toMatchObject({ accepted: false, reason: "likely-special-name" });
  });

  it("sorts and deduplicates with Turkish alphabet order", () => {
    expect(sortUnique(["çelik", "cılız", "çelik", "civar"])).toEqual(["cılız", "civar", "çelik"]);
  });

  it("keeps answer candidates conservative", () => {
    expect(isConservativeAnswerCandidate("gelmek")).toBe(false);
    expect(isConservativeAnswerCandidate("kalem")).toBe(true);
  });
});
