import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import type { AuthenticatedRequest } from "../types";

export function registerCartRoutes(app: Express) {
    const cartAddSchema = z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1),
    });

    const cartUpdateSchema = z.object({
        quantity: z.number().int().min(1),
    });

    app.get("/api/cart", isAuthenticated, async (req: any, res) => {
        try {
            const userId = (req as AuthenticatedRequest).user.claims.sub;
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
            const userId = (req as AuthenticatedRequest).user.claims.sub;
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
            const userId = (req as AuthenticatedRequest).user.claims.sub;
            const cartItem = await storage.getCartItemById(req.params.id);
            if (!cartItem || cartItem.userId !== userId) {
                return res.status(403).json({ message: "Not authorized" });
            }
            const item = await storage.updateCartItem(req.params.id, parsed.data.quantity);
            res.json(item);
        } catch (error) {
            res.status(500).json({ message: "Failed to update cart item" });
        }
    });

    app.delete("/api/cart/:id", isAuthenticated, async (req: any, res) => {
        try {
            const userId = (req as AuthenticatedRequest).user.claims.sub;
            const cartItem = await storage.getCartItemById(req.params.id);
            if (!cartItem || cartItem.userId !== userId) {
                return res.status(403).json({ message: "Not authorized" });
            }
            await storage.removeCartItem(req.params.id);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ message: "Failed to remove cart item" });
        }
    });
}
