export type RandomSource = () => number;

export function groupWordsByFirstLetter(words: readonly string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const word of words) {
    const firstLetter = word[0] ?? "";
    const group = groups.get(firstLetter) ?? [];
    group.push(word);
    groups.set(firstLetter, group);
  }
  return groups;
}

function pickRandom<T>(items: readonly T[], random: RandomSource): T {
  return items[Math.floor(random() * items.length)];
}

export function pickFreeAnswer(params: {
  answers: readonly string[];
  recentAnswers?: readonly string[];
  random?: RandomSource;
}): string {
  const random = params.random ?? Math.random;
  const recentAnswers = params.recentAnswers ?? [];
  const recentSet = new Set(recentAnswers);
  const recentFirstLetters = new Set(recentAnswers.slice(-3).map((word) => word[0]));

  const freshAnswers = params.answers.filter((word) => !recentSet.has(word));
  const candidateAnswers = freshAnswers.length > 0 ? freshAnswers : [...params.answers];
  const groups = groupWordsByFirstLetter(candidateAnswers);
  const preferredGroups = [...groups.entries()].filter(([letter]) => !recentFirstLetters.has(letter));
  const groupEntries = preferredGroups.length > 0 ? preferredGroups : [...groups.entries()];

  const [, group] = pickRandom(groupEntries, random);
  return pickRandom(group, random);
}
