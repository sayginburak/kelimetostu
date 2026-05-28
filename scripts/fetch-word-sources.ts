import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  ensureDir,
  manifestPath,
  sourcesDir,
  type SourceManifest,
  type SourceManifestEntry,
  writeTextFile
} from "./word-list-utils";

const mainSources = [
  {
    name: "mertemin/turkish-word-list",
    url: "https://raw.githubusercontent.com/mertemin/turkish-word-list/master/words.txt",
    localPath: "raw/sources/mertemin-turkish-word-list.txt",
    license: "unknown",
    notes: "license unclear, verify before commercial use"
  },
  {
    name: "CanNuhlar/Turkce-Kelime-Listesi",
    url: "https://raw.githubusercontent.com/CanNuhlar/Turkce-Kelime-Listesi/master/turkce_kelime_listesi.txt",
    localPath: "raw/sources/cannuhlar-turkce-kelime-listesi.txt",
    license: "unknown",
    notes: "license unclear, verify before commercial use"
  }
] as const;

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "soz-arasi-word-list-pipeline"
    }
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.text();
}

function lineCount(text: string): number {
  return text.split(/\r?\n/u).filter((line) => line.trim().length > 0).length;
}

async function downloadSource(source: (typeof mainSources)[number], fetchedAt: string): Promise<SourceManifestEntry> {
  const text = await fetchText(source.url);
  const absolutePath = resolve(source.localPath);
  writeTextFile(absolutePath, text);
  return {
    name: source.name,
    url: source.url,
    localPath: source.localPath,
    fetchedAt,
    lineCount: lineCount(text),
    license: source.license,
    notes: source.notes
  };
}

function hasGhCli(): boolean {
  try {
    execFileSync("gh", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function runGhJson(args: string[]): unknown[] {
  const output = execFileSync("gh", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return JSON.parse(output) as unknown[];
}

function githubFileUrlToRaw(url: string): string | null {
  const match = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/u);
  if (!match) return null;
  const [, owner, repo, ref, path] = match;
  return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}`;
}

function looksLikeWordList(pathOrUrl: string): boolean {
  return /\.(txt|json|js|ts)$/u.test(pathOrUrl) && /word|kelime|words|wordle|tr/i.test(pathOrUrl);
}

async function discoverWordleSources(fetchedAt: string): Promise<{ entries: SourceManifestEntry[]; warnings: string[] }> {
  const warnings: string[] = [];
  const entries: SourceManifestEntry[] = [];

  if (!hasGhCli()) {
    warnings.push("gh CLI not found; skipped optional Wordle Turkish source discovery.");
    return { entries, warnings };
  }

  const searches = [
    ["search", "repos", "turkish wordle", "--limit", "20", "--json", "fullName,url,description"],
    ["search", "code", "wordle turkish words", "--limit", "20", "--json", "path,repository,url"],
    ["search", "code", "kelimeler wordle tr", "--limit", "20", "--json", "path,repository,url"]
  ];

  for (const args of searches) {
    try {
      const results = runGhJson(args);
      for (const result of results) {
        const item = result as { path?: string; url?: string; repository?: { fullName?: string } };
        if (!item.url || !looksLikeWordList(item.path ?? item.url)) continue;
        const rawUrl = githubFileUrlToRaw(item.url);
        if (!rawUrl) continue;

        try {
          const text = await fetchText(rawUrl);
          const safeName = `wordle-${entries.length + 1}-${(item.repository?.fullName ?? "unknown")
            .toLowerCase()
            .replace(/[^a-z0-9]+/gu, "-")}.txt`;
          const localPath = `raw/sources/${safeName}`;
          writeTextFile(resolve(localPath), text);
          entries.push({
            name: item.repository?.fullName ?? `optional-wordle-source-${entries.length + 1}`,
            url: rawUrl,
            localPath,
            fetchedAt,
            lineCount: lineCount(text),
            license: "unknown",
            notes: "Optional Wordle Turkish source discovered with gh search; license unknown, verify before use"
          });
        } catch (error) {
          warnings.push(`Optional Wordle source failed: ${rawUrl} (${String(error)})`);
        }
      }
    } catch (error) {
      warnings.push(`Optional gh search failed for "${args.slice(2, 5).join(" ")}": ${String(error)}`);
    }
  }

  return { entries, warnings };
}

async function main() {
  ensureDir(sourcesDir);
  writeFileSync(resolve(sourcesDir, ".gitkeep"), "");

  const fetchedAt = new Date().toISOString();
  const sources: SourceManifestEntry[] = [];
  const warnings: string[] = [];

  for (const source of mainSources) {
    try {
      const entry = await downloadSource(source, fetchedAt);
      sources.push(entry);
      console.log(`Fetched ${entry.name}: ${entry.lineCount} lines`);
    } catch (error) {
      warnings.push(`Failed to fetch ${source.url}: ${String(error)}`);
      console.warn(`Warning: failed to fetch ${source.url}: ${String(error)}`);
    }
  }

  const wordle = await discoverWordleSources(fetchedAt);
  sources.push(...wordle.entries);
  warnings.push(...wordle.warnings);

  if (sources.length === 0) {
    throw new Error("No word sources could be downloaded. Check network access and source URLs.");
  }

  const manifest: SourceManifest = {
    generatedAt: new Date().toISOString(),
    sources,
    warnings
  };

  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Wrote ${manifestPath}`);
  if (warnings.length > 0) {
    console.warn(`Completed with ${warnings.length} warning(s).`);
  }
  if (!existsSync(manifestPath)) {
    throw new Error("Manifest was not written.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
