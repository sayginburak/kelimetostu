import { describe, expect, it } from "vitest";
import { formatElapsedTime, normalizeElapsedMs } from "./timer";

describe("timer helpers", () => {
  it("normalizes unsafe elapsed values", () => {
    expect(normalizeElapsedMs(123.4)).toBe(123);
    expect(normalizeElapsedMs(-1)).toBe(0);
    expect(normalizeElapsedMs(Number.NaN)).toBe(0);
    expect(normalizeElapsedMs("1000")).toBe(0);
  });

  it("formats elapsed time", () => {
    expect(formatElapsedTime(0)).toBe("0:00");
    expect(formatElapsedTime(9_000)).toBe("0:09");
    expect(formatElapsedTime(75_000)).toBe("1:15");
    expect(formatElapsedTime(3_661_000)).toBe("1:01:01");
  });
});
