import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gameConfig } from "../config/gameConfig";
import { trackGameCompleted, trackGuessSubmitted, trackInvalidGuess, trackStatsOpened } from "../lib/analytics";
import { getBottomBound, getBottomDistancePercent, getIntervalPosition, getTopBound, getTopDistancePercent, isValidGuess, makeGuess } from "../lib/game";
import { getPossibleNextLettersForAlphabeticBounds } from "../lib/hints";
import { loadStats, recordGameResult, type DailyStats } from "../lib/stats";
import { normalizeElapsedMs } from "../lib/timer";
import { normalizeTurkishWord, TURKISH_ALPHABET } from "../lib/turkishSort";
import type { GameMode, GameState } from "../lib/types";
import GameHeader from "./GameHeader";
import PossibleLettersStrip from "./PossibleLettersStrip";
import ResultModal from "./ResultModal";
import StatsModal from "./StatsModal";
import TurkishKeyboard from "./TurkishKeyboard";
import WordBoard, { type BoundMoveAnimation } from "./WordBoard";

type Props = {
  state: GameState;
  validWords: readonly string[];
  onStateChange: (state: GameState) => void;
  onHome: () => void;
  onHelp: () => void;
  onRestart: (mode: GameMode) => void;
};

export default function Game({ state, validWords, onStateChange, onHome, onHelp, onRestart }: Props) {
  const [message, setMessage] = useState("");
  const [animation, setAnimation] = useState<BoundMoveAnimation | null>(null);
  const [isResultModalDismissed, setIsResultModalDismissed] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [gameStats, setGameStats] = useState<DailyStats>(() => loadStats(state.mode));
  const animationTimers = useRef<number[]>([]);
  const latestState = useRef(state);
  const timerBaseElapsed = useRef(normalizeElapsedMs(state.elapsedMs));
  const timerStartedAt = useRef<number | null>(null);
  const timerInterval = useRef<number | null>(null);
  const trackedCompletedGames = useRef(new Set<string>());

  const getLiveElapsedMs = useCallback(() => {
    if (timerStartedAt.current === null) return timerBaseElapsed.current;
    return normalizeElapsedMs(timerBaseElapsed.current + Date.now() - timerStartedAt.current);
  }, []);

  const persistElapsed = useCallback(() => {
    const elapsedMs = getLiveElapsedMs();
    timerBaseElapsed.current = elapsedMs;
    if (timerStartedAt.current !== null) timerStartedAt.current = Date.now();

    const current = latestState.current;
    if (normalizeElapsedMs(current.elapsedMs) !== elapsedMs) {
      onStateChange({ ...current, elapsedMs });
    }
  }, [getLiveElapsedMs, onStateChange]);

  const stopTimer = useCallback(() => {
    if (timerInterval.current !== null) {
      window.clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    if (timerStartedAt.current !== null) {
      persistElapsed();
      timerStartedAt.current = null;
    }
  }, [persistElapsed]);

  const shouldTimerRun = useCallback(() => {
    return (
      latestState.current.status === "playing" &&
      document.visibilityState === "visible" &&
      document.hasFocus()
    );
  }, []);

  const updateTimerActivity = useCallback(() => {
    if (!shouldTimerRun()) {
      stopTimer();
      return;
    }

    if (timerStartedAt.current === null) {
      timerBaseElapsed.current = normalizeElapsedMs(latestState.current.elapsedMs);
      timerStartedAt.current = Date.now();
    }

    if (timerInterval.current === null) {
      timerInterval.current = window.setInterval(persistElapsed, 1000);
    }
  }, [persistElapsed, shouldTimerRun, stopTimer]);

  const clearAnimationTimers = useCallback(() => {
    for (const timer of animationTimers.current) window.clearTimeout(timer);
    animationTimers.current = [];
  }, []);

  useEffect(() => {
    latestState.current = state;
    const incomingElapsed = normalizeElapsedMs(state.elapsedMs);
    if (timerStartedAt.current === null) {
      timerBaseElapsed.current = incomingElapsed;
    } else if (incomingElapsed > timerBaseElapsed.current) {
      timerBaseElapsed.current = incomingElapsed;
      timerStartedAt.current = Date.now();
    }
  }, [state]);

  const possibleLetters = useMemo(() => {
    if (state.currentInput.length >= gameConfig.wordLength || state.status !== "playing") return new Set<string>();
    return getPossibleNextLettersForAlphabeticBounds({
      prefix: state.currentInput,
      topBound: getTopBound(state, validWords),
      bottomBound: getBottomBound(state, validWords)
    });
  }, [state, validWords]);

  const showMessage = useCallback((text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 1800);
  }, []);

  const setInput = useCallback(
    (currentInput: string) => {
      onStateChange({ ...state, currentInput });
    },
    [onStateChange, state]
  );

  const addLetter = useCallback(
    (letter: string) => {
      if (animation || state.status !== "playing" || state.currentInput.length >= gameConfig.wordLength) return;
      const normalized = normalizeTurkishWord(letter);
      if (!TURKISH_ALPHABET.includes(normalized as (typeof TURKISH_ALPHABET)[number])) {
        showMessage("Q, W, X veya geçersiz karakter kullanılamaz");
        return;
      }
      if (!possibleLetters.has(normalized)) {
        showMessage("Bu harf mevcut alfabetik aralığın dışında.");
        return;
      }
      setInput(state.currentInput + normalized);
    },
    [animation, possibleLetters, setInput, showMessage, state.currentInput, state.status]
  );

  const backspace = useCallback(() => {
    if (animation || state.status !== "playing") return;
    setInput(state.currentInput.slice(0, -1));
  }, [animation, setInput, state.currentInput, state.status]);

  const submit = useCallback(() => {
    if (animation) return;
    const stateWithCurrentTime = { ...state, elapsedMs: getLiveElapsedMs() };
    const validation = isValidGuess(stateWithCurrentTime.currentInput, stateWithCurrentTime, validWords);
    if (!validation.ok) {
      trackInvalidGuess(stateWithCurrentTime, validation.reason, stateWithCurrentTime.currentInput.length);
      showMessage(validation.message);
      return;
    }

    const nextState = makeGuess(stateWithCurrentTime, stateWithCurrentTime.currentInput, validWords);
    const lastGuess = nextState.guesses[nextState.guesses.length - 1];
    trackGuessSubmitted(nextState, lastGuess);
    if (lastGuess.result === "correct") {
      setIsResultModalDismissed(false);
      onStateChange(nextState);
      return;
    }

    clearAnimationTimers();
    setAnimation({ word: lastGuess.word, result: lastGuess.result, step: -1 });
    const stepDelay = 80;
    const travelDuration = 260;
    const stepTimers = Array.from({ length: gameConfig.wordLength }, (_, index) =>
      window.setTimeout(() => {
        setAnimation((current) => (current ? { ...current, step: index } : current));
      }, stepDelay * index)
    );
    const finishTimer = window.setTimeout(() => {
      setAnimation(null);
      if (nextState.status !== "playing") setIsResultModalDismissed(false);
      onStateChange(nextState);
    }, stepDelay * (gameConfig.wordLength - 1) + travelDuration + 120);

    animationTimers.current = [...stepTimers, finishTimer];
  }, [animation, clearAnimationTimers, getLiveElapsedMs, onStateChange, showMessage, state, validWords]);

  useEffect(() => clearAnimationTimers, [clearAnimationTimers]);

  useEffect(() => {
    updateTimerActivity();

    window.addEventListener("focus", updateTimerActivity);
    window.addEventListener("blur", updateTimerActivity);
    window.addEventListener("pagehide", stopTimer);
    document.addEventListener("visibilitychange", updateTimerActivity);

    return () => {
      window.removeEventListener("focus", updateTimerActivity);
      window.removeEventListener("blur", updateTimerActivity);
      window.removeEventListener("pagehide", stopTimer);
      document.removeEventListener("visibilitychange", updateTimerActivity);
      stopTimer();
    };
  }, [stopTimer, updateTimerActivity]);

  useEffect(() => {
    updateTimerActivity();
  }, [state.status, state.mode, state.answer, updateTimerActivity]);

  useEffect(() => {
    setGameStats(loadStats(state.mode));
  }, [state.mode]);

  useEffect(() => {
    if (state.status !== "playing") {
      setGameStats(recordGameResult(state));
      if (!trackedCompletedGames.current.has(state.gameId)) {
        trackedCompletedGames.current.add(state.gameId);
        trackGameCompleted(state);
      }
    }
  }, [state]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "Enter") {
        event.preventDefault();
        submit();
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        backspace();
        return;
      }
      if (event.key.length === 1) {
        event.preventDefault();
        addLetter(event.key);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [addLetter, backspace, submit]);

  const hasGuesses = state.guesses.length > 0;
  const isFinished = state.status !== "playing";
  const boardInput = state.status === "won" ? state.answer : state.currentInput;
  const openStatsOrResult = useCallback(() => {
    trackStatsOpened(state);
    if (isFinished) {
      setIsStatsModalOpen(false);
      setIsResultModalDismissed(false);
      return;
    }
    setIsStatsModalOpen(true);
  }, [isFinished, state]);

  return (
    <main className="game-screen bg-paper px-3 py-2 text-ink sm:px-6 sm:py-4">
      <div className="mx-auto flex h-full w-full max-w-4xl flex-col">
        <GameHeader state={state} onHome={onHome} onHelp={onHelp} onStats={openStatsOrResult} />
        <section className="game-layout flex flex-1 flex-col gap-2 pb-1 pt-2 sm:gap-5 sm:pb-3 sm:pt-5">
          <div className="game-board-zone">
            <WordBoard
              topBound={getTopBound(state, validWords)}
              bottomBound={getBottomBound(state, validWords)}
              currentInput={boardInput}
              status={state.status}
              intervalPosition={getIntervalPosition(state)}
              showDistances={hasGuesses}
              topDistancePercent={getTopDistancePercent(state, validWords)}
              bottomDistancePercent={getBottomDistancePercent(state, validWords)}
              animation={animation}
            />
            <div className="min-h-5 text-center text-xs font-bold text-active sm:min-h-7 sm:text-sm" aria-live="polite">
              {message}
            </div>
          </div>
          <div className="game-controls-zone">
            <PossibleLettersStrip possibleLetters={possibleLetters} disabled={Boolean(animation) || state.currentInput.length >= 5 || state.status !== "playing"} />
            <TurkishKeyboard onLetter={addLetter} onBackspace={backspace} onEnter={submit} disabled={Boolean(animation) || state.status !== "playing"} />
          </div>
        </section>
      </div>
      <ResultModal
        state={state}
        gameStats={gameStats}
        isOpen={isFinished && !isResultModalDismissed && !isStatsModalOpen}
        onClose={() => setIsResultModalDismissed(true)}
        onMenu={onHome}
        onRestart={() => onRestart(state.mode)}
      />
      <StatsModal mode={state.mode} stats={gameStats} isOpen={isStatsModalOpen} onClose={() => setIsStatsModalOpen(false)} />
    </main>
  );
}
