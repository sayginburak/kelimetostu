import type { GameStatus, GuessResult } from "../lib/types";
import IntervalIndicator from "./IntervalIndicator";
import WordRow from "./WordRow";

export type BoundMoveAnimation = {
  word: string;
  result: Extract<GuessResult, "moved_to_top" | "moved_to_bottom">;
  step: number;
};

type Props = {
  topBound: string;
  bottomBound: string;
  currentInput: string;
  status: GameStatus;
  intervalPosition: number;
  showDistances: boolean;
  topDistancePercent: number;
  bottomDistancePercent: number;
  animation?: BoundMoveAnimation | null;
};

export default function WordBoard({
  topBound,
  bottomBound,
  currentInput,
  status,
  intervalPosition,
  showDistances,
  topDistancePercent,
  bottomDistancePercent,
  animation
}: Props) {
  const animatesTop = animation?.result === "moved_to_top";
  const animatesBottom = animation?.result === "moved_to_bottom";
  const moveDirection = animatesTop ? "up" : animatesBottom ? "down" : undefined;
  const settledStep = animation?.step;

  return (
    <div className="word-board mx-auto grid w-full max-w-3xl grid-cols-[72px_1fr] gap-1.5 sm:grid-cols-[96px_1fr] sm:gap-5">
      <IntervalIndicator
        intervalPosition={intervalPosition}
        showDistances={showDistances}
        topDistancePercent={topDistancePercent}
        bottomDistancePercent={bottomDistancePercent}
        status={status}
      />
      <div className="word-rows grid gap-3 sm:gap-4">
        <WordRow word={topBound} variant="bound" revealWord={animatesTop ? animation.word : undefined} revealStep={settledStep} />
        <WordRow
          word={currentInput}
          variant={status === "won" ? "win" : "input"}
          moveDirection={moveDirection}
          moveStep={animation?.step}
        />
        <WordRow
          word={bottomBound}
          variant="bound"
          revealWord={animatesBottom ? animation.word : undefined}
          revealStep={settledStep}
        />
      </div>
    </div>
  );
}
