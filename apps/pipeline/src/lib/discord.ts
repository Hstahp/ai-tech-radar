import type { DigestFeedItem, Verdict } from '@radar/core';
import { logger } from './logger.js';

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
    watch: 0xf59e0b, // Amber
    skip: 0x64748b, // Slate
};

const VERDICT_EMOJIS: Record<Verdict, string> = {
    try_now: '🚀 Thử ngay',
    watch: '👀 Theo dõi',
    skip: '⏭️ Bỏ qua',
};

export function buildDiscordEmbeds(
    items: DigestFeedItem[],
    digestDate: string,
    siteUrl = process.env.SITE_URL || 'https://ai-tech-radar-fe.phatle219.workers.dev',
): DiscordWebhookPayload[] {
    if (items.length === 0) return [];

    // Lấy top 3-5 mục nổi bật nhất để làm teaser
    const topItems = items.slice(0, 4);

    const fields: DiscordEmbedField[] = topItems.map((item) => {
        const verdictEmoji = item.verdict ? VERDICT_EMOJIS[item.verdict] : '⚡';
        const tagList = item.tags
            ? item.tags
                  .split(',')
                  .map((t) => `#${t.trim()}`)
                  .slice(0, 3)
                  .join(' ')
            : '';
        const detailUrl = `${siteUrl.replace(/\/$/, '')}/item/${encodeURIComponent(item.key ?? String(item.item_id))}`;

        return {
            name: `${verdictEmoji} [${item.section.toUpperCase()}] ${item.title}`,
            value: `${item.purpose || item.highlight || 'Công nghệ AI mới'}\n👉 [Xem phân tích chi tiết](${detailUrl}) ${tagList ? `• \`${tagList}\`` : ''}`,
            inline: false,
        };
    });

    const mainEmbed: DiscordEmbed = {
        title: `🛰️ BẢN TIN AI TECH RADAR — ${digestDate}`,
        url: siteUrl,
        color: 0x6366f1, // Indigo theme color
        description: `Hôm nay radar đã tự động thu thập và tóm tắt **${items.length}** công nghệ AI, repo trending và extension mới nhất dành cho lập trình viên!\n\n🔥 **Các điểm tin nổi bật hôm nay:**`,
        fields: [
            ...fields,
            {
                name: '🌐 Trải nghiệm đầy đủ trên Web Radar',
                value: `👉 **[Truy cập Website để xem toàn bộ ${items.length} tin & Chat AI](${siteUrl})**\n*(Đầy đủ phân tích kiến trúc, hướng dẫn bắt đầu nhanh và hỏi đáp trực tiếp với Chatbot)*`,
                inline: false,
            },
        ],
        footer: {
            text: `AI Tech Radar • Cập nhật tự động 100% bằng Free Tier`,
        },
    };

    return [
        {
            content: `📢 **Bản tin AI Tech Radar mới nhất đã sẵn sàng!** (${digestDate})`,
            embeds: [mainEmbed],
        },
    ];
}

export async function sendDiscordNotification(webhookUrl: string, payload: DiscordWebhookPayload): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
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
