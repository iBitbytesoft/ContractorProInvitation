import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import "dotenv/config";
import nodemailer from "nodemailer";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Basic middleware setup
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? true // Allow all origins in production
        : "http://localhost:5001",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  const staticPath = path.resolve(__dirname, "..", "public");
  app.use(express.static(staticPath));
}

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  log(`Incoming request: ${req.method} ${path}`);
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    log(
      `Request to ${path} completed with status ${res.statusCode} in ${duration}ms`
    );
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Add /send-email route here
app.post("/send-email", async (req, res) => {
  const { to, subject, text, inviterEmail, invitationLink, role } = req.body;

  // Use Gmail SMTP (move credentials to env variables in production)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "baqar.falconit@gmail.com",
      pass: "gkko uxdt iqbg piul", // Use environment variable for production
    },
  });

  // Create the email content using HTML
  const htmlContent = `
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; background-color: #f7f7f7; }
            .container { width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; }
            h1 { color: #333; }
            p { color: #555; font-size: 16px; }
            a { color: #fff; background-color: #007BFF; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>You're Invited!</h1>
            <p>Hi,</p>
            <p>You have been invited to join our team by <strong>${inviterEmail}</strong> as a <strong>${role}</strong>.</p>
            <p>Click the button below to accept the invitation:</p>
            <a href="${invitationLink}" target="_blank">Accept Invitation</a>
            <div class="footer">
                <p>This invitation will expire in 7 days. If you did not request this, please ignore this email.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: "baqar.falconit@gmail.com",
    to,
    subject,
    text,
    html: htmlContent, // Send HTML content
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send("Email sent!");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error sending email.");
  }
});

(async () => {
  try {
    log("Starting server initialization...");

    // Register routes and get server instance
    const server = await registerRoutes(app);
    log("Routes registered successfully");

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`Error: ${message}`);
      res.status(status).json({ message });
    });

    // Always use Vite middleware for development
    log("Setting up Vite middleware...");
    await setupVite(app, server);
    log("Vite middleware setup complete");

    // Try multiple ports if 5000 is in use
    const tryPort = (port: number): Promise<void> => {
      return new Promise((resolve, reject) => {
        log(`Attempting to start server on port ${port}...`);

        server
          .listen({
            port,
            host: "0.0.0.0",
          })
          .on("error", (error: any) => {
            if (error.code === "EADDRINUSE") {
              log(`Port ${port} is in use, trying ${port + 1}`);
              resolve(tryPort(port + 1));
            } else {
              log(`Failed to start server: ${error.message}`);
              reject(error);
            }
          })
          .on("listening", () => {
            log(`Server started successfully on port ${port}`);
            resolve();
          });
      });
    };

    try {
      await tryPort(5000);
    } catch (error) {
      log(`Fatal error starting server: ${error}`);
      process.exit(1);
    }
  } catch (error) {
    log(`Server initialization failed: ${error}`);
    process.exit(1);
  }
})();
