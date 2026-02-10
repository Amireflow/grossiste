import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./auth";
import multer from "multer";
import path from "path";
import { supabaseAdmin } from "./auth/supabaseClient";

// Route modules
import { registerProfileRoutes } from "./routes/profile";
import { registerProductRoutes } from "./routes/products";
import { registerCartRoutes } from "./routes/cart";
import { registerOrderRoutes } from "./routes/orders";
import { registerWalletAndBoostRoutes } from "./routes/wallet-boosts";
import { registerAdminRoutes } from "./routes/admin";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  }
});

// Simple in-memory rate limiter for uploads (10 per 15 min per IP)
const uploadRateMap = new Map<string, { count: number; resetAt: number }>();
const UPLOAD_RATE_LIMIT = 10;
const UPLOAD_RATE_WINDOW = 15 * 60 * 1000; // 15 minutes

function checkUploadRate(ip: string): boolean {
  const now = Date.now();
  const entry = uploadRateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    uploadRateMap.set(ip, { count: 1, resetAt: now + UPLOAD_RATE_WINDOW });
    return true;
  }
  if (entry.count >= UPLOAD_RATE_LIMIT) return false;
  entry.count++;
  return true;
}
// Cleanup expired entries every 30 min
setInterval(() => {
  const now = Date.now();
  uploadRateMap.forEach((entry, ip) => {
    if (now > entry.resetAt) uploadRateMap.delete(ip);
  });
}, 30 * 60 * 1000);

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  await setupAuth(app);
  registerAuthRoutes(app);

  // File upload
  app.post("/api/upload", isAuthenticated, upload.single("image"), async (req, res) => {
    if (!checkUploadRate(req.ip || "unknown")) {
      return res.status(429).json({ message: "Too many uploads. Please try again later." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      const fileExt = path.extname(req.file.originalname);
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;

      const { data, error } = await supabaseAdmin.storage
        .from('uploads')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('uploads')
        .getPublicUrl(fileName);

      res.json({ url: publicUrl });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Register domain-specific routes
  registerProfileRoutes(app);
  registerProductRoutes(app);
  registerCartRoutes(app);
  registerOrderRoutes(app);
  registerWalletAndBoostRoutes(app);
  registerAdminRoutes(app);

  return httpServer;
}
