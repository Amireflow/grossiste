import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Serve uploaded files
import path from "path";
import fs from "fs";
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use("/uploads", express.static(uploadsDir));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        const jsonStr = JSON.stringify(capturedJsonResponse);
        logLine += ` :: ${jsonStr.length > 80 ? jsonStr.substring(0, 80) + '…' : jsonStr}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // CRITICAL: Bind to port FIRST so Render detects it immediately
  const port = parseInt(process.env.PORT || "5000", 10);

  // Basic health check that responds before routes are fully loaded
  let routesReady = false;
  app.get("/api/health", (_req, res) => {
    res.json({ status: routesReady ? "ready" : "starting", port, timestamp: Date.now() });
  });

  log(`Starting server, binding to 0.0.0.0:${port}...`);

  httpServer.listen(port, "0.0.0.0", async () => {
    log(`Port ${port} bound successfully, initializing routes...`);

    try {
      await registerRoutes(httpServer, app);
      log("Routes registered successfully");

      if (process.env.NODE_ENV !== "production") {
        const { seedDatabase } = await import("./seed");
        await seedDatabase().catch((err) => console.error("Seed error:", err));
      }

      app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        console.error("Internal Server Error:", err);
        if (res.headersSent) {
          return next(err);
        }
        return res.status(status).json({ message });
      });

      if (process.env.NODE_ENV === "production") {
        serveStatic(app);
      } else {
        const { setupVite } = await import("./vite");
        await setupVite(httpServer, app);
      }

      routesReady = true;
      log(`Server fully ready on port ${port}`);
    } catch (err) {
      console.error("Failed to initialize routes:", err);
      process.exit(1);
    }
  });
})();

