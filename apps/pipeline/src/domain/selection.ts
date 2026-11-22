export interface SelectableCandidate {
  category: string;
  score: number;
}

export interface SelectionOptions {
  maxItems?: number;
  maxPerCategory?: number;
}

export const DEFAULT_MAX_DIGEST_ITEMS = 25;
export const DEFAULT_MAX_ITEMS_PER_CATEGORY = 8;

export function selectTopCandidates<T extends SelectableCandidate>(
  candidates: T[],
  options: SelectionOptions = {}
): T[] {
  const maxItems = options.maxItems ?? DEFAULT_MAX_DIGEST_ITEMS;
  const maxPerCategory = options.maxPerCategory ?? DEFAULT_MAX_ITEMS_PER_CATEGORY;

  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  const perCategory = new Map<string, number>();
  const selected: T[] = [];

  for (const candidate of sorted) {
    const used = perCategory.get(candidate.category) ?? 0;
    if (used >= maxPerCategory) continue;

    selected.push(candidate);
    perCategory.set(candidate.category, used + 1);

    if (selected.length >= maxItems) break;
  }

  return selected;
}
