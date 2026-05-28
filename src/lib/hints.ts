import { gameConfig } from "../config/gameConfig";
import { compareTurkishWords, TURKISH_ALPHABET, normalizeTurkishWord } from "./turkishSort";

export function getRangeWords(params: {
  validWords: readonly string[];
  topBoundIndex: number;
  bottomBoundIndex: number;
  guessedWords: Set<string>;
}): string[] {
  return params.validWords.filter(
    (word, index) =>
      index > params.topBoundIndex && index < params.bottomBoundIndex && !params.guessedWords.has(word)
  );
}

export function getCandidateWordsForPrefix(params: {
  prefix: string;
  validWords: readonly string[];
  topBoundIndex: number;
  bottomBoundIndex: number;
  guessedWords: Set<string>;
}): string[] {
  const prefix = normalizeTurkishWord(params.prefix);
  return params.validWords.filter(
    (word, index) =>
      index > params.topBoundIndex &&
      index < params.bottomBoundIndex &&
      !params.guessedWords.has(word) &&
      word.startsWith(prefix)
  );
}

export function isLetterPossibleForPrefix(params: {
  prefix: string;
  letter: string;
  validWords: readonly string[];
  topBoundIndex: number;
  bottomBoundIndex: number;
  guessedWords: Set<string>;
}): boolean {
  const candidatePrefix = normalizeTurkishWord(params.prefix + params.letter);
  return params.validWords.some(
    (word, index) =>
      index > params.topBoundIndex &&
      index < params.bottomBoundIndex &&
      !params.guessedWords.has(word) &&
      word.startsWith(candidatePrefix)
  );
}

export function getPossibleNextLetters(params: {
  prefix: string;
  validWords: readonly string[];
  topBoundIndex: number;
  bottomBoundIndex: number;
  guessedWords: Set<string>;
}): Set<string> {
  const activeLetters = new Set<string>();
  const prefix = normalizeTurkishWord(params.prefix);

  for (const letter of TURKISH_ALPHABET) {
    if (
      isLetterPossibleForPrefix({
        ...params,
        prefix,
        letter
      })
    ) {
      activeLetters.add(letter);
    }
  }

  return activeLetters;
}

function completePrefix(prefix: string, fillLetter: string): string {
  return prefix.padEnd(gameConfig.wordLength, fillLetter).slice(0, gameConfig.wordLength);
}

export function isLetterInsideAlphabeticBounds(params: {
  prefix: string;
  letter: string;
  topBound: string;
  bottomBound: string;
}): boolean {
  const candidatePrefix = normalizeTurkishWord(params.prefix + params.letter);
  if (candidatePrefix.length > gameConfig.wordLength) return false;

  const lowest = TURKISH_ALPHABET[0];
  const highest = TURKISH_ALPHABET[TURKISH_ALPHABET.length - 1];
  const minCandidate = completePrefix(candidatePrefix, lowest);
  const maxCandidate = completePrefix(candidatePrefix, highest);
  const topBound = normalizeTurkishWord(params.topBound);
  const bottomBound = normalizeTurkishWord(params.bottomBound);

  return compareTurkishWords(maxCandidate, topBound) > 0 && compareTurkishWords(minCandidate, bottomBound) < 0;
}

export function getPossibleNextLettersForAlphabeticBounds(params: {
  prefix: string;
  topBound: string;
  bottomBound: string;
}): Set<string> {
  const activeLetters = new Set<string>();
  const prefix = normalizeTurkishWord(params.prefix);

  for (const letter of TURKISH_ALPHABET) {
    if (
      isLetterInsideAlphabeticBounds({
        ...params,
        prefix,
        letter
      })
    ) {
      activeLetters.add(letter);
    }
  }

  return activeLetters;
}

export function createPrefixIndex(words: readonly string[]): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const word of words) {
    for (let length = 0; length <= word.length; length += 1) {
      const prefix = word.slice(0, length);
      const bucket = index.get(prefix) ?? [];
      bucket.push(word);
      index.set(prefix, bucket);
    }
  }
  return index;
}
