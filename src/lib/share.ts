import type { GameState } from "./types";
import { formatElapsedTime } from "./timer";

export type ShareResult = "shared" | "copied" | "cancelled" | "manual";

export function createShareText(state: GameState): string {
  const title = `Söz Arası #${state.dailyNumber ?? "Serbest"}`;
  const guessLine = state.status === "lost" ? `X/${state.maxGuesses}` : `${state.guesses.length}/${state.maxGuesses}`;
  const resultLine = `${guessLine} · ${formatElapsedTime(state.elapsedMs)}`;
  const blocks = state.guesses
    .map((guess, index) => {
      if (guess.result === "correct") return "🟩";
      if (state.status === "lost" && index === state.guesses.length - 1) return "🟧";
      if (state.status !== "won" && index === state.guesses.length - 1) return "🟧";
      return "🟦";
    })
    .join("");

  return `${title}\n${resultLine}\n${blocks}`;
}

async function copyWithClipboardApi(text: string): Promise<boolean> {
  if (!navigator.clipboard?.writeText) return false;

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function copyWithTextAreaFallback(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

export async function copyShareText(text: string): Promise<boolean> {
  return (await copyWithClipboardApi(text)) || copyWithTextAreaFallback(text);
}

export async function shareResult(state: GameState): Promise<ShareResult> {
  const text = createShareText(state);
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled";
      }
    }
  }

  return (await copyShareText(text)) ? "copied" : "manual";
}
