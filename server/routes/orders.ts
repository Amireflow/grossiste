import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import type { AuthenticatedRequest } from "../types";

export function registerOrderRoutes(app: Express) {
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

    app.get("/api/orders", isAuthenticated, async (req: any, res) => {
        try {
            const userId = (req as AuthenticatedRequest).user.claims.sub;
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
            const userId = (req as AuthenticatedRequest).user.claims.sub;
            const order = await storage.getOrder(req.params.id);

            if (!order) {
                return res.status(404).json({ message: "Order not found" });
            }

            const profile = await storage.getProfileByUserId(userId);
            const isAdmin = profile?.role === "admin";

            if (!isAdmin && order.buyerId !== userId && order.supplierId !== userId) {
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
            const userId = (req as AuthenticatedRequest).user.claims.sub;
            const profile = await storage.getProfileByUserId(userId);
            if (!profile) return res.status(404).json({ message: "Profile not found" });
            if (profile.role !== "shop_owner") {
                return res.status(403).json({ message: "Only shop owners can place orders" });
            }

            const cartItemsData = await storage.getCartItems(userId);
            if (cartItemsData.length === 0) {
                return res.status(400).json({ message: "Cart is empty" });
            }

            // Verify stock before checkout
            for (const item of cartItemsData) {
                if (item.product.stock !== null && item.product.stock < item.quantity) {
                    return res.status(400).json({
                        message: `Stock insuffisant pour "${item.product.name}" (disponible: ${item.product.stock}, demandé: ${item.quantity})`,
                    });
                }
            }

            const { contactName, deliveryPhone, deliveryAddress, deliveryCity, paymentMethod, notes } = parsed.data;

            // Execute checkout in a transaction for data integrity
            const createdOrders = await storage.checkoutTransaction(
                userId,
                cartItemsData,
                {
                    currency: profile.currency || "XOF",
                    contactName: contactName || "",
                    deliveryPhone: deliveryPhone || profile.phone || "",
                    deliveryAddress: deliveryAddress || profile.address || "",
                    deliveryCity: deliveryCity || profile.city || "",
                    paymentMethod: paymentMethod || "mobile_money",
                    notes: notes || "",
                }
            );

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
            const userId = (req as AuthenticatedRequest).user.claims.sub;
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
            const userId = (req as AuthenticatedRequest).user.claims.sub;
            const profile = await storage.getProfileByUserId(userId);
            if (!profile) return res.json({ totalOrders: 0, pendingOrders: 0, totalProducts: 0, totalRevenue: "0" });
            const stats = await storage.getStats(userId, profile.role);
            res.json(stats);
        } catch (error) {
            res.status(500).json({ message: "Failed to get stats" });
        }
    });
}
