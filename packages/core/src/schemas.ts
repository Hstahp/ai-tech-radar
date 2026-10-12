import { z } from "zod";
import { CATEGORIES, CONFIDENCES, TAGS, VERDICTS } from "./constants.js";

export const CategorySchema = z.enum(CATEGORIES);
export const VerdictSchema = z.enum(VERDICTS);
export const ConfidenceSchema = z.enum(CONFIDENCES);
export const TagSchema = z.enum(TAGS);

export const SummaryItemSchema = z.object({
  id: z.number().int(),
  purpose: z.string().trim().min(1).max(300),
  highlight: z.string().trim().min(1).max(360),
  action: z.string().trim().min(1).max(240),
  verdict: VerdictSchema,
  confidence: ConfidenceSchema,
  tags: z.array(TagSchema).min(1).max(3),
});

export const SummaryResponseSchema = z.object({
  items: z.array(SummaryItemSchema),
});

export type SummaryItem = z.infer<typeof SummaryItemSchema>;
export type SummaryResponse = z.infer<typeof SummaryResponseSchema>;

export const ItemMetaSchema = z.object({
  stars: z.number().optional(),
  stars_today: z.number().optional(),
  forks: z.number().optional(),
  language: z.string().optional(),
  points: z.number().optional(),
  comments: z.number().optional(),
  installs: z.number().optional(),
  rating: z.number().optional(),
});

export const BatchItemInputSchema = z.object({
  id: z.number().int(),
  category: CategorySchema,
  title: z.string(),
  description: z.string().optional(),
  url: z.string().url(),
  meta: ItemMetaSchema.optional(),
});

export type BatchItemInput = z.infer<typeof BatchItemInputSchema>;

export const DigestFeedItemSchema = z.object({
  digest_date: z.string(),
  section: CategorySchema,
  rank: z.number().int(),
  score: z.number().optional(),
  item_id: z.number().int(),
  key: z.string().optional(),
  category: CategorySchema,
  title: z.string(),
  url: z.string(),
  language: z.string().nullable().optional(),
  purpose: z.string().nullable().optional(),
  highlight: z.string().nullable().optional(),
  action: z.string().nullable().optional(),
  verdict: VerdictSchema.nullable().optional(),
  confidence: ConfidenceSchema.nullable().optional(),
  tags: z.string().nullable().optional(),
  stars: z.number().nullable().optional(),
});

export type DigestFeedItem = z.infer<typeof DigestFeedItemSchema>;

export const SearchIndexItemSchema = z.object({
  key: z.string(),
  title: z.string(),
  category: CategorySchema,
  url: z.string(),
  tags: z.array(z.string()),
  purpose: z.string().nullable().optional(),
  highlight: z.string().nullable().optional(),
  action: z.string().nullable().optional(),
  verdict: VerdictSchema.nullable().optional(),
  stars: z.number().nullable().optional(),
});

export const SearchIndexSchema = z.object({
  generated_at: z.string(),
  items: z.array(SearchIndexItemSchema),
});

export type SearchIndexItem = z.infer<typeof SearchIndexItemSchema>;
export type SearchIndex = z.infer<typeof SearchIndexSchema>;

export interface ParseSummariesResult {
  items: SummaryItem[];
  missing: number[];
  unexpected: number[];
}

/** Clean response (in case model wraps in markdown codeblocks) and validate with Zod */
export function parseSummaries(raw: string, expectedIds: number[]): ParseSummariesResult {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsedJson = JSON.parse(cleaned);
  const parsed = SummaryResponseSchema.parse(parsedJson);

  const got = new Set(parsed.items.map((i) => i.id));
  const missing = expectedIds.filter((id) => !got.has(id));
  const unexpected = parsed.items.filter((i) => !expectedIds.includes(i.id)).map((i) => i.id);

  return {
    items: parsed.items.filter((i) => expectedIds.includes(i.id)),
    missing,
    unexpected,
  };
}

export const ChatAnswerSchema = z.object({
  answerable: z.boolean(),
  answer: z.string().max(1200),
  citations: z.array(z.string()).max(8),
});

export type ChatAnswer = z.infer<typeof ChatAnswerSchema>;

export const DeepExplainSchema = z.object({
  what_it_is: z.string().min(1).max(600),
  how_it_works: z.string().min(1).max(1000),
  use_cases: z.array(z.string().min(1)).min(1).max(5),
  limitations: z.array(z.string().min(1)).min(1).max(5),
  getting_started: z.string().max(800),
  confidence: ConfidenceSchema,
});

export type DeepExplain = z.infer<typeof DeepExplainSchema>;

export const UserRoleSchema = z.enum(["user", "admin"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string().nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  role: UserRoleSchema,
  tags: z.array(z.string()).default([]),
  createdAt: z.string().optional(),
  lastLoginAt: z.string().nullable().optional(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const UpdateUserTagsSchema = z.object({
  tags: z.array(TagSchema).max(10),
});
export type UpdateUserTags = z.infer<typeof UpdateUserTagsSchema>;



