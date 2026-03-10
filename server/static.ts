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

  app.use(express.static(distPath, {
    maxAge: "1h",
  }));

  app.use("*", (req, res) => {
    let html = fs.readFileSync(path.resolve(distPath, "index.html"), "utf-8");
    html = injectSeoMeta(html, req.originalUrl, req);
    res.set("Content-Type", "text/html");
    res.set("Cache-Control", "no-cache");
    res.send(html);
  });
}
