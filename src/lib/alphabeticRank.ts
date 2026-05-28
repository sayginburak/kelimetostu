import { gameConfig } from "../config/gameConfig";
import { TURKISH_ALPHABET, normalizeTurkishWord } from "./turkishSort";

const letterRanks = new Map<string, number>(TURKISH_ALPHABET.map((letter, index) => [letter, index]));
const alphabetSize = TURKISH_ALPHABET.length;
const maxRank = alphabetSize ** gameConfig.wordLength - 1;

export function getTurkishLetterRank(letter: string): number {
  const normalized = normalizeTurkishWord(letter);
  const rank = letterRanks.get(normalized);
  if (rank === undefined) {
    throw new Error(`Unsupported Turkish game letter: "${letter}"`);
  }
  return rank;
}

export function getAlphabeticWordRank(word: string): number {
  const normalized = normalizeTurkishWord(word);
  if (normalized.length !== gameConfig.wordLength) {
    throw new Error(`Word must be ${gameConfig.wordLength} letters: "${word}"`);
  }

  return normalized.split("").reduce((rank, letter) => rank * alphabetSize + getTurkishLetterRank(letter), 0);
}

export function getAlphabeticRankSpace(): number {
  return maxRank;
}

export function getAlphabeticIntervalPosition({
  topWord,
  answer,
  bottomWord
}: {
  topWord: string;
  answer: string;
  bottomWord: string;
}): number {
  try {
    const topRank = getAlphabeticWordRank(topWord);
    const answerRank = getAlphabeticWordRank(answer);
    const bottomRank = getAlphabeticWordRank(bottomWord);
    const width = bottomRank - topRank;
    if (width <= 0) return 0.5;

    const position = (answerRank - topRank) / width;
    if (!Number.isFinite(position)) return 0.5;
    return Math.min(1, Math.max(0, position));
  } catch {
    return 0.5;
  }
}

export function getAlphabeticDistancePercent({
  fromWord,
  toWord
}: {
  fromWord: string;
  toWord: string;
}): number {
  try {
    const totalSpace = getAlphabeticRankSpace();
    if (totalSpace <= 0) return 0;
    const distance = Math.abs(getAlphabeticWordRank(toWord) - getAlphabeticWordRank(fromWord));
    return (distance / totalSpace) * 100;
  } catch {
    return 0;
  }
}
