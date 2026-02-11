import { storage } from "../storage";
import { requireAdmin } from "../auth";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { Express } from "express";

export function registerAdminRoutes(app: Express) {
    app.get("/api/admin/users", requireAdmin, async (_req, res) => {
        try {
            const users = await storage.getAllUsers();
            res.json(users);
        } catch (error) {
            console.error("Error fetching users:", error);
            res.status(500).json({ message: "Failed to fetch users" });
        }
    });

    app.get("/api/admin/users/:id", requireAdmin, async (req, res) => {
        try {
            const id = req.params.id as string;

            // Fetch basic user data
            const [user] = await db.select().from(users).where(eq(users.id, id));
            if (!user) return res.status(404).json({ message: "User not found" });

            const [
                profile,
                walletBalance,
                walletTransactions,
                ordersAsBuyer,
                ordersAsSupplier,
                products,
                activeSubscription
            ] = await Promise.all([
                storage.getProfileByUserId(id),
                storage.getWalletBalance(id),
                storage.getWalletTransactions(id),
                storage.getOrdersByBuyer(id),
                storage.getOrdersBySupplier(id),
                storage.getProductsBySupplier(id),
                storage.getActiveSubscription(id)
            ]);

            if (!profile) return res.status(404).json({ message: "Profile not found" });

            res.json({
                user,
                profile,
                wallet: {
                    balance: walletBalance,
                    transactions: walletTransactions
                },
                orders: {
                    bought: ordersAsBuyer,
                    sold: ordersAsSupplier
                },
                products,
                subscription: activeSubscription
            });
        } catch (error) {
            console.error("Error fetching user details:", error);
            res.status(500).json({ message: "Failed to fetch user details" });
        }
    });

    app.get("/api/admin/dashboard", requireAdmin, async (_req, res) => {
        try {
            const activity = await storage.getDashboardActivity();
            res.json(activity);
        } catch (error) {
            console.error("Error fetching dashboard activity:", error);
            res.status(500).json({ message: "Failed to fetch dashboard activity" });
        }
    });

    app.get("/api/admin/stats", requireAdmin, async (_req, res) => {
        try {
            const stats = await storage.getPlatformStats();
            res.json(stats);
        } catch (error) {
            console.error("Error fetching platform stats:", error);
            res.status(500).json({ message: "Failed to fetch stats" });
        }
    });

    app.get("/api/admin/products", requireAdmin, async (_req, res) => {
        try {
            const products = await storage.getAllProducts();
            res.json(products);
        } catch (error) {
            console.error("Error fetching admin products:", error);
            res.status(500).json({ message: "Failed to fetch products" });
        }
    });

    app.patch("/api/admin/products/:id", requireAdmin, async (req: any, res) => {
        try {
            const { id } = req.params;
            const { isActive } = req.body;
            const product = await storage.updateProductStatus(id, isActive);
            res.json(product);
        } catch (error) {
            console.error("Error updating product:", error);
            res.status(500).json({ message: "Failed to update product" });
        }
    });

    app.patch("/api/admin/users/:id", requireAdmin, async (req: any, res) => {
        try {
            const { id } = req.params;
            const { role } = req.body;
            const profile = await storage.updateUserRole(id, role);
            res.json(profile);
        } catch (error) {
            console.error("Error updating user role:", error);
            res.status(500).json({ message: "Failed to update user role" });
        }
    });

    app.get("/api/admin/orders", requireAdmin, async (_req, res) => {
        try {
            const orders = await storage.getAllOrders();
            res.json(orders);
        } catch (error) {
            console.error("Error fetching admin orders:", error);
            res.status(500).json({ message: "Failed to fetch orders" });
        }
    });

    app.patch("/api/admin/orders/:id", requireAdmin, async (req: any, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const order = await storage.updateOrderStatus(id, status);
            res.json(order);
        } catch (error) {
            console.error("Error updating order status:", error);
            res.status(500).json({ message: "Failed to update order status" });
        }
    });

    app.post("/api/admin/settings", requireAdmin, async (_req, res) => {
        try {
            // TODO: Implement platform_settings table for persistent storage
            res.json({ success: true, message: "Settings saved" });
        } catch (error) {
            console.error("Error saving settings:", error);
            res.status(500).json({ message: "Failed to save settings" });
        }
    });

    app.get("/api/admin/stats/charts", requireAdmin, async (_req, res) => {
        try {
            const [revenueStats, userStats] = await Promise.all([
                storage.getRevenueStats(),
                storage.getUserStats()
            ]);
            res.json({ revenueStats, userStats });
        } catch (error) {
            console.error("Error fetching chart stats:", error);
            res.status(500).json({ message: "Failed to fetch chart stats" });
        }
    });
    app.get("/api/admin/products/pending", requireAdmin, async (_req, res) => {
        try {
            const products = await storage.getPendingProducts();
            res.json(products);
        } catch (error) {
            console.error("Error fetching pending products:", error);
            res.status(500).json({ message: "Failed to fetch pending products" });
        }
    });

    app.patch("/api/admin/products/:id/moderate", requireAdmin, async (req: any, res) => {
        try {
            const { id } = req.params;
            const { status, reason } = req.body;

            if (!["active", "rejected"].includes(status)) {
                return res.status(400).json({ message: "Invalid status" });
            }

            const product = await storage.moderateProduct(id, status, reason);
            if (!product) return res.status(404).json({ message: "Product not found" });

            res.json(product);
        } catch (error) {
            console.error("Error moderating product:", error);
            res.status(500).json({ message: "Failed to moderate product" });
        }
    });

    // Finance & Subscriptions Routes

    app.get("/api/admin/subscriptions", requireAdmin, async (_req, res) => {
        try {
            const subscriptions = await storage.getAllSubscriptions();
            res.json(subscriptions);
        } catch (error) {
            console.error("Error fetching subscriptions:", error);
            res.status(500).json({ message: "Failed to fetch subscriptions" });
        }
    });

    app.get("/api/admin/transactions", requireAdmin, async (_req, res) => {
        try {
            const transactions = await storage.getAllTransactions();
            res.json(transactions);
        } catch (error) {
            console.error("Error fetching transactions:", error);
            res.status(500).json({ message: "Failed to fetch transactions" });
        }
    });

    app.post("/api/admin/users/:id/credit", requireAdmin, async (req: any, res) => {
        try {
            const { id } = req.params;
            const { amount, description } = req.body;

            if (!amount || isNaN(amount)) {
                return res.status(400).json({ message: "Invalid amount" });
            }

            const transaction = await storage.adminTopUpWallet(id, Number(amount), description || "Crédit manuel admin");
            res.json(transaction);
        } catch (error) {
            console.error("Error adding credit:", error);
            res.status(500).json({ message: "Failed to add credit" });
        }
    });

    app.post("/api/admin/users/:id/subscription", requireAdmin, async (req: any, res) => {
        try {
            const { id } = req.params;
            const { planId, durationDays } = req.body;

            if (!planId) {
                return res.status(400).json({ message: "Plan ID is required" });
            }

            const subscription = await storage.adminAssignSubscription(id, planId, durationDays ? Number(durationDays) : undefined);
            res.json(subscription);
        } catch (error) {
            console.error("Error assigning subscription:", error);
            res.status(500).json({ message: "Failed to assign subscription" });
        }
    });
}
