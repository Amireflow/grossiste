import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./auth";
import { z } from "zod";
import { insertUserProfileSchema, insertProductSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const storageConfig = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storageConfig,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  }
});

const profileCreateSchema = z.object({
  role: z.enum(["shop_owner", "supplier"]),
  businessName: z.string().min(2),
  phone: z.string().min(8),
  address: z.string().optional(),
  city: z.string().min(2),
  country: z.string().min(2),
  currency: z.enum(["XOF", "XAF", "NGN", "GHS"]),
  description: z.string().optional(),
});

const cartAddSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
});

const cartUpdateSchema = z.object({
  quantity: z.number().int().min(1),
});

const checkoutSchema = z.object({
  contactName: z.string().min(1, "Nom du contact requis"),
  deliveryPhone: z.string().min(1, "Telephone requis"),
  deliveryAddress: z.string().optional(),
  deliveryCity: z.string().min(1, "Ville requise"),
  paymentMethod: z.enum(["mobile_money", "cash_on_delivery"]).default("mobile_money"),
  notes: z.string().optional(),
});

const statusUpdateSchema = z.object({
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]),
});

const productCreateSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  categoryId: z.string().min(1),
  price: z.string().min(1),
  unit: z.string().min(1),
  minOrder: z.coerce.number().int().min(1).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  imageUrl: z.string().optional(),
});

const productUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  price: z.string().optional(),
  unit: z.string().optional(),
  minOrder: z.coerce.number().int().min(1).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  app.post("/api/upload", isAuthenticated, upload.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });

  app.get("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getProfileByUserId(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to get profile" });
    }
  });

  app.post("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = profileCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }
      const userId = req.user.claims.sub;
      const existing = await storage.getProfileByUserId(userId);
      if (existing) {
        return res.status(400).json({ message: "Profile already exists" });
      }
      const profile = await storage.createProfile({ ...parsed.data, userId });
      res.status(201).json(profile);
    } catch (error) {
      console.error("Error creating profile:", error);
      res.status(500).json({ message: "Failed to create profile" });
    }
  });

  app.get("/api/categories", async (_req, res) => {
    try {
      const cats = await storage.getCategories();
      res.json(cats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get categories" });
    }
  });

  app.get("/api/products", async (req, res) => {
    try {
      const categoryId = req.query.category as string | undefined;
      const prods = await storage.getProducts(categoryId === "all" ? undefined : categoryId);
      res.json(prods);
    } catch (error) {
      res.status(500).json({ message: "Failed to get products" });
    }
  });

  app.get("/api/marketplace/products", async (req, res) => {
    try {
      const categoryId = req.query.category as string | undefined;
      const search = req.query.search as string | undefined;
      const supplierId = req.query.supplier as string | undefined;
      const prods = await storage.getMarketplaceProducts(
        categoryId === "all" ? undefined : categoryId,
        search || undefined,
        supplierId || undefined
      );
      res.json(prods);
    } catch (error) {
      res.status(500).json({ message: "Failed to get marketplace products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProductById(req.params.id);
      if (!product) return res.status(404).json({ message: "Product not found" });
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to get product" });
    }
  });

  app.get("/api/my-products", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const prods = await storage.getProductsBySupplier(userId);
      res.json(prods);
    } catch (error) {
      res.status(500).json({ message: "Failed to get products" });
    }
  });

  app.post("/api/products", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = productCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }
      const userId = req.user.claims.sub;
      const profile = await storage.getProfileByUserId(userId);
      if (!profile || profile.role !== "supplier") {
        return res.status(403).json({ message: "Only suppliers can create products" });
      }
      const product = await storage.createProduct({
        ...parsed.data,
        supplierId: userId,
        currency: profile.currency || "XOF",
      });
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.patch("/api/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = productUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }
      const userId = req.user.claims.sub;
      const existing = await storage.getProductById(req.params.id);
      if (!existing || existing.supplierId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const product = await storage.updateProduct(req.params.id, parsed.data);
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.get("/api/cart", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const items = await storage.getCartItems(userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to get cart" });
    }
  });

  app.post("/api/cart", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = cartAddSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }
      const userId = req.user.claims.sub;
      const product = await storage.getProductById(parsed.data.productId);
      if (!product) return res.status(404).json({ message: "Product not found" });
      if (product.stock !== null && product.stock <= 0) {
        return res.status(400).json({ message: "Product out of stock" });
      }
      const item = await storage.addToCart({ userId, productId: parsed.data.productId, quantity: parsed.data.quantity });
      res.status(201).json(item);
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ message: "Failed to add to cart" });
    }
  });

  app.patch("/api/cart/:id", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = cartUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data" });
      }
      const item = await storage.updateCartItem(req.params.id, parsed.data.quantity);
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", isAuthenticated, async (req: any, res) => {
    try {
      await storage.removeCartItem(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove cart item" });
    }
  });

  app.get("/api/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ message: "Profile not found" });

      const ordersData = profile.role === "supplier"
        ? await storage.getOrdersBySupplier(userId)
        : await storage.getOrdersByBuyer(userId);
      res.json(ordersData);
    } catch (error) {
      res.status(500).json({ message: "Failed to get orders" });
    }
  });

  app.get("/api/orders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const order = await storage.getOrder(req.params.id);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check authorization
      if (order.buyerId !== userId && order.supplierId !== userId) {
        return res.status(403).json({ message: "Not authorized to view this order" });
      }

      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to get order details" });
    }
  });

  app.post("/api/orders/checkout", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = checkoutSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }
      const userId = req.user.claims.sub;
      const profile = await storage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ message: "Profile not found" });
      if (profile.role !== "shop_owner") {
        return res.status(403).json({ message: "Only shop owners can place orders" });
      }

      const cartItemsData = await storage.getCartItems(userId);
      if (cartItemsData.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      const { contactName, deliveryPhone, deliveryAddress, deliveryCity, paymentMethod, notes } = parsed.data;

      const ordersBySupplier: Record<string, typeof cartItemsData> = {};
      for (const item of cartItemsData) {
        const sid = item.product.supplierId;
        if (!ordersBySupplier[sid]) ordersBySupplier[sid] = [];
        ordersBySupplier[sid].push(item);
      }

      const createdOrders = [];
      for (const [supplierId, items] of Object.entries(ordersBySupplier)) {
        const totalAmount = items.reduce(
          (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
          0
        );

        const order = await storage.createOrder({
          buyerId: userId,
          supplierId,
          totalAmount: totalAmount.toFixed(2),
          currency: profile.currency || "XOF",
          contactName: contactName || "",
          deliveryPhone: deliveryPhone || profile.phone || "",
          deliveryAddress: deliveryAddress || profile.address || "",
          deliveryCity: deliveryCity || profile.city || "",
          paymentMethod: paymentMethod || "mobile_money",
          notes: notes || "",
          status: "pending",
        });

        for (const item of items) {
          await storage.createOrderItem({
            orderId: order.id,
            productId: item.productId,
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: item.product.price,
            totalPrice: (parseFloat(item.product.price) * item.quantity).toFixed(2),
          });
        }

        createdOrders.push(order);
      }

      await storage.clearCart(userId);

      res.status(201).json(createdOrders);
    } catch (error) {
      console.error("Checkout error:", error);
      res.status(500).json({ message: "Failed to checkout" });
    }
  });

  app.patch("/api/orders/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = statusUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const userId = req.user.claims.sub;
      const profile = await storage.getProfileByUserId(userId);
      if (!profile || profile.role !== "supplier") {
        return res.status(403).json({ message: "Only suppliers can update order status" });
      }
      const order = await storage.updateOrderStatus(req.params.id, parsed.data.status);
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  app.get("/api/suppliers", async (_req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get suppliers" });
    }
  });

  app.get("/api/suppliers/:id", async (req, res) => {
    try {
      const profile = await storage.getProfileByUserId(req.params.id);
      if (!profile) return res.status(404).json({ message: "Supplier not found" });
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to get supplier" });
    }
  });

  app.get("/api/boosts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getProfileByUserId(userId);
      if (!profile || profile.role !== "supplier") {
        return res.status(403).json({ message: "Only suppliers can view boosts" });
      }
      const boosts = await storage.getBoostsBySupplier(userId);
      res.json(boosts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get boosts" });
    }
  });

  const BOOST_PRICES: Record<string, Record<string, number>> = {
    standard: { "7": 5000, "14": 8500, "30": 15000 },
    premium: { "7": 10000, "14": 17000, "30": 30000 },
  };

  app.get("/api/wallet", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getProfileByUserId(userId);
      if (!profile || profile.role !== "supplier") {
        return res.status(403).json({ message: "Only suppliers can access wallet" });
      }
      const balance = await storage.getWalletBalance(userId);
      const transactions = await storage.getWalletTransactions(userId);
      res.json({ balance, transactions });
    } catch (error) {
      res.status(500).json({ message: "Failed to get wallet" });
    }
  });

  app.post("/api/wallet/topup", isAuthenticated, async (req: any, res) => {
    try {
      const topupSchema = z.object({
        amount: z.number().min(1000).max(1000000),
      });
      const parsed = topupSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Montant invalide (min 1 000 FCFA)", errors: parsed.error.flatten() });
      }

      const userId = req.user.claims.sub;
      const profile = await storage.getProfileByUserId(userId);
      if (!profile || profile.role !== "supplier") {
        return res.status(403).json({ message: "Only suppliers can top up wallet" });
      }

      const tx = await storage.topUpWallet(userId, parsed.data.amount, `Recharge de ${parsed.data.amount.toLocaleString("fr-FR")} FCFA`);
      const newBalance = await storage.getWalletBalance(userId);
      res.status(201).json({ transaction: tx, balance: newBalance });
    } catch (error) {
      res.status(500).json({ message: "Failed to top up wallet" });
    }
  });

  app.post("/api/boosts", isAuthenticated, async (req: any, res) => {
    try {
      const schema = z.object({
        productId: z.string().min(1),
        boostLevel: z.enum(["standard", "premium"]),
        durationDays: z.number().int().min(1).max(90),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }

      const userId = req.user.claims.sub;
      const profile = await storage.getProfileByUserId(userId);
      if (!profile || profile.role !== "supplier") {
        return res.status(403).json({ message: "Only suppliers can create boosts" });
      }

      const product = await storage.getProductById(parsed.data.productId);
      if (!product || product.supplierId !== userId) {
        return res.status(403).json({ message: "Not authorized to boost this product" });
      }

      const existing = await storage.getActiveBoostForProduct(parsed.data.productId);
      if (existing) {
        return res.status(400).json({ message: "Product already has an active boost" });
      }

      const durationKey = String(parsed.data.durationDays);
      const price = BOOST_PRICES[parsed.data.boostLevel]?.[durationKey];
      if (!price) {
        return res.status(400).json({ message: "Invalid boost level or duration combination" });
      }

      const walletTx = await storage.chargeWalletForBoost(
        userId,
        price,
        "",
        `Boost ${parsed.data.boostLevel} - ${product.name} (${parsed.data.durationDays}j)`
      );

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parsed.data.durationDays);

      const boost = await storage.createBoost({
        productId: parsed.data.productId,
        supplierId: userId,
        boostLevel: parsed.data.boostLevel,
        status: "active",
        startDate,
        endDate,
      });

      const newBalance = await storage.getWalletBalance(userId);
      res.status(201).json({ ...boost, newBalance });
    } catch (error: any) {
      console.error("Error creating boost:", error);
      if (error.message === "Solde insuffisant") {
        return res.status(400).json({ message: "Solde insuffisant", code: "INSUFFICIENT_BALANCE" });
      }
      res.status(500).json({ message: "Failed to create boost" });
    }
  });

  app.patch("/api/boosts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const schema = z.object({
        status: z.enum(["active", "paused", "expired"]).optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data" });
      }

      const userId = req.user.claims.sub;
      const profile = await storage.getProfileByUserId(userId);
      if (!profile || profile.role !== "supplier") {
        return res.status(403).json({ message: "Only suppliers can update boosts" });
      }

      const boost = await storage.updateBoost(req.params.id, {
        status: parsed.data.status,
      });
      if (!boost) return res.status(404).json({ message: "Boost not found" });
      res.json(boost);
    } catch (error) {
      res.status(500).json({ message: "Failed to update boost" });
    }
  });

  app.get("/api/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getProfileByUserId(userId);
      if (!profile) return res.json({ totalOrders: 0, pendingOrders: 0, totalProducts: 0, totalRevenue: "0" });
      const stats = await storage.getStats(userId, profile.role);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  return httpServer;
}
