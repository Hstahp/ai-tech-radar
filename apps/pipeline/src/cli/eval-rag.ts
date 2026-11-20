import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  EvalGoldenSetSchema,
  RecordedAnswerSetSchema,
  SearchIndexSchema,
  evaluateAnswers,
  evaluateRetrieval,
  type AnswerEvalSummary,
  type RetrievalEvalSummary,
} from "@radar/core";

const DEFAULT_K = 5;
const METRIC_DECIMALS = 3;

export interface EvalCliOptions {
  indexPath: string;
  goldenPath: string;
  answersPath?: string;
  k: number;
  json: boolean;
}

export function parseEvalArgs(argv: string[]): EvalCliOptions {
  const options: EvalCliOptions = { indexPath: "", goldenPath: "", k: DEFAULT_K, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === "--json") {
      options.json = true;
      continue;
    }
    if (!["--index", "--golden", "--answers", "--k"].includes(flag)) {
      throw new Error(`Unknown argument "${flag}"`);
    }
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`Missing value for ${flag}`);
    }
    index += 1;
    if (flag === "--index") options.indexPath = value;
    else if (flag === "--golden") options.goldenPath = value;
    else if (flag === "--answers") options.answersPath = value;
    else options.k = parseK(value);
  }
  if (!options.indexPath) throw new Error("Missing required --index <path>");
  if (!options.goldenPath) throw new Error("Missing required --golden <path>");
  return options;
}

function parseK(raw: string): number {
  const k = Number(raw);
  if (!Number.isInteger(k) || k < 1) throw new Error(`Invalid --k value "${raw}"`);
  return k;
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function loadJson<T>(
  schema: { parse(value: unknown): T },
  filePath: string,
  label: string
): T {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`Cannot read ${label} file "${filePath}": ${describeError(error)}`);
  }
  try {
    return schema.parse(raw);
  } catch (error) {
    throw new Error(`Invalid ${label} file "${filePath}": ${describeError(error)}`);
  }
}

function formatMetric(value: number): string {
  return value.toFixed(METRIC_DECIMALS);
}

export function formatHumanSummary(
  retrieval: RetrievalEvalSummary,
  answers: AnswerEvalSummary | null,
  k: number
): string {
  const summary = `Retrieval@${k}: ${retrieval.hits}/${retrieval.total} hit (recall ${formatMetric(retrieval.recallAtK)}, MRR ${formatMetric(retrieval.mrr)})`;
  if (answers === null) return summary;
  const refusal =
    answers.refusalAccuracy === null ? "n/a" : formatMetric(answers.refusalAccuracy);
  const citations = `Citations: precision ${formatMetric(answers.citationPrecision)}, recall ${formatMetric(answers.citationRecall)}, refusal accuracy ${refusal}`;
  return `${summary}\n${citations}`;
}

export function runEvalCli(argv: string[]): void {
  try {
    const options = parseEvalArgs(argv);
    const index = loadJson(SearchIndexSchema, options.indexPath, "index");
    const golden = loadJson(EvalGoldenSetSchema, options.goldenPath, "golden");
    const answers = options.answersPath
      ? loadJson(RecordedAnswerSetSchema, options.answersPath, "answers")
      : null;
    const retrieval = evaluateRetrieval(golden.cases, index.items, options.k);
    const answersSummary = answers ? evaluateAnswers(golden.cases, answers.answers) : null;
    const output = options.json
      ? JSON.stringify({ retrieval, answers: answersSummary }, null, 2)
      : formatHumanSummary(retrieval, answersSummary, options.k);
    process.stdout.write(`${output}\n`);
  } catch (error) {
    process.stderr.write(`eval:rag failed: ${describeError(error)}\n`);
    process.exit(1);
  }
}

function main(): void {
  runEvalCli(process.argv.slice(2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
