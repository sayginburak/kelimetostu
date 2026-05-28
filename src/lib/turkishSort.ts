import { gameConfig } from "../config/gameConfig";

export const TURKISH_ALPHABET = [
  "a",
  "b",
  "c",
  "ç",
  "d",
  "e",
  "f",
  "g",
  "ğ",
  "h",
  "ı",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "ö",
  "p",
  "r",
  "s",
  "ş",
  "t",
  "u",
  "ü",
  "v",
  "y",
  "z"
] as const;

const order = new Map<string, number>(TURKISH_ALPHABET.map((letter, index) => [letter, index]));

const collator = new Intl.Collator("tr", {
  usage: "sort",
  sensitivity: "variant",
  ignorePunctuation: true
});

export function normalizeTurkishWord(word: string): string {
  return word.trim().toLocaleLowerCase(gameConfig.locale);
}

export function displayTurkishWord(word: string): string {
  return normalizeTurkishWord(word).toLocaleUpperCase(gameConfig.locale);
}

function compareTurkishWordsFallback(a: string, b: string): number {
  const left = normalizeTurkishWord(a);
  const right = normalizeTurkishWord(b);
  const length = Math.max(left.length, right.length);

  for (let i = 0; i < length; i += 1) {
    const leftLetter = left[i];
    const rightLetter = right[i];
    if (leftLetter === undefined) return -1;
    if (rightLetter === undefined) return 1;
    const leftOrder = order.get(leftLetter) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = order.get(rightLetter) ?? Number.MAX_SAFE_INTEGER;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
  }

  return 0;
}

export function compareTurkishWords(a: string, b: string): number {
  const intlResult = collator.compare(normalizeTurkishWord(a), normalizeTurkishWord(b));
  const fallbackResult = compareTurkishWordsFallback(a, b);

  if (Math.sign(intlResult) === Math.sign(fallbackResult) || intlResult === fallbackResult) {
    return intlResult;
  }

  return fallbackResult;
}

export function sortTurkishWords(words: string[]): string[] {
  return [...words].map(normalizeTurkishWord).sort(compareTurkishWords);
}

export function hasOnlyTurkishGameLetters(word: string): boolean {
  const normalized = normalizeTurkishWord(word);
  return /^[abcçdefgğhıijklmnoöprsştuüvyz]+$/u.test(normalized);
}
