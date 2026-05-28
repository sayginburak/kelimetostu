import { gameConfig } from "../config/gameConfig";
import { dailyAnswerOverrides } from "../config/dailyOverrides";
import { answerWords } from "../data/answerWords";
import { validWords } from "../data/validWords";
import { normalizeTurkishWord } from "./turkishSort";

const oneDayMs = 24 * 60 * 60 * 1000;
const dailyAnswerSalt = "soz-arasi-daily-v2";

export function getIstanbulDateKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function dateKeyToUtcMs(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function getDayNumber(dateKey: string, startDate: string = gameConfig.dailyStartDate): number {
  return Math.floor((dateKeyToUtcMs(dateKey) - dateKeyToUtcMs(startDate)) / oneDayMs) + 1;
}

export function hashDailySeed(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getDailyCandidateIndexes(answers: readonly string[], words: readonly string[]): number[] {
  const lowerEdge = words.length >= 5 ? Math.max(1, Math.floor(words.length * 0.15)) : 0;
  const upperEdge = words.length >= 5 ? Math.min(words.length - 2, Math.ceil(words.length * 0.85)) : words.length - 1;
  const middleIndexes = answers
    .map((answer, answerIndex) => ({ answerIndex, wordIndex: words.indexOf(normalizeTurkishWord(answer)) }))
    .filter(({ wordIndex }) => wordIndex >= lowerEdge && wordIndex <= upperEdge)
    .map(({ answerIndex }) => answerIndex);

  return middleIndexes.length > 0 ? middleIndexes : answers.map((_, index) => index);
}

export function getDailyAnswerIndex(dateKey: string, answers: readonly string[], words: readonly string[] = answers): number {
  if (answers.length <= 0) {
    throw new Error("answers must not be empty.");
  }
  const candidateIndexes = getDailyCandidateIndexes(answers, words);
  const candidateOffset = hashDailySeed(`${dailyAnswerSalt}:${dateKey}`) % candidateIndexes.length;
  return candidateIndexes[candidateOffset];
}

export function getDailyAnswer(params?: {
  date?: Date;
  dateKey?: string;
  answers?: readonly string[];
  words?: readonly string[];
  startDate?: string;
  overrides?: Record<string, string>;
}) {
  const answers = params?.answers ?? answerWords;
  const words = params?.words ?? validWords;
  const dateKey = params?.dateKey ?? getIstanbulDateKey(params?.date);
  const dailyNumber = getDayNumber(dateKey, params?.startDate);
  const overrides = params?.overrides ?? dailyAnswerOverrides;
  const overrideAnswer = overrides[dateKey];
  const index = overrideAnswer === undefined ? getDailyAnswerIndex(dateKey, answers, words) : -1;
  const answer = normalizeTurkishWord(overrideAnswer ?? answers[index]);
  const answerIndex = words.indexOf(answer);

  if (answerIndex < 0) {
    throw new Error(`Daily answer "${answer}" must exist in validWords.`);
  }

  return {
    dateKey,
    dailyNumber,
    answer,
    answerIndex
  };
}
