import { afterEach, describe, expect, it, vi } from "vitest";
import { createGame, makeGuess } from "./game";
import { copyShareText, createShareText } from "./share";

const words = ["abacı", "bahar", "deniz", "kalem", "sabah", "temiz", "zaman"];

describe("share text", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not reveal the answer on win", () => {
    let state = createGame({ answer: "kalem", words, dailyNumber: 123 });
    state = makeGuess({ ...state, currentInput: "deniz" }, "deniz", words);
    state = makeGuess({ ...state, currentInput: "kalem" }, "kalem", words);

    state = { ...state, elapsedMs: 75_000 };

    expect(createShareText(state)).toBe("Kelime Tostu #123\n2/14 · 1:15\n🟦🟩");
    expect(createShareText(state)).not.toContain("kalem");
  });

  it("uses X for losses", () => {
    const state = {
      ...createGame({ answer: "kalem", words, dailyNumber: 123, maxGuesses: 14 }),
      elapsedMs: 612_000,
      status: "lost" as const,
      guesses: Array.from({ length: 14 }, (_, index) => ({
        word: words[index % words.length],
        index: index % words.length,
        result: "moved_to_top" as const,
        topDistancePercentAfterGuess: 0,
        bottomDistancePercentAfterGuess: 0,
        intervalPositionAfterGuess: 0.5
      }))
    };

    expect(createShareText(state)).toBe(
      "Kelime Tostu #123\nX/14 · 10:12\n🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟧"
    );
  });

  it("falls back to textarea copying when clipboard api is unavailable", async () => {
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: () => true
    });
    vi.spyOn(document, "execCommand").mockReturnValue(true);
    expect(await copyShareText("Kelime Tostu")).toBe(true);
  });
});
