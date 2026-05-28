import type { GameState } from "../lib/types";

type Props = {
  state: GameState;
};

export default function GuessProgressDots({ state }: Props) {
  return (
    <div className="flex flex-wrap justify-center gap-2" aria-label="Tahmin ilerlemesi">
      {Array.from({ length: state.maxGuesses }, (_, index) => {
        const guess = state.guesses[index];
        const isLast = index === state.guesses.length - 1;
        let className = "bg-stone-300";
        if (guess?.result === "correct") className = "bg-win";
        else if (guess && isLast) className = "bg-active";
        else if (guess) className = "bg-bound";

        return <span key={index} className={`h-3.5 w-3.5 rounded-full ${className}`} />;
      })}
    </div>
  );
}
