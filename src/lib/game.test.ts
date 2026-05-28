import { describe, expect, it } from "vitest";
import { gameConfig } from "../config/gameConfig";
import { getAlphabeticDistancePercent, getAlphabeticIntervalPosition } from "./alphabeticRank";
import {
  createGame,
  formatDistancePercent,
  getBottomBound,
  getBottomDistancePercent,
  getGuessResult,
  getIntervalPosition,
  getTopBound,
  getTopDistancePercent,
  isValidGuess,
  makeGuess
} from "./game";

const words = ["abacı", "bahar", "deniz", "kalem", "sabah", "saint", "temiz", "zaman"];

describe("game state", () => {
  it("creates the initial virtual bounds", () => {
    const state = createGame({ answer: "kalem", words });

    expect(state.topBoundIndex).toBe(-1);
    expect(state.bottomBoundIndex).toBe(words.length);
    expect(getTopBound(state, words)).toBe(gameConfig.virtualTopBound);
    expect(getBottomBound(state, words)).toBe(gameConfig.virtualBottomBound);
    expect(state.guesses.length + 1).toBe(1);
    expect(state.maxGuesses).toBe(14);
    expect(state.currentInput).toBe("");
  });

  it("moves lower guesses to top bound", () => {
    const state = createGame({ answer: "kalem", words });
    const next = makeGuess({ ...state, currentInput: "deniz" }, "deniz", words);

    expect(next.topBoundIndex).toBe(2);
    expect(next.bottomBoundIndex).toBe(words.length);
    expect(next.guesses[0].result).toBe("moved_to_top");
  });

  it("moves higher guesses to bottom bound", () => {
    const state = createGame({ answer: "kalem", words });
    const next = makeGuess({ ...state, currentInput: "sabah" }, "sabah", words);

    expect(next.topBoundIndex).toBe(-1);
    expect(next.bottomBoundIndex).toBe(4);
    expect(next.guesses[0].result).toBe("moved_to_bottom");
  });

  it("wins on the answer", () => {
    const state = createGame({ answer: "kalem", words });
    const next = makeGuess({ ...state, currentInput: "kalem" }, "kalem", words);

    expect(next.status).toBe("won");
    expect(getGuessResult(3, 3)).toBe("correct");
  });
});

describe("validation", () => {
  it("rejects out of range guesses", () => {
    const state = createGame({ answer: "kalem", words });
    const narrowed = makeGuess({ ...state, currentInput: "sabah" }, "sabah", words);

    expect(isValidGuess("temiz", narrowed, words)).toMatchObject({
      ok: false,
      reason: "range"
    });
  });

  it("rejects invalid, duplicate, length and qwx guesses", () => {
    const state = createGame({ answer: "kalem", words });
    const guessed = makeGuess({ ...state, currentInput: "deniz" }, "deniz", words);

    expect(isValidGuess("xxxxx", state, words)).toMatchObject({ ok: false, reason: "letters" });
    expect(isValidGuess("abc", state, words)).toMatchObject({ ok: false, reason: "length" });
    expect(isValidGuess("zzzzz", state, words)).toMatchObject({ ok: false, reason: "invalid" });
    expect(isValidGuess("deniz", guessed, words)).toMatchObject({ ok: false, reason: "duplicate" });
  });
});

describe("distance helpers", () => {
  it("calculates distance and marker values", () => {
    const state = createGame({ answer: "kalem", words });

    expect(getTopDistancePercent(state, words)).toBeCloseTo(
      getAlphabeticDistancePercent({ fromWord: "aaaaa", toWord: "kalem" })
    );
    expect(getBottomDistancePercent(state, words)).toBeCloseTo(
      getAlphabeticDistancePercent({ fromWord: "zzzzz", toWord: "kalem" })
    );
    expect(getIntervalPosition(state, words)).toBeCloseTo(
      getAlphabeticIntervalPosition({ topWord: "aaaaa", answer: "kalem", bottomWord: "zzzzz" })
    );
  });

  it.each([
    [27.2, "27"],
    [6.63, "6.6"],
    [0.834, "0.83"],
    [0.004, "0.01"],
    [0, "0.00"]
  ])("formats %s as %s", (input, output) => {
    expect(formatDistancePercent(input)).toBe(output);
  });
});
