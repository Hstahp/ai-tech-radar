import type { DigestFeedItem, Verdict } from "@radar/core";
import { logger } from "./logger.js";

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbed {
  title: string;
  url?: string;
  color?: number;
  description?: string;
  fields?: DiscordEmbedField[];
  footer?: {
    text: string;
  };
}

export interface DiscordWebhookPayload {
  content?: string;
  embeds: DiscordEmbed[];
}

const VERDICT_COLORS: Record<Verdict, number> = {
  try_now: 0x22c55e, // Green
  watch: 0xf59e0b,   // Amber
  skip: 0x64748b,    // Slate
};

const VERDICT_EMOJIS: Record<Verdict, string> = {
  try_now: "🚀 Thử ngay",
  watch: "👀 Theo dõi",
  skip: "⏭️ Bỏ qua",
};

export function buildDiscordEmbeds(items: DigestFeedItem[], digestDate: string): DiscordWebhookPayload[] {
  const maxEmbedsPerBatch = 10;
  const batches: DiscordWebhookPayload[] = [];

  for (let i = 0; i < items.length; i += maxEmbedsPerBatch) {
    const chunk = items.slice(i, i + maxEmbedsPerBatch);
    const isFirstBatch = i === 0;

    const embeds: DiscordEmbed[] = chunk.map((item) => {
      const color = item.verdict ? VERDICT_COLORS[item.verdict] : 0x3b82f6;
      const verdictLabel = item.verdict ? VERDICT_EMOJIS[item.verdict] : "Chưa đánh giá";

      const fields: DiscordEmbedField[] = [];

      if (item.action) {
        fields.push({
          name: "🔗 Hành động",
          value: item.action,
          inline: false,
        });
      }

      const tagList = item.tags ? item.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
      if (tagList.length > 0) {
        fields.push({
          name: "🏷️ Tags",
          value: tagList.map((t) => `\`#${t}\``).join(" "),
          inline: true,
        });
      }

      fields.push({
        name: "🧭 Đánh giá",
        value: verdictLabel,
        inline: true,
      });

      const descLines: string[] = [];
      if (item.purpose) descLines.push(`🎯 **Mục đích:** ${item.purpose}`);
      if (item.highlight) descLines.push(`⭐ **Điểm nổi bật:** ${item.highlight}`);

      return {
        title: `[${item.section.toUpperCase()}] ${item.title}`,
        url: item.url,
        color,
        description: descLines.join("\n\n"),
        fields,
        footer: {
          text: `AI Tech Radar • Rank #${item.rank} (${digestDate})`,
        },
      };
    });

    batches.push({
      content: isFirstBatch ? `🛰️ **AI TECH RADAR — Bản tin ngày ${digestDate}**` : undefined,
      embeds,
    });
  }

  return batches;
}

export async function sendDiscordNotification(webhookUrl: string, payload: DiscordWebhookPayload): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errorText = await res.text();
      logger.error(`Discord webhook error (${res.status}): ${errorText}`);
      return false;
    }

    return true;
  } catch (err: any) {
    logger.error(`Failed to send Discord webhook: ${err.message}`);
    return false;
  }
}
