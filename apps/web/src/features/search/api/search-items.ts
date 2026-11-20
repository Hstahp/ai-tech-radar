import { z } from "zod";
import { API_BASE } from "../../../lib/api-config";

export const SearchHitSchema = z.object({
  key: z.string(),
  title: z.string(),
  url: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  purpose: z.string().nullable().optional(),
  stars: z.number().nullable().optional(),
});

export const SearchResponseSchema = z.object({
  query: z.string(),
  count: z.number(),
  topScore: z.number(),
  totalCandidates: z.number(),
  items: z.array(SearchHitSchema),
});

export type SearchHit = z.infer<typeof SearchHitSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;

export async function searchItems(query: string, limit = 10): Promise<SearchResponse> {
  const res = await fetch(
    `${API_BASE}/api/search?q=${encodeURIComponent(query)}&limit=${limit}`,
  );

  if (!res.ok) {
    let message: string | undefined;
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      message = body?.error?.message;
    } catch {
      // Phản hồi lỗi không phải JSON: dùng thông báo mặc định bên dưới.
    }
    throw new Error(message ?? `Lỗi ${res.status}`);
  }

  const payload: unknown = await res.json();
  return SearchResponseSchema.parse(payload);
}
