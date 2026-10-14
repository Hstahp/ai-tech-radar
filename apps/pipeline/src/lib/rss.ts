import type { DigestFeedItem } from "@radar/core";

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

export function generateRssXml(items: DigestFeedItem[], digestDate: string, siteUrl = "https://ai-tech-radar.pages.dev"): string {
  const pubDate = new Date(`${digestDate}T07:00:00+07:00`).toUTCString();

  const itemXmls = items.map((item) => {
    const title = escapeXml(`[${item.section.toUpperCase()}] ${item.title}`);
    const link = escapeXml(item.url);
    const tagList = item.tags ? item.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
    const description = escapeXml(
      [
        item.purpose ? `🎯 ${item.purpose}` : "",
        item.highlight ? `⭐ ${item.highlight}` : "",
        item.action ? `🔗 ${item.action}` : "",
        item.verdict ? `🧭 Khuyến nghị: ${item.verdict}` : "",
        tagList.length > 0 ? `🏷️ Tags: ${tagList.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join("\n\n")
    );

    const guid = escapeXml(`${item.url}#${digestDate}`);

    return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid isPermaLink="false">${guid}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${description}]]></description>
    </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AI Tech Radar - ${escapeXml(digestDate)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>Radar công nghệ &amp; điểm tin AI thông minh dành cho lập trình viên</description>
    <language>vi</language>
    <lastBuildDate>${pubDate}</lastBuildDate>
    <atom:link href="${escapeXml(siteUrl)}/feed.xml" rel="self" type="application/rss+xml"/>
${itemXmls.join("\n")}
  </channel>
</rss>
`;
}
