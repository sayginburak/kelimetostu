import { describe, expect, it } from "vitest";
import { createGame } from "./game";
import {
  clearGameState,
  clearModeGameState,
  loadGameState,
  loadLastMode,
  loadModeGameState,
  loadRecentFreeAnswers,
  saveGameState,
  saveLastMode,
  saveModeGameState,
  saveRecentFreeAnswer
} from "./storage";

describe("storage", () => {
  it("saves, loads and clears state", () => {
    const storage = window.localStorage;
    clearGameState(storage);
    const state = createGame({ answer: "deniz", words: ["bahar", "deniz", "kalem"] });

    saveGameState(state, storage);
    expect(loadGameState(storage)?.answer).toBe("deniz");

    clearGameState(storage);
    expect(loadGameState(storage)).toBeNull();
  });

  it("keeps daily and free games in separate slots", () => {
    const storage = window.localStorage;
    clearGameState(storage);

    const daily = createGame({ answer: "deniz", mode: "daily", words: ["bahar", "deniz", "kalem"] });
    const free = createGame({ answer: "kalem", mode: "free", words: ["bahar", "deniz", "kalem"] });

    saveModeGameState(daily, storage);
    saveModeGameState(free, storage);

    expect(loadModeGameState("daily", storage)?.answer).toBe("deniz");
    expect(loadModeGameState("free", storage)?.answer).toBe("kalem");
    expect(loadLastMode(storage)).toBe("free");

    clearModeGameState("free", storage);
    expect(loadModeGameState("daily", storage)?.answer).toBe("deniz");
    expect(loadModeGameState("free", storage)).toBeNull();
  });

  it("stores last selected mode", () => {
    const storage = window.localStorage;
    clearGameState(storage);

    saveLastMode("daily", storage);
    expect(loadLastMode(storage)).toBe("daily");

    saveLastMode("free", storage);
    expect(loadLastMode(storage)).toBe("free");
  });

  it("stores a bounded recent free answer history", () => {
    const storage = window.localStorage;
    clearGameState(storage);

    saveRecentFreeAnswer("kalem", storage);
    saveRecentFreeAnswer("deniz", storage);
    saveRecentFreeAnswer("kalem", storage);

    expect(loadRecentFreeAnswers(storage)).toEqual(["deniz", "kalem"]);
  });
});
