import { TURKISH_ALPHABET, displayTurkishWord } from "../lib/turkishSort";

type Props = {
  possibleLetters: Set<string>;
  disabled: boolean;
};

export default function PossibleLettersStrip({ possibleLetters, disabled }: Props) {
  return (
    <div className="possible-letters mx-auto flex max-w-3xl flex-wrap justify-center gap-1 sm:gap-1.5" aria-label="Mümkün harfler">
      {TURKISH_ALPHABET.map((letter) => {
        const isPossible = !disabled && possibleLetters.has(letter);
        return (
          <span
            key={letter}
            className={`grid h-7 w-7 place-items-center rounded-full text-xs font-black transition sm:h-10 sm:w-10 sm:text-lg ${
              isPossible ? "bg-[#e6d7cc] text-clay" : "bg-stone-200 text-stone-400 opacity-40"
            }`}
          >
            {displayTurkishWord(letter)}
          </span>
        );
      })}
    </div>
  );
}
