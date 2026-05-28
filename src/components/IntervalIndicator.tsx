import { formatDistancePercent } from "../lib/game";

type Props = {
  intervalPosition: number;
  showDistances: boolean;
  topDistancePercent: number;
  bottomDistancePercent: number;
  status: "playing" | "won" | "lost";
};

export default function IntervalIndicator({
  intervalPosition,
  showDistances,
  topDistancePercent,
  bottomDistancePercent,
  status
}: Props) {
  const markerColor = status === "won" ? "bg-win" : "bg-active";
  const markerTop = `${Math.min(96, Math.max(4, intervalPosition * 100))}%`;

  return (
    <div className="relative flex w-full shrink-0 justify-center overflow-visible" aria-hidden>
      <div className="absolute bottom-12 left-1/2 top-12 w-1 -translate-x-1/2 rounded-full bg-bound sm:bottom-14 sm:top-14">
        {showDistances ? (
          <div
            className={`absolute left-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full ${markerColor}`}
            style={{ top: markerTop }}
          />
        ) : null}
      </div>
      <div className="absolute top-0 grid min-h-11 min-w-[4rem] place-items-center rounded-md bg-bound px-1.5 text-xl font-black text-white after:absolute after:-bottom-3 after:left-1/2 after:h-0 after:w-0 after:-translate-x-1/2 after:border-x-[12px] after:border-t-[12px] after:border-x-transparent after:border-t-bound sm:min-h-12 sm:min-w-14 sm:px-2 sm:text-2xl">
        {showDistances ? formatDistancePercent(topDistancePercent) : "?"}
      </div>
      <div className="absolute bottom-0 grid min-h-11 min-w-[4rem] place-items-center rounded-md bg-bound px-1.5 text-xl font-black text-white before:absolute before:-top-3 before:left-1/2 before:h-0 before:w-0 before:-translate-x-1/2 before:border-x-[12px] before:border-b-[12px] before:border-x-transparent before:border-b-bound sm:min-h-12 sm:min-w-14 sm:px-2 sm:text-2xl">
        {showDistances ? formatDistancePercent(bottomDistancePercent) : "?"}
      </div>
    </div>
  );
}
