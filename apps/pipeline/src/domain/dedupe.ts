import { normalizeVietnamese } from "@radar/core";

export interface DedupeCandidate {
  urlHash?: string;
  title: string;
  description?: string;
  score: number;
}

export const DEFAULT_DUPLICATE_TITLE_THRESHOLD = 0.85;

const MIN_TOKEN_LENGTH = 3;

const TITLE_STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "into",
  "your",
  "cua",
  "cho",
  "voi",
  "trong",
  "nhung",
  "duoc",
  "mot",
  "cac",
  "khi",
  "nhu",
  "tren",
]);

function tokenize(text: string): string[] {
  return normalizeVietnamese(text)
    .replace(/-/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= MIN_TOKEN_LENGTH && !TITLE_STOP_WORDS.has(token));
}

export function titleSimilarity(left: string, right: string): number {
  const leftTokens = new Set(tokenize(left));
  const rightTokens = new Set(tokenize(right));
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;

  let intersection = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) intersection += 1;
  }

  const union = leftTokens.size + rightTokens.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function dedupeCandidates<T extends DedupeCandidate>(
  candidates: T[],
  threshold = DEFAULT_DUPLICATE_TITLE_THRESHOLD
): T[] {
  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  const kept: T[] = [];
  const seenUrlHashes = new Set<string>();

  for (const candidate of sorted) {
    if (candidate.urlHash && seenUrlHashes.has(candidate.urlHash)) {
      continue;
    }

    const isDuplicate = kept.some(
      (existing) => titleSimilarity(existing.title, candidate.title) >= threshold
    );
    if (isDuplicate) {
      continue;
    }

    kept.push(candidate);
    if (candidate.urlHash) {
      seenUrlHashes.add(candidate.urlHash);
    }
  }

  return kept;
}
