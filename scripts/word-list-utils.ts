import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, relative, resolve } from "node:path";
import { compareTurkishWords, hasOnlyTurkishGameLetters, normalizeTurkishWord, sortTurkishWords } from "../src/lib/turkishSort";

export const rootDir = resolve(import.meta.dirname, "..");
export const rawDir = resolve(rootDir, "raw");
export const sourcesDir = resolve(rawDir, "sources");
export const docsDir = resolve(rootDir, "docs");
export const dataDir = resolve(rootDir, "src/data");
export const manifestPath = resolve(sourcesDir, "sources-manifest.json");

export const targetSizes = {
  validMin: 2000,
  validTargetMin: 4000,
  validTargetMax: 8000,
  answerMin: 300,
  answerTargetMin: 800,
  answerTargetMax: 1500
} as const;

export type SourceManifestEntry = {
  name: string;
  url: string;
  localPath: string;
  fetchedAt: string;
  lineCount: number;
  license: string;
  notes: string;
};

export type SourceManifest = {
  generatedAt: string;
  sources: SourceManifestEntry[];
  warnings: string[];
};

export type WordDecision = {
  accepted: boolean;
  word?: string;
  reason?: string;
};

export type WordBuildStats = {
  rawLineCount: number;
  acceptedLineCount: number;
  rejectedLineCount: number;
  duplicateCount: number;
  validWordsCount: number;
  answerWordsCount: number;
  sourceCountByWord: Map<string, number>;
};

export const allowedWordPattern = /^[abcçdefgğhıijklmnoöprsştuüvyz]+$/u;
const blockedRawPattern = /[\s\-'.’/\\_,;:!?()[\]{}0-9]/u;

export const bannedWords = new Set([
  "amcık",
  "aptal",
  "eroin",
  "esrar",
  "fuhuş",
  "porno",
  "salak",
  "sapık",
  "sidik",
  "sikik",
  "sikme",
  "taşak",
  "sıçma",
  "zeker",
  "zenci"
]);

export function ensureDir(path: string): void {
  mkdirSync(path, { recursive: true });
}

export function readLinesIfExists(path: string): string[] {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

export function normalizeSourceWord(word: string): string {
  return normalizeTurkishWord(word)
    .replaceAll("â", "a")
    .replaceAll("î", "i")
    .replaceAll("û", "u");
}

export function isLikelySpecialName(rawWord: string): boolean {
  const trimmed = rawWord.trim();
  if (!trimmed) return false;
  const first = trimmed[0];
  return first === first.toLocaleUpperCase("tr-TR") && first !== first.toLocaleLowerCase("tr-TR");
}

export function cleanCandidate(rawWord: string): WordDecision {
  const trimmed = rawWord.trim();
  if (!trimmed) return { accepted: false, reason: "empty" };
  if (isLikelySpecialName(trimmed)) return { accepted: false, reason: "likely-special-name" };
  if (blockedRawPattern.test(trimmed)) return { accepted: false, reason: "blocked-character" };

  const word = normalizeSourceWord(trimmed);
  if (word.length !== 5) return { accepted: false, reason: "not-five-letters" };
  if (/[qwx]/u.test(word)) return { accepted: false, reason: "qwx" };
  if (!allowedWordPattern.test(word)) return { accepted: false, reason: "non-turkish-letter" };
  if (!hasOnlyTurkishGameLetters(word)) return { accepted: false, reason: "non-game-letter" };
  if (bannedWords.has(word)) return { accepted: false, reason: "banned-word" };

  return { accepted: true, word };
}

export function isConservativeAnswerCandidate(word: string): boolean {
  if (bannedWords.has(word)) return false;
  if (word.endsWith("mak") || word.endsWith("mek")) return false;
  if (/^[bcçdfgğhjklmnprsştvyz]{3}/u.test(word)) return false;
  if (/[âîûqwx]/u.test(word)) return false;
  return true;
}

export function isReviewNeeded(word: string, sourceCount: number): boolean {
  return sourceCount < 2 || word.endsWith("mak") || word.endsWith("mek") || /^[bcçdfgğhjklmnprsştvyz]{3}/u.test(word);
}

export function readManifest(): SourceManifest {
  if (!existsSync(manifestPath)) {
    return { generatedAt: new Date().toISOString(), sources: [], warnings: ["Manifest not found. Run pnpm fetch:words."] };
  }
  return JSON.parse(readFileSync(manifestPath, "utf8")) as SourceManifest;
}

export function listSourceTextFiles(): string[] {
  ensureDir(sourcesDir);
  return readdirSync(sourcesDir)
    .filter((file) => file.endsWith(".txt"))
    .map((file) => resolve(sourcesDir, file));
}

export function formatWordModule(exportName: string, typeName: string, words: string[]): string {
  return `export const ${exportName} = ${JSON.stringify(words, null, 2)} as const;\n\nexport type ${typeName} = typeof ${exportName}[number];\n`;
}

export function writeTextFile(path: string, text: string): void {
  ensureDir(dirname(path));
  writeFileSync(path, text);
}

export function getStartDistribution(words: readonly string[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  for (const word of words) {
    const first = word[0] ?? "";
    distribution[first] = (distribution[first] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(distribution).sort(([a], [b]) => compareTurkishWords(a, b)));
}

export function assertWordListHealth(validWords: readonly string[], answerWords: readonly string[]): string[] {
  const errors: string[] = [];
  const validSet = new Set(validWords);
  const answerSet = new Set(answerWords);

  if (validWords.length === 0) errors.push("validWords is empty.");
  if (answerWords.length === 0) errors.push("answerWords is empty.");
  if (validSet.size !== validWords.length) errors.push("validWords contains duplicates.");
  if (answerSet.size !== answerWords.length) errors.push("answerWords contains duplicates.");

  for (const [name, words] of [
    ["validWords", validWords],
    ["answerWords", answerWords]
  ] as const) {
    for (const word of words) {
      if (word.length !== 5) errors.push(`${name} contains non-5-letter word: ${word}`);
      if (!allowedWordPattern.test(word)) errors.push(`${name} contains invalid characters: ${word}`);
      if (/[qwx]/u.test(word)) errors.push(`${name} contains q/w/x: ${word}`);
      if (blockedRawPattern.test(word)) errors.push(`${name} contains punctuation/space/digit: ${word}`);
    }

    for (let index = 1; index < words.length; index += 1) {
      if (compareTurkishWords(words[index - 1], words[index]) > 0) {
        errors.push(`${name} is not Turkish-sorted near ${words[index - 1]} / ${words[index]}`);
        break;
      }
    }
  }

  for (const answer of answerWords) {
    if (!validSet.has(answer)) errors.push(`answerWords contains word missing from validWords: ${answer}`);
  }

  return errors;
}

export function toProjectPath(path: string): string {
  return relative(rootDir, path);
}

export function makeSourceName(path: string): string {
  return basename(path).replace(/\.txt$/u, "");
}

export function sortUnique(words: Iterable<string>): string[] {
  return sortTurkishWords([...new Set(words)]);
}
