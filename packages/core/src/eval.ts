import { z } from "zod";
import type { SearchIndexItem } from "./schemas.js";
import { normalizeVietnamese } from "./text.js";
import { retrieveRelevantItems } from "./retrieval.js";

export const RetrievalEvalCaseSchema = z.object({
  query: z.string().min(1),
  expectedTitleContains: z.array(z.string().min(1)).min(1),
  expectRefusal: z.boolean().optional(),
});

export const EvalGoldenSetSchema = z.object({
  cases: z.array(RetrievalEvalCaseSchema).min(1),
});

export const RecordedCitationSchema = z.object({
  key: z.string().optional(),
  title: z.string().optional(),
});

export const RecordedAnswerSchema = z.object({
  query: z.string().min(1),
  answer: z.string(),
  refused: z.boolean().default(false),
  citations: z.array(RecordedCitationSchema).default([]),
});

export const RecordedAnswerSetSchema = z.object({
  answers: z.array(RecordedAnswerSchema),
});

export type RetrievalEvalCase = z.infer<typeof RetrievalEvalCaseSchema>;
export type RecordedCitation = z.infer<typeof RecordedCitationSchema>;
export type RecordedAnswer = z.infer<typeof RecordedAnswerSchema>;

export interface RetrievalCaseResult {
  query: string;
  rank: number | null;
  hit: boolean;
  reciprocalRank: number;
}

export interface RetrievalEvalSummary {
  total: number;
  hits: number;
  recallAtK: number;
  mrr: number;
  cases: RetrievalCaseResult[];
}

export interface AnswerCaseResult {
  query: string;
  refused: boolean;
  citationsTotal: number;
  citationsCorrect: number;
  expectedTotal: number;
  expectedCovered: number;
  refusalCorrect: boolean | null;
}

export interface AnswerEvalSummary {
  total: number;
  citationPrecision: number;
  citationRecall: number;
  refusalAccuracy: number | null;
  cases: AnswerCaseResult[];
}

const MIN_EVAL_SCORE = 0.1;

export function matchesExpectedTitle(title: string, fragments: string[]): boolean {
  const normalizedTitle = normalizeVietnamese(title);
  return fragments.some((fragment) => normalizedTitle.includes(normalizeVietnamese(fragment)));
}

export function evaluateRetrieval(
  cases: RetrievalEvalCase[],
  items: SearchIndexItem[],
  k = 5
): RetrievalEvalSummary {
  const inScopeCases = cases.filter((evalCase) => evalCase.expectRefusal !== true);

  const results = inScopeCases.map((evalCase) => {
    const { items: topItems } = retrieveRelevantItems(items, evalCase.query, k, MIN_EVAL_SCORE);
    const rankIndex = topItems.findIndex((item) =>
      matchesExpectedTitle(item.title, evalCase.expectedTitleContains)
    );
    const rank = rankIndex === -1 ? null : rankIndex + 1;
    return {
      query: evalCase.query,
      rank,
      hit: rank !== null,
      reciprocalRank: rank === null ? 0 : 1 / rank,
    };
  });

  const hits = results.filter((result) => result.hit).length;
  const mrr =
    results.length === 0
      ? 0
      : results.reduce((sum, result) => sum + result.reciprocalRank, 0) / results.length;

  return {
    total: results.length,
    hits,
    recallAtK: results.length === 0 ? 0 : hits / results.length,
    mrr,
    cases: results,
  };
}

export function evaluateAnswers(
  cases: RetrievalEvalCase[],
  answers: RecordedAnswer[]
): AnswerEvalSummary {
  const answersByQuery = new Map(answers.map((answer) => [answer.query, answer]));
  let totalCitations = 0;
  let correctCitations = 0;
  let refusalChecks = 0;
  let correctRefusals = 0;

  const results = cases.map((evalCase) => {
    const answer = answersByQuery.get(evalCase.query);
    const refused = answer?.refused ?? true;
    const citations = answer?.citations ?? [];
    const isRefusalCase = evalCase.expectRefusal === true;
    const citationsCorrect = citations.filter((citation) =>
      matchesExpectedTitle(citation.title ?? "", evalCase.expectedTitleContains)
    ).length;
    const expectedCovered = isRefusalCase
      ? 0
      : evalCase.expectedTitleContains.filter((fragment) =>
          citations.some((citation) => matchesExpectedTitle(citation.title ?? "", [fragment]))
        ).length;

    totalCitations += citations.length;
    correctCitations += citationsCorrect;

    let refusalCorrect: boolean | null = null;
    if (evalCase.expectRefusal !== undefined) {
      refusalCorrect = evalCase.expectRefusal === refused;
      refusalChecks += 1;
      if (refusalCorrect) correctRefusals += 1;
    }

    return {
      query: evalCase.query,
      refused,
      citationsTotal: citations.length,
      citationsCorrect,
      expectedTotal: isRefusalCase ? 0 : evalCase.expectedTitleContains.length,
      expectedCovered,
      refusalCorrect,
    };
  });

  const expectedTotal = results.reduce((sum, result) => sum + result.expectedTotal, 0);
  const expectedCovered = results.reduce((sum, result) => sum + result.expectedCovered, 0);

  return {
    total: results.length,
    citationPrecision: totalCitations === 0 ? 0 : correctCitations / totalCitations,
    citationRecall: expectedTotal === 0 ? 0 : expectedCovered / expectedTotal,
    refusalAccuracy: refusalChecks === 0 ? null : correctRefusals / refusalChecks,
    cases: results,
  };
}
