import { BarChart3, CircleHelp, Home } from "lucide-react";
import { formatElapsedTime } from "../lib/timer";
import type { GameState } from "../lib/types";
import GuessProgressDots from "./GuessProgressDots";

type Props = {
  state: GameState;
  onHome: () => void;
  onHelp: () => void;
  onStats: () => void;
};

export default function GameHeader({ state, onHome, onHelp, onStats }: Props) {
  const currentGuess =
    state.status === "playing" ? Math.min(state.guesses.length + 1, state.maxGuesses) : state.guesses.length;

  return (
    <header className="game-header border-b-2 border-ink pb-2 sm:pb-3">
      <div className="grid grid-cols-[38px_1fr_78px] items-center gap-2 sm:grid-cols-[44px_1fr_92px]">
        <button
          type="button"
          aria-label="Ana menü"
          onClick={onHome}
          className="grid h-9 w-9 place-items-center rounded-lg text-ink transition hover:bg-stone-200 sm:h-11 sm:w-11"
        >
          <Home className="h-7 w-7 sm:h-[30px] sm:w-[30px]" aria-hidden />
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-black leading-none sm:text-5xl">Kelime Tostu</h1>
          <p className="text-xs font-black uppercase tracking-normal text-stone-600">
            {state.mode === "daily" ? `Günlük #${state.dailyNumber}` : "Serbest Oyun"}
          </p>
        </div>
        <div className="flex justify-end gap-1">
          <button
            type="button"
            aria-label="Yardım"
            onClick={onHelp}
            className="grid h-9 w-9 place-items-center rounded-lg text-ink transition hover:bg-stone-200 sm:h-11 sm:w-11"
          >
            <CircleHelp className="h-7 w-7 sm:h-[30px] sm:w-[30px]" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="İstatistik"
            onClick={onStats}
            className="grid h-9 w-9 place-items-center rounded-lg text-ink transition hover:bg-stone-200 sm:h-11 sm:w-11"
          >
            <BarChart3 className="h-7 w-7 sm:h-[30px] sm:w-[30px]" strokeWidth={3} aria-hidden />
          </button>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-[64px_1fr_64px] items-center gap-2 sm:mt-3 sm:grid-cols-[110px_1fr_110px] sm:gap-4">
        <div>
          <div className="text-[10px] font-black uppercase text-stone-600 sm:text-xs">Tahmin</div>
          <div className="text-2xl font-black leading-none sm:text-3xl">
            {currentGuess} / {state.maxGuesses}
          </div>
        </div>
        <GuessProgressDots state={state} />
        <div className="text-right">
          <div className="text-[10px] font-black uppercase text-stone-600 sm:text-xs">Süre</div>
          <div className="text-2xl font-black leading-none sm:text-3xl">{formatElapsedTime(state.elapsedMs)}</div>
        </div>
      </div>
    </header>
  );
}
