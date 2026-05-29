import posthog, { type PostHog, type Properties } from "posthog-js";
import type { ShareResult } from "./share";
import type { GameState, Guess, GameMode } from "./types";

type ScreenName = "home" | "game";

const token = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN?.trim();
const apiHost = import.meta.env.VITE_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";
const captureLocal = import.meta.env.VITE_POSTHOG_CAPTURE_LOCAL === "true";
const debug = import.meta.env.VITE_POSTHOG_DEBUG === "true";
const appVersion = import.meta.env.VITE_APP_VERSION ?? "dev";

let isInitialized = false;

export function isAnalyticsEnabled(): boolean {
  if (!token) return false;
  if (import.meta.env.PROD) return true;
  return captureLocal;
}

function commonProperties(): Properties {
  return {
    app_name: "kelime_tostu",
    app_version: appVersion,
    app_environment: import.meta.env.MODE
  };
}

function gameProperties(state: Pick<GameState, "gameId" | "mode" | "dailyNumber" | "dateKey" | "maxGuesses">): Properties {
  return {
    game_id: state.gameId,
    mode: state.mode,
    daily_number: state.dailyNumber,
    date_key: state.dateKey,
    max_guesses: state.maxGuesses
  };
}

function answerProperties(state: Pick<GameState, "answer" | "answerIndex">): Properties {
  return {
    answer: state.answer,
    answer_index: state.answerIndex
  };
}

function progressProperties(state: Pick<GameState, "guesses" | "status" | "elapsedMs">): Properties {
  return {
    status: state.status,
    guess_count: state.guesses.length,
    elapsed_seconds: Math.round(state.elapsedMs / 1000)
  };
}

export function initializePostHog(): PostHog | null {
  if (!isAnalyticsEnabled()) return null;
  if (isInitialized) return posthog;
  if (!token) return null;

  posthog.init(token, {
    api_host: apiHost,
    defaults: "2026-01-30",
    capture_pageview: "history_change",
    capture_pageleave: "if_capture_pageview",
    autocapture: true,
    rageclick: true,
    disable_session_recording: false,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: ".ph-mask, [data-ph-mask]",
      blockSelector: ".ph-no-capture, [data-ph-block]"
    },
    capture_performance: true,
    person_profiles: "identified_only",
    debug
  });

  isInitialized = true;
  posthog.register(commonProperties());
  posthog.capture("app_loaded", commonProperties());

  return posthog;
}

export function captureEvent(eventName: string, properties: Properties = {}): void {
  if (!isInitialized) return;
  posthog.capture(eventName, {
    ...commonProperties(),
    ...properties
  });
}

export function trackScreenView(screen: ScreenName): void {
  captureEvent("screen_viewed", { screen });
}

export function trackHelpOpened(screen: ScreenName): void {
  captureEvent("help_opened", { screen });
}

export function trackStatsOpened(state: GameState): void {
  captureEvent("stats_opened", {
    ...gameProperties(state),
    ...answerProperties(state),
    ...progressProperties(state),
    is_finished: state.status !== "playing"
  });
}

export function trackGameStarted(state: GameState, source: "daily" | "free", resumed: boolean): void {
  captureEvent("game_started", {
    ...gameProperties(state),
    ...answerProperties(state),
    source,
    resumed
  });
}

export function trackInvalidGuess(
  state: GameState,
  reason: string,
  inputLength: number
): void {
  captureEvent("invalid_guess", {
    ...gameProperties(state),
    ...answerProperties(state),
    ...progressProperties(state),
    reason,
    input_length: inputLength
  });
}

export function trackGuessSubmitted(state: GameState, guess: Guess): void {
  captureEvent("guess_submitted", {
    ...gameProperties(state),
    ...answerProperties(state),
    ...progressProperties(state),
    guess_number: state.guesses.length,
    guess: guess.word,
    guess_index: guess.index,
    result: guess.result,
    top_distance_percent: guess.topDistancePercentAfterGuess,
    bottom_distance_percent: guess.bottomDistancePercentAfterGuess,
    interval_position: guess.intervalPositionAfterGuess
  });
}

export function trackGameCompleted(state: GameState): void {
  captureEvent("game_completed", {
    ...gameProperties(state),
    ...answerProperties(state),
    ...progressProperties(state),
    won: state.status === "won",
    lost: state.status === "lost"
  });
}

export function trackShareResult(state: GameState, result: ShareResult): void {
  captureEvent("share_result", {
    ...gameProperties(state),
    ...answerProperties(state),
    ...progressProperties(state),
    share_result: result
  });
}

export function trackModeSelected(mode: GameMode): void {
  captureEvent("mode_selected", { mode });
}
