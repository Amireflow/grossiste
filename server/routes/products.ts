import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import type { AuthenticatedRequest } from "../types";

export function registerProductRoutes(app: Express) {
    const productCreateSchema = z.object({
        name: z.string().min(2),
        description: z.string().optional(),
        categoryId: z.string().min(1),
        price: z.string().min(1),
        unit: z.string().min(1),
        minOrder: z.coerce.number().int().min(1).optional(),
        stock: z.coerce.number().int().min(0).optional(),
        imageUrl: z.string().optional(),
        images: z.string().optional(),
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
        images: z.string().optional(),
        isActive: z.boolean().optional(),
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
            const supplierProfile = await storage.getProfileByUserId(product.supplierId);
            res.json({
                ...product,
                supplierName: supplierProfile?.businessName || "Fournisseur",
                supplierCity: supplierProfile?.city || null,
                supplierCountry: supplierProfile?.country || null,
                supplierDescription: supplierProfile?.description || null,
            });
        } catch (error) {
            res.status(500).json({ message: "Failed to get product" });
        }
    });

    app.get("/api/my-products", isAuthenticated, async (req: any, res) => {
        try {
            const userId = (req as AuthenticatedRequest).user.claims.sub;
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
            const userId = (req as AuthenticatedRequest).user.claims.sub;
            const profile = await storage.getProfileByUserId(userId);
            if (!profile || profile.role !== "supplier") {
                return res.status(403).json({ message: "Only suppliers can create products" });
            }

            // Check subscription limits
            const subscription = await storage.getActiveSubscription(userId);
            const productCount = await storage.getSupplierProductCount(userId);

            // Default limit if no subscription (e.g., 0 or small free tier? Let's assume 0 or requiring sub)
            // If we want a free tier, we should have a default plan or logic. 
            // For now, let's assume they need a subscription OR there is a default free limit.
            // Based on seed, "Standard" is paid. Detailed requirement validation:
            // "Standard: 20 products". Is there a free tier? 
            // The prompt implies "allow suppliers to subscribe... instead of paying per transaction".
            // If they don't have a sub, maybe they fall back to pay-per-transaction?
            // But user said "Remove commission logic". 
            // Let's enforce: MUST have active subscription to add products beyond X? Or just strict limit?
            // Let's start with strict: If no sub => limit 0 (or strictly 5 for free?).
            // Let's assume "Active Subscription" is required for ANY product if we moved away from pay-per-transaction.
            // But wait, the previous system was pay-per-transaction.
            // If we strictly block without sub, we might break existing flow if they aren't migrated.
            // Safe bet: If no active subscription, limit is 0 (must subscribe).
            // OR: If plan has maxProducts, enforce it.

            let maxProducts = 0;
            if (subscription && subscription.plan.maxProducts !== null) {
                maxProducts = subscription.plan.maxProducts;
            } else if (subscription && subscription.plan.maxProducts === null) {
                maxProducts = Infinity;
            }

            if (!subscription) {
                return res.status(403).json({ message: "Vous devez avoir un abonnement actif pour ajouter des produits." });
            }

            if (productCount >= maxProducts) {
                return res.status(403).json({
                    message: `Limite de produits atteinte (${maxProducts}). Mettez à niveau votre abonnement pour en ajouter plus.`
                });
            }

            const product = await storage.createProduct({
                ...parsed.data,
                supplierId: userId,
                currency: profile.currency || "XOF",
                status: "pending",
                isActive: true, // Auto-active, verification is post-hoc
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
            const userId = (req as AuthenticatedRequest).user.claims.sub;
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
}
