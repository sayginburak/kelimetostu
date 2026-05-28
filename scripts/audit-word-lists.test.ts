import { describe, expect, it } from "vitest";
import { assertWordListHealth } from "./word-list-utils";

describe("word list audit helpers", () => {
  it("accepts healthy lists", () => {
    expect(assertWordListHealth(["abacı", "bahar", "çelik"], ["bahar"])).toEqual([]);
  });

  it("rejects answer words outside validWords", () => {
    expect(assertWordListHealth(["abacı", "bahar"], ["çelik"])).toContain(
      "answerWords contains word missing from validWords: çelik"
    );
  });

  it("rejects duplicates and unsorted words", () => {
    const errors = assertWordListHealth(["çelik", "civar", "civar"], ["civar"]);

    expect(errors).toContain("validWords contains duplicates.");
    expect(errors.some((error) => error.startsWith("validWords is not Turkish-sorted"))).toBe(true);
  });

  it("rejects invalid characters and word lengths", () => {
    const errors = assertWordListHealth(["abacı", "abcde", "qatar", "uzunluk"], ["abacı"]);

    expect(errors).toContain("validWords contains q/w/x: qatar");
    expect(errors).toContain("validWords contains non-5-letter word: uzunluk");
  });
});
