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

// API routes registration (synchronous)
registerRoutes(app);

// Static file serving and client-side routing
if (process.env.NODE_ENV === "production") {
  const publicPath = path.join(__dirname, "..", "public");

  // Serve static files
  app.use(express.static(publicPath));

  // SPA fallback - must come after API routes
  app.get("*", (req, res, next) => {
    if (!req.path.startsWith("/api")) {
      const indexPath = path.join(publicPath, "index.html");
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error("Error serving index.html:", err);
          next(err);
        }
      });
    } else {
      next();
    }
  });
} else {
  // Development setup
  const { createServer } = await import("http");
  const server = createServer(app);
  await setupVite(app, server);
}

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal Server Error", details: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
});
