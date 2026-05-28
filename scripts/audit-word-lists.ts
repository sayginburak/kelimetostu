import { answerWords } from "../src/data/answerWords";
import { validWords } from "../src/data/validWords";
import { assertWordListHealth, getStartDistribution, targetSizes } from "./word-list-utils";

function percent(part: number, whole: number): string {
  if (whole === 0) return "0.00%";
  return `${((part / whole) * 100).toFixed(2)}%`;
}

function main() {
  const errors = assertWordListHealth(validWords, answerWords);

  if (errors.length > 0) {
    console.error("Word list audit failed:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  if (validWords.length < targetSizes.validMin) {
    console.warn(`Warning: validWords below MVP minimum (${validWords.length} < ${targetSizes.validMin}).`);
  }
  if (answerWords.length < targetSizes.answerMin) {
    console.warn(`Warning: answerWords below MVP minimum (${answerWords.length} < ${targetSizes.answerMin}).`);
  }

  console.log("Word list audit passed.");
  console.log(`validWords count: ${validWords.length}`);
  console.log(`answerWords count: ${answerWords.length}`);
  console.log(`answer/valid ratio: ${percent(answerWords.length, validWords.length)}`);
  console.log(`first 20: ${validWords.slice(0, 20).join(", ")}`);
  console.log(`last 20: ${validWords.slice(-20).join(", ")}`);
  console.log("start distribution:");
  console.log(JSON.stringify(getStartDistribution(validWords), null, 2));
}

main();
