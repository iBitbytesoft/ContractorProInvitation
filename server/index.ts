import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import "dotenv/config";
import nodemailer from "nodemailer";
import cors from "cors";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Basic middleware setup
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API routes
app.use("/api", registerRoutes(app));

if (process.env.NODE_ENV === "production") {
  const publicPath = path.join(__dirname, "..", "public");

  // Serve static files
  app.use(express.static(publicPath));

  // Serve index.html for all non-API routes (SPA fallback)
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(publicPath, "index.html"));
    }
  });
} else {
  // Development setup with Vite
  const server = await import("http").then(({ createServer }) => createServer(app));
  await setupVite(app, server);
}

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
});
