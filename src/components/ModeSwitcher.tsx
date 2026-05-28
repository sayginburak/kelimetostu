import type { GameMode } from "../lib/types";

type Props = {
  mode: GameMode;
  onChange: (mode: GameMode) => void;
};

export default function ModeSwitcher({ mode, onChange }: Props) {
  return (
    <div className="inline-flex rounded-lg bg-stone-200 p-1">
      {(["daily", "free"] as const).map((item) => (
        <button
          type="button"
          key={item}
          onClick={() => onChange(item)}
          className={`rounded-md px-3 py-2 text-sm font-black ${mode === item ? "bg-white text-bound" : "text-stone-600"}`}
        >
          {item === "daily" ? "Günlük" : "Serbest"}
        </button>
      ))}
    </div>
  );
}
