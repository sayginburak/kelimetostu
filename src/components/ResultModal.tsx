import { ArrowLeft, RotateCcw, Share2, X } from "lucide-react";
import { useState } from "react";
import { createShareText, shareResult } from "../lib/share";
import { getAverageCompletionTimeMs, getGroupedGuessDistribution, getWinPercent, type DailyStats } from "../lib/stats";
import { formatElapsedTime } from "../lib/timer";
import { displayTurkishWord } from "../lib/turkishSort";
import type { GameState } from "../lib/types";

type Props = {
  state: GameState;
  gameStats: DailyStats | null;
  isOpen: boolean;
  onClose: () => void;
  onMenu: () => void;
  onRestart: () => void;
};

export default function ResultModal({ state, gameStats, isOpen, onClose, onMenu, onRestart }: Props) {
  const [feedback, setFeedback] = useState("");
  const [manualShareText, setManualShareText] = useState("");

  if (!isOpen) return null;

  const won = state.status === "won";
  const guessDistribution = gameStats ? getGroupedGuessDistribution(gameStats, state.maxGuesses) : [];
  const totalWonGames = gameStats?.guessHistory.length ?? 0;
  const modeLabel = state.mode === "daily" ? "Günlük istatistik" : "Serbest oyun istatistiği";

  async function onShare() {
    const result = await shareResult(state);
    if (result === "shared") {
      setFeedback("Paylaşıldı");
      setManualShareText("");
    } else if (result === "copied") {
      setFeedback("Panoya kopyalandı");
      setManualShareText("");
    } else if (result === "cancelled") {
      setFeedback("Paylaşım iptal edildi");
    } else {
      setFeedback("Otomatik paylaşım olmadı. Metni elle kopyalayabilirsin.");
      setManualShareText(createShareText(state));
    }
  }

  function onMenuClick() {
    onClose();
    onMenu();
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/25 p-3">
      <section className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-md flex-col overflow-y-auto rounded-md bg-white p-3 text-center shadow-2xl sm:p-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Sonuç penceresini kapat"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-ink text-white hover:bg-stone-700"
        >
          <X size={21} strokeWidth={4} aria-hidden />
        </button>
        <div className="px-11">
          <h2 className="text-4xl font-black leading-none sm:text-5xl">{displayTurkishWord(state.answer)}</h2>
          <div className={`mt-3 text-lg font-black uppercase sm:text-xl ${won ? "text-win" : "text-active"}`}>
            {won ? `${state.guesses.length} tahminde bildin` : "Kaybettin"}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 rounded-md bg-stone-100 px-4 py-2 sm:py-3">
          <div>
            <div className="text-xs font-black uppercase text-stone-600">Tahmin</div>
            <div className="text-3xl font-black leading-none text-ink">
              {state.status === "lost" ? "X" : state.guesses.length}
              <span className="text-lg text-stone-500">/{state.maxGuesses}</span>
            </div>
          </div>
          <div>
            <div className="text-xs font-black uppercase text-stone-600">Süre</div>
            <div className="text-3xl font-black leading-none text-ink">{formatElapsedTime(state.elapsedMs)}</div>
          </div>
        </div>
        {!won ? <p className="mt-3 text-base font-bold text-stone-700">Doğru kelime: {displayTurkishWord(state.answer)}</p> : null}

        {gameStats ? (
          <>
            <div className="mt-4 text-sm font-black uppercase text-stone-500">{modeLabel}</div>
            <div className="mt-3 grid grid-cols-3 gap-x-3 gap-y-2 sm:grid-cols-6">
              {[
                ["Oynanan", gameStats.played],
                ["Kazanma", gameStats.wins],
                ["%", getWinPercent(gameStats)],
                ["Seri", gameStats.currentStreak],
                ["En iyi", gameStats.bestStreak],
                ["Ort. süre", formatElapsedTime(getAverageCompletionTimeMs(gameStats))]
              ].map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <div className="min-h-6 text-[11px] font-bold leading-tight text-stone-700 sm:min-h-9 sm:text-xs">{label}</div>
                  <div className="text-2xl font-medium leading-none text-ink sm:text-3xl">{value}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-lg font-medium text-ink sm:text-xl">Tahmin dağılımı</div>
            <div className="mt-2 grid gap-1.5 text-left">
              {guessDistribution.map((group) => {
                const percent = totalWonGames === 0 ? 0 : Math.round((group.count / totalWonGames) * 100);
                const isCurrentGuess = won && state.guesses.length >= group.min && state.guesses.length <= group.max;
                return (
                  <div key={group.label} className="grid grid-cols-[3.25rem_1fr_3.5rem] items-center gap-2">
                    <div className="text-sm font-bold leading-none">{group.label}</div>
                    <div className="h-6 bg-stone-100 sm:h-7">
                      <div
                        className={`flex h-full min-w-0 items-center justify-end px-2 text-sm font-black text-ink transition-all ${
                          isCurrentGuess ? "bg-lime-500" : "bg-stone-200"
                        }`}
                        style={{ width: `${Math.max(group.count > 0 ? 10 : 0, percent)}%` }}
                      >
                        {group.count > 0 ? group.count : ""}
                      </div>
                    </div>
                    <div className="text-right text-lg font-medium">{percent} %</div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p className="mt-4 text-lg font-bold text-stone-700">
            {won
              ? `${state.guesses.length} tahminde, ${formatElapsedTime(state.elapsedMs)} sürede buldun.`
              : `${formatElapsedTime(state.elapsedMs)} sürede oyun bitti.`}
          </p>
        )}

        <div className="sticky bottom-0 -mx-3 mt-3 bg-white px-3 pb-0 pt-2 sm:-mx-6 sm:px-6">
          <div className="min-h-5 pb-1 text-xs font-bold text-stone-600 sm:min-h-6 sm:pb-2 sm:text-sm" aria-live="polite">
            {feedback}
          </div>
          <div className={state.mode === "free" ? "grid grid-cols-3 gap-2" : "grid grid-cols-2 gap-3"}>
            <button
              type="button"
              onClick={onMenuClick}
              className="flex items-center justify-center gap-1.5 rounded-md bg-slate-500 px-2 py-3 text-sm font-bold text-white sm:gap-2 sm:px-3 sm:text-lg"
            >
              <ArrowLeft size={20} aria-hidden />
              Menü
            </button>
            {state.mode === "free" ? (
              <button
                type="button"
                onClick={onRestart}
                className="flex items-center justify-center gap-1.5 rounded-md bg-stone-300 px-2 py-3 text-sm font-black text-ink sm:gap-2 sm:px-3 sm:text-lg"
              >
                <RotateCcw size={19} aria-hidden />
                Yeni
              </button>
            ) : null}
            <button
              type="button"
              onClick={onShare}
              className="flex items-center justify-center gap-1.5 rounded-md bg-active px-2 py-3 text-sm font-bold text-white sm:gap-2 sm:px-3 sm:text-lg"
            >
              <Share2 size={19} aria-hidden />
              Paylaş
            </button>
          </div>
        </div>
        {manualShareText ? (
          <textarea
            readOnly
            value={manualShareText}
            aria-label="Paylaşım metni"
            className="mt-2 min-h-24 w-full resize-none rounded-md border-2 border-stone-300 bg-stone-50 p-3 text-left text-sm font-bold text-ink"
            onFocus={(event) => event.currentTarget.select()}
          />
        ) : null}
      </section>
    </div>
  );
}
