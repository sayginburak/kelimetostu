import { CornerDownLeft, Delete } from "lucide-react";
import { displayTurkishWord } from "../lib/turkishSort";

const rows = [
  ["e", "r", "t", "y", "u", "ı", "i", "o", "ö", "p", "ğ", "ü"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", "ş"],
  ["z", "c", "ç", "v", "b", "n", "m"]
];

type Props = {
  onLetter: (letter: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
  disabled: boolean;
};

export default function TurkishKeyboard({ onLetter, onBackspace, onEnter, disabled }: Props) {
  return (
    <div className="turkish-keyboard mx-auto grid w-full max-w-4xl gap-1.5 sm:gap-2" aria-label="Türkçe klavye">
      {rows.map((row, rowIndex) => (
        <div key={row.join("")} className="flex justify-center gap-1 sm:gap-2">
          {rowIndex === 2 && (
            <button
              type="button"
              onClick={onEnter}
              disabled={disabled}
              aria-label="Tahmini gönder"
              className="grid h-10 min-w-12 place-items-center rounded-lg bg-stone-300 px-2 font-black text-ink transition hover:bg-stone-400 disabled:opacity-50 sm:h-16 sm:min-w-24"
            >
              <CornerDownLeft size={24} aria-hidden />
            </button>
          )}
          {row.map((letter) => (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onLetter(letter)}
              key={letter}
              className="grid h-10 min-w-0 flex-1 place-items-center rounded-lg bg-stone-300 text-lg font-black text-ink transition hover:bg-stone-400 disabled:opacity-50 sm:h-16 sm:text-4xl"
            >
              {displayTurkishWord(letter)}
            </button>
          ))}
          {rowIndex === 2 && (
            <button
              type="button"
              onClick={onBackspace}
              disabled={disabled}
              aria-label="Sil"
              className="grid h-10 min-w-12 place-items-center rounded-lg bg-stone-300 px-2 text-ink transition hover:bg-stone-400 disabled:opacity-50 sm:h-16 sm:min-w-24"
            >
              <Delete size={28} aria-hidden />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
