export const PROMPT_VERSION = "v1.0.0";
export const CHAT_PROMPT_VERSION = 1;
export const EXPLAIN_PROMPT_VERSION = 1;

export const CATEGORIES = ["repo", "extension", "news", "paper", "model"] as const;
export type Category = (typeof CATEGORIES)[number];

export const VERDICTS = ["try_now", "watch", "skip"] as const;
export type Verdict = (typeof VERDICTS)[number];

export const CONFIDENCES = ["low", "medium", "high"] as const;
export type Confidence = (typeof CONFIDENCES)[number];

export const TAGS = [
  "github",
  "extension",
  "model",
  "paper",
  "mcp",
  "agent",
  "coding-assistant",
  "rag",
  "local-llm",
  "testing",
  "devtools",
  "security",
  "data",
  "infra",
  "open-source",
] as const;
export type Tag = (typeof TAGS)[number];
