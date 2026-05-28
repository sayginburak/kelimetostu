import { useCallback, useMemo, useState } from "react";
import { answerWords } from "../data/answerWords";
import { validWords } from "../data/validWords";
import { getDailyAnswer } from "../lib/dailySeed";
import { pickFreeAnswer } from "../lib/freeAnswer";
import { createGame } from "../lib/game";
import {
  loadGameState,
  loadLastMode,
  loadModeGameState,
  loadRecentFreeAnswers,
  saveLastMode,
  saveModeGameState,
  saveRecentFreeAnswer
} from "../lib/storage";
import type { GameMode, GameState } from "../lib/types";
import Game from "./Game";
import HelpModal from "./HelpModal";
import HomeScreen from "./HomeScreen";

type Screen = "home" | "game";

function getSavedDailyState(daily: ReturnType<typeof getDailyAnswer>): GameState | null {
  const savedDaily = loadModeGameState("daily") ?? loadGameState();
  if (savedDaily?.mode !== "daily" || savedDaily.dateKey !== daily.dateKey || savedDaily.answer !== daily.answer) {
    return null;
  }

  return {
    ...savedDaily,
    dailyNumber: daily.dailyNumber
  };
}

function getSavedInitialState(daily: ReturnType<typeof getDailyAnswer>): GameState | null {
  const dailyState = getSavedDailyState(daily);
  const freeState = loadModeGameState("free");
  const isRestorableFreeState = freeState?.mode === "free" && (answerWords as readonly string[]).includes(freeState.answer);
  const lastMode = loadLastMode();

  if (lastMode === "free" && isRestorableFreeState) return freeState;
  if (lastMode === "daily" && dailyState) return dailyState;
  return isRestorableFreeState ? freeState : dailyState ?? null;
}

export default function App() {
  const daily = useMemo(() => getDailyAnswer(), []);
  const savedInitialState = useMemo(() => getSavedInitialState(daily), [daily]);
  const [screen, setScreen] = useState<Screen>("home");
  const [state, setState] = useState<GameState | null>(savedInitialState);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const persistState = useCallback((nextState: GameState) => {
    saveModeGameState(nextState);
    setState(nextState);
  }, []);

  const startDaily = useCallback(() => {
    saveLastMode("daily");
    const nextState =
      getSavedDailyState(daily) ??
      createGame({
        answer: daily.answer,
        mode: "daily",
        dateKey: daily.dateKey,
        dailyNumber: daily.dailyNumber
      });
    persistState(nextState);
    setScreen("game");
  }, [daily, persistState]);

  const startFree = useCallback((options?: { forceNew?: boolean }) => {
    saveLastMode("free");
    const savedFreeState = loadModeGameState("free");
    const canResumeSavedFree =
      savedFreeState?.mode === "free" && (answerWords as readonly string[]).includes(savedFreeState.answer);
    const pool = answerWords;
    const nextState =
      !options?.forceNew && canResumeSavedFree
        ? savedFreeState
        : createGame({
            answer: pickFreeAnswer({ answers: pool, recentAnswers: loadRecentFreeAnswers() }),
            mode: "free",
            dailyNumber: undefined
          });
    if (options?.forceNew || !canResumeSavedFree) {
      saveRecentFreeAnswer(nextState.answer);
    }
    persistState(nextState);
    setScreen("game");
  }, [persistState]);

  const restartMode = useCallback(
    (mode: GameMode) => {
      if (mode === "daily") startDaily();
      else startFree({ forceNew: true });
    },
    [startDaily, startFree]
  );

  if (screen === "home") {
    return (
      <>
        <HomeScreen onDaily={startDaily} onFree={startFree} onHelp={() => setIsHelpOpen(true)} />
        <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      </>
    );
  }

  return (
    <>
      <Game
        state={state ?? createGame({ answer: daily.answer, mode: "daily", dateKey: daily.dateKey, dailyNumber: daily.dailyNumber })}
        validWords={validWords}
        onStateChange={persistState}
        onHome={() => setScreen("home")}
        onHelp={() => setIsHelpOpen(true)}
        onRestart={restartMode}
      />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
}
