import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { injectSeoMeta } from "./seo";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use("/assets", express.static(path.join(distPath, "assets"), {
    maxAge: "1y",
    immutable: true,
  }));

  app.use("/images", express.static(path.join(distPath, "images"), {
    maxAge: "7d",
  }));

  const longCacheExts = /\.(mp3|wav|ogg|webp|png|jpg|jpeg|ico|svg|woff2?|ttf|eot)$/i;
  app.use(express.static(distPath, {
    maxAge: "1h",
    index: false,
    setHeaders(res, filePath) {
      if (longCacheExts.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=604800");
      }
    },
  }));

  const htmlTemplate = fs.readFileSync(path.resolve(distPath, "index.html"), "utf-8");

  app.use("*", (req, res) => {
    let html = injectSeoMeta(htmlTemplate, req.originalUrl, req);
    res.set("Content-Type", "text/html");
    res.set("Cache-Control", "no-cache");
    res.set("X-Content-Type-Options", "nosniff");
    res.set("X-Frame-Options", "SAMEORIGIN");
    res.set("Referrer-Policy", "strict-origin-when-cross-origin");
    res.send(html);
  });
}
