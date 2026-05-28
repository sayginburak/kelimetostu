import { gameConfig } from "../config/gameConfig";
import { displayTurkishWord } from "../lib/turkishSort";

type Props = {
  word: string;
  variant: "bound" | "input" | "win";
  revealWord?: string;
  revealStep?: number;
  moveDirection?: "up" | "down";
  moveStep?: number;
  isDimmed?: boolean;
};

export default function WordRow({
  word,
  variant,
  revealWord,
  revealStep = -1,
  moveDirection,
  moveStep = -1,
  isDimmed = false
}: Props) {
  const baseLetters = displayTurkishWord(word).padEnd(gameConfig.wordLength, " ").slice(0, gameConfig.wordLength).split("");
  const revealLetters = revealWord
    ? displayTurkishWord(revealWord).padEnd(gameConfig.wordLength, " ").slice(0, gameConfig.wordLength).split("")
    : [];
  const styles = {
    bound: "border-bound bg-bound text-boundSoft",
    input: "border-stone-500 bg-transparent text-active",
    win: "border-win bg-win text-white"
  }[variant];
  const movingTileClass = moveDirection === "up" ? "animate-guess-to-top" : moveDirection === "down" ? "animate-guess-to-bottom" : "";

  return (
    <div className={`tile-grid grid gap-1.5 transition-opacity duration-200 sm:gap-2 ${isDimmed ? "opacity-45" : ""}`}>
      {baseLetters.map((letter, index) => {
        const isRevealed = revealWord !== undefined && index <= revealStep;
        const isMoving = moveDirection !== undefined && index <= moveStep;
        const tileLetter = isRevealed ? revealLetters[index] : letter;
        const tileStyles = isRevealed ? "border-active bg-active text-white animate-settle-letter" : styles;

        return (
          <div
            key={`${index}-${tileLetter}-${isRevealed ? "revealed" : "base"}-${isMoving ? "moving" : "still"}`}
            className={`word-tile grid aspect-square place-items-center border-2 text-3xl font-black leading-none sm:text-6xl ${
              isMoving ? `z-10 border-active bg-active text-white ${movingTileClass}` : tileStyles
            }`}
          >
            {isMoving ? "" : tileLetter.trim()}
            {isMoving && (
              <span className="grid h-full w-full place-items-center">{tileLetter.trim()}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
