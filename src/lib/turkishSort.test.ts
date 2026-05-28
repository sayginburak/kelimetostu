import { describe, expect, it } from "vitest";
import { compareTurkishWords, normalizeTurkishWord } from "./turkishSort";

describe("turkish sorting", () => {
  it.each([
    ["c", "ç"],
    ["g", "ğ"],
    ["h", "ı"],
    ["ı", "i"],
    ["o", "ö"],
    ["s", "ş"],
    ["u", "ü"]
  ])("%s < %s", (left, right) => {
    expect(compareTurkishWords(left, right)).toBeLessThan(0);
  });
});

describe("normalizeTurkishWord", () => {
  it.each([
    ["İNCİR", "incir"],
    ["IŞIK", "ışık"],
    ["ÖLÇÜM", "ölçüm"]
  ])("%s -> %s", (input, output) => {
    expect(normalizeTurkishWord(input)).toBe(output);
  });
});
