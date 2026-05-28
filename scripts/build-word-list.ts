import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  cleanCandidate,
  dataDir,
  docsDir,
  ensureDir,
  formatWordModule,
  isConservativeAnswerCandidate,
  isReviewNeeded,
  listSourceTextFiles,
  makeSourceName,
  rawDir,
  readLinesIfExists,
  readManifest,
  sortUnique,
  targetSizes,
  toProjectPath,
  type WordBuildStats,
  writeTextFile
} from "./word-list-utils";

function loadSourceLines() {
  const files = listSourceTextFiles();
  const sourceCountByWord = new Map<string, number>();
  const acceptedWords: string[] = [];
  const rejected: string[] = [];
  let rawLineCount = 0;
  let acceptedLineCount = 0;
  const seenInSource = new Map<string, Set<string>>();

  for (const file of files) {
    const sourceName = makeSourceName(file);
    const lines = readFileSync(file, "utf8").split(/\r?\n/u);
    for (const line of lines) {
      if (!line.trim()) continue;
      rawLineCount += 1;
      const decision = cleanCandidate(line);
      if (!decision.accepted || !decision.word) {
        rejected.push(`${line}\t${decision.reason ?? "unknown"}\t${sourceName}`);
        continue;
      }
      acceptedLineCount += 1;
      acceptedWords.push(decision.word);
      const sourceSet = seenInSource.get(decision.word) ?? new Set<string>();
      sourceSet.add(sourceName);
      seenInSource.set(decision.word, sourceSet);
      sourceCountByWord.set(decision.word, sourceSet.size);
    }
  }

  return {
    files,
    acceptedWords,
    rejected,
    rawLineCount,
    acceptedLineCount,
    sourceCountByWord
  };
}

function applyManualValidWords(words: string[]): string[] {
  const include = readLinesIfExists(resolve(rawDir, "manual-valid-include.txt"))
    .map(cleanCandidate)
    .flatMap((decision) => (decision.accepted && decision.word ? [decision.word] : []));
  const exclude = new Set(
    readLinesIfExists(resolve(rawDir, "manual-valid-exclude.txt"))
      .map(cleanCandidate)
      .flatMap((decision) => (decision.accepted && decision.word ? [decision.word] : []))
  );

  return sortUnique([...words, ...include].filter((word) => !exclude.has(word)));
}

function chooseAnswerWords(validWords: string[], sourceCountByWord: Map<string, number>): { answerWords: string[]; reviewNeeded: string[] } {
  const validSet = new Set(validWords);
  const manualIncludeRaw = readLinesIfExists(resolve(rawDir, "manual-answer-include.txt"));
  const manualExclude = new Set(
    readLinesIfExists(resolve(rawDir, "manual-answer-exclude.txt"))
      .map(cleanCandidate)
      .flatMap((decision) => (decision.accepted && decision.word ? [decision.word] : []))
  );

  const manualInclude: string[] = [];
  for (const line of manualIncludeRaw) {
    const decision = cleanCandidate(line);
    if (!decision.accepted || !decision.word) {
      console.warn(`Warning: manual answer include rejected "${line}" (${decision.reason ?? "unknown"}).`);
      continue;
    }
    if (!validSet.has(decision.word)) {
      console.warn(`Warning: manual answer include "${decision.word}" is not in validWords; skipped.`);
      continue;
    }
    manualInclude.push(decision.word);
  }

  if (manualInclude.length >= targetSizes.answerMin) {
    return {
      answerWords: sortUnique(manualInclude.filter((word) => validSet.has(word) && !manualExclude.has(word))),
      reviewNeeded: []
    };
  }

  const conservative = validWords.filter((word) => isConservativeAnswerCandidate(word) && !manualExclude.has(word));
  const trusted = conservative.filter((word) => (sourceCountByWord.get(word) ?? 0) >= 2);
  const base = trusted.length >= targetSizes.answerMin ? trusted : conservative;
  const ranked = [...base].sort((a, b) => {
    const sourceDelta = (sourceCountByWord.get(b) ?? 0) - (sourceCountByWord.get(a) ?? 0);
    if (sourceDelta !== 0) return sourceDelta;
    return a.length - b.length;
  });

  const capped = ranked.slice(0, targetSizes.answerTargetMax);
  const answerWords = sortUnique([...manualInclude, ...capped].filter((word) => validSet.has(word) && !manualExclude.has(word)));
  const reviewNeeded = answerWords.filter((word) => isReviewNeeded(word, sourceCountByWord.get(word) ?? 0));

  return { answerWords, reviewNeeded };
}

function wordListMetaText(stats: WordBuildStats, manifest = readManifest()): string {
  const warnings = [...manifest.warnings];
  if (stats.validWordsCount < targetSizes.validMin) {
    warnings.push(`validWords below MVP minimum: ${stats.validWordsCount} < ${targetSizes.validMin}`);
  }
  if (stats.answerWordsCount < targetSizes.answerMin) {
    warnings.push(`answerWords below MVP minimum: ${stats.answerWordsCount} < ${targetSizes.answerMin}`);
  }
  if (stats.validWordsCount > 10000) {
    warnings.push(`validWords exceeds 10,000; consider prefix index or trie optimization.`);
  }

  const sources = manifest.sources.map((source) => ({
    name: source.name,
    url: source.url,
    localPath: source.localPath,
    fetchedAt: source.fetchedAt,
    lineCount: source.lineCount,
    license: source.license,
    notes: source.notes
  }));

  return `export const wordListMeta = ${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      validWordsCount: stats.validWordsCount,
      answerWordsCount: stats.answerWordsCount,
      rawLineCount: stats.rawLineCount,
      acceptedLineCount: stats.acceptedLineCount,
      rejectedLineCount: stats.rejectedLineCount,
      duplicateCount: stats.duplicateCount,
      targetSizes,
      warnings,
      sources
    },
    null,
    2
  )} as const;\n`;
}

function warnForSize(count: number, minimum: number, label: string): void {
  if (count < minimum) {
    console.warn(`Warning: ${label} below MVP minimum (${count} < ${minimum}).`);
  }
}

function main() {
  ensureDir(dataDir);
  ensureDir(docsDir);

  const sourceData = loadSourceLines();
  const manualValid = applyManualValidWords(sourceData.acceptedWords);
  const duplicateCount = sourceData.acceptedWords.length - new Set(sourceData.acceptedWords).size;
  const { answerWords, reviewNeeded } = chooseAnswerWords(manualValid, sourceData.sourceCountByWord);

  const stats: WordBuildStats = {
    rawLineCount: sourceData.rawLineCount,
    acceptedLineCount: sourceData.acceptedLineCount,
    rejectedLineCount: sourceData.rejected.length,
    duplicateCount,
    validWordsCount: manualValid.length,
    answerWordsCount: answerWords.length,
    sourceCountByWord: sourceData.sourceCountByWord
  };

  writeTextFile(resolve(dataDir, "validWords.ts"), formatWordModule("validWords", "ValidWord", manualValid));
  writeTextFile(resolve(dataDir, "answerWords.ts"), formatWordModule("answerWords", "AnswerWord", answerWords));
  writeTextFile(resolve(dataDir, "wordListMeta.ts"), wordListMetaText(stats));
  writeTextFile(resolve(docsDir, "answer-review-needed.txt"), `${reviewNeeded.join("\n")}\n`);
  writeTextFile(resolve(rawDir, "rejected-words.txt"), `${sourceData.rejected.join("\n")}\n`);

  warnForSize(manualValid.length, targetSizes.validMin, "validWords");
  warnForSize(answerWords.length, targetSizes.answerMin, "answerWords");

  console.log(`Source files: ${sourceData.files.map(toProjectPath).join(", ") || "none"}`);
  console.log(`Raw lines read: ${stats.rawLineCount}`);
  console.log(`Accepted lines: ${stats.acceptedLineCount}`);
  console.log(`Rejected lines: ${stats.rejectedLineCount}`);
  console.log(`Duplicates skipped: ${stats.duplicateCount}`);
  console.log(`Wrote ${manualValid.length} validWords and ${answerWords.length} answerWords.`);
}

main();
