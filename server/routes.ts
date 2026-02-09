import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { z } from "zod";
import { insertUserProfileSchema, insertProductSchema } from "@shared/schema";

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
  deliveryAddress: z.string().optional(),
  deliveryCity: z.string().min(1, "Ville requise"),
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

      const { deliveryAddress, deliveryCity, notes } = parsed.data;

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
          deliveryAddress: deliveryAddress || profile.address || "",
          deliveryCity: deliveryCity || profile.city || "",
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
