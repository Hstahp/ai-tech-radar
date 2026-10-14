import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import fs from "node:fs";

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
            const filePath = path.resolve(__dirname, "../../data/export", fileName);

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
      closeBundle() {
        const srcDir = path.resolve(__dirname, "../../data/export");
        const destDir = path.resolve(__dirname, "dist/data/export");
        if (fs.existsSync(srcDir)) {
          fs.mkdirSync(destDir, { recursive: true });
          fs.cpSync(srcDir, destDir, { recursive: true });
        }
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
