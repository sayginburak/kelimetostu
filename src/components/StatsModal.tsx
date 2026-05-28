import { BarChart3, X } from "lucide-react";
import { gameConfig } from "../config/gameConfig";
import { getAverageCompletionTimeMs, getGroupedGuessDistribution, getWinPercent, type DailyStats } from "../lib/stats";
import { formatElapsedTime } from "../lib/timer";
import type { GameMode } from "../lib/types";

type Props = {
  stats: DailyStats;
  mode: GameMode;
  isOpen: boolean;
  onClose: () => void;
};

export default function StatsModal({ mode, stats, isOpen, onClose }: Props) {
  if (!isOpen) return null;

  const guessDistribution = getGroupedGuessDistribution(stats, gameConfig.maxGuesses);
  const totalWonGames = stats.guessHistory.length;
  const modeLabel = mode === "daily" ? "Günlük oyun" : "Serbest oyun";

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/25 p-4">
      <section className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-md bg-white p-5 text-center shadow-2xl sm:p-7">
        <button
          type="button"
          onClick={onClose}
          aria-label="İstatistik penceresini kapat"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-ink text-white hover:bg-stone-700"
        >
          <X size={21} strokeWidth={4} aria-hidden />
        </button>

        <div className="mx-auto grid h-11 w-11 place-items-center rounded-lg bg-stone-100 text-ink">
          <BarChart3 size={28} strokeWidth={3} aria-hidden />
        </div>
        <h2 className="mt-3 pr-9 text-4xl font-black leading-none sm:text-5xl">İstatistik</h2>
        <div className="mt-2 text-sm font-black uppercase text-stone-500">{modeLabel}</div>

        <div className="mt-7 grid grid-cols-5 gap-2">
          {[
            ["Oynanan", stats.played],
            ["Kazanma", stats.wins],
            ["%", getWinPercent(stats)],
            ["Seri", stats.currentStreak],
            ["En iyi", stats.bestStreak]
          ].map(([label, value]) => (
            <div key={label} className="min-w-0">
              <div className="min-h-9 text-[11px] font-bold leading-tight text-stone-700 sm:text-xs">{label}</div>
              <div className="text-3xl font-medium leading-none text-ink sm:text-4xl">{value}</div>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-md bg-stone-100 px-4 py-3">
          <div className="text-xs font-black uppercase text-stone-600">Ortalama süre</div>
          <div className="text-4xl font-black leading-none text-ink">
            {formatElapsedTime(getAverageCompletionTimeMs(stats))}
          </div>
        </div>

        <div className="mt-7 text-xl font-medium text-ink">Tahmin dağılımı</div>
        <div className="mt-4 grid gap-2.5 text-left">
          {guessDistribution.map((group) => {
            const percent = totalWonGames === 0 ? 0 : Math.round((group.count / totalWonGames) * 100);
            return (
              <div key={group.label} className="grid grid-cols-[3.25rem_1fr_3.5rem] items-center gap-2">
                <div className="text-sm font-bold leading-none">{group.label}</div>
                <div className="h-8 bg-stone-100">
                  <div
                    className="flex h-full min-w-0 items-center justify-end bg-stone-200 px-2 text-sm font-black text-ink"
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
      </section>
    </div>
  );
}
