import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import fs from "node:fs";

import { execSync } from "node:child_process";

function syncDataExportToDir(destDir: string) {
  fs.mkdirSync(destDir, { recursive: true });

  let synced = false;

  // 1. Thử lấy dữ liệu từ git branch data (origin/data hoặc data)
  try {
    try {
      execSync("git fetch origin data --depth=1", { stdio: "ignore" });
    } catch {
      // Bỏ qua nếu không có mạng hoặc không có remote origin
    }

    let ref = "";
    try {
      execSync("git rev-parse --verify origin/data", { stdio: "ignore" });
      ref = "origin/data";
    } catch {
      try {
        execSync("git rev-parse --verify data", { stdio: "ignore" });
        ref = "data";
      } catch {
        // Không tìm thấy branch data trong git
      }
    }

    if (ref) {
      const filesOutput = execSync(`git ls-tree -r --name-only ${ref}`, { encoding: "utf8" });
      const files = filesOutput.split("\n").map((f) => f.trim()).filter(Boolean);
      for (const file of files) {
        if (file.startsWith(".")) continue;
        const content = execSync(`git show ${ref}:${file}`);
        const fileName = path.basename(file);
        fs.writeFileSync(path.join(destDir, fileName), content);
      }
      if (files.length > 0) {
        synced = true;
      }
    }
  } catch {
    // Bỏ qua lỗi git, chuyển sang fallback
  }

  // 2. Fallback sang local ../../data/export nếu có
  if (!synced) {
    const localSrcDir = path.resolve(__dirname, "../../data/export");
    if (fs.existsSync(localSrcDir)) {
      const entries = fs.readdirSync(localSrcDir);
      for (const entry of entries) {
        if (entry.startsWith(".")) continue;
        const srcFile = path.join(localSrcDir, entry);
        if (fs.statSync(srcFile).isFile()) {
          fs.copyFileSync(srcFile, path.join(destDir, entry));
          synced = true;
        }
      }
    }
  }

  // 3. Fallback tải trực tiếp từ GitHub raw nếu git fetch bị chặn (môi trường Cloudflare Build)
  if (!synced) {
    try {
      const rawLatest = execSync(
        "curl -sS https://raw.githubusercontent.com/Hstahp/ai-tech-radar/data/latest.json",
        { encoding: "utf8" }
      );
      const parsed = JSON.parse(rawLatest);
      if (parsed.items && parsed.items.length > 0) {
        fs.writeFileSync(path.join(destDir, "latest.json"), rawLatest);
        try {
          const rawFeed = execSync(
            "curl -sS https://raw.githubusercontent.com/Hstahp/ai-tech-radar/data/feed.xml",
            { encoding: "utf8" }
          );
          if (rawFeed.includes("<rss")) {
            fs.writeFileSync(path.join(destDir, "feed.xml"), rawFeed);
          }
        } catch {
          // Bỏ qua lỗi feed
        }
        synced = true;
      }
    } catch {
      // Bỏ qua nếu môi trường không có curl hoặc không có mạng
    }
  }

  // 4. Fallback dữ liệu rỗng để build không bao giờ fail
  const latestJsonPath = path.join(destDir, "latest.json");
  if (!fs.existsSync(latestJsonPath)) {
    const today = new Date().toISOString().slice(0, 10);
    const emptyPayload = {
      digest_date: today,
      generated_at: new Date().toISOString(),
      version: "v1.0.0",
      items_count: 0,
      items: [],
    };
    fs.writeFileSync(latestJsonPath, JSON.stringify(emptyPayload, null, 2), "utf8");
  }

  const feedXmlPath = path.join(destDir, "feed.xml");
  if (!fs.existsSync(feedXmlPath)) {
    const emptyRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>AI Tech Radar</title>
    <link>https://ai-tech-radar-fe.phatle219.workers.dev</link>
    <description>Bản tin công nghệ và AI Tech Radar</description>
  </channel>
</rss>`;
    fs.writeFileSync(feedXmlPath, emptyRss, "utf8");
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "serve-data-export",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith("/data/export/")) {
            const cleanUrl = req.url.split("?")[0];
            const fileName = cleanUrl.replace("/data/export/", "");
            let filePath = path.resolve(__dirname, "../../data/export", fileName);
            if (!fs.existsSync(filePath)) {
              filePath = path.resolve(__dirname, "public/data/export", fileName);
            }
            if (!fs.existsSync(filePath)) {
              filePath = path.resolve(__dirname, "dist/data/export", fileName);
            }

            if (fs.existsSync(filePath)) {
              const contentType = fileName.endsWith(".json")
                ? "application/json; charset=utf-8"
                : fileName.endsWith(".xml")
                ? "application/xml; charset=utf-8"
                : "text/plain; charset=utf-8";

              res.setHeader("Content-Type", contentType);
              res.end(fs.readFileSync(filePath));
              return;
            }
          }
          next();
        });
      },
      buildStart() {
        // Đồng bộ trước vào public/data/export
        syncDataExportToDir(path.resolve(__dirname, "public/data/export"));
      },
      closeBundle() {
        // Đảm bảo dist/data/export luôn có dữ liệu sau build
        syncDataExportToDir(path.resolve(__dirname, "dist/data/export"));
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    fs: {
      allow: [".."],
    },
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
      "/auth": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
