import type { Express } from "express";
import { storage } from "../storage";
import { requireAdmin } from "../auth";

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
}
