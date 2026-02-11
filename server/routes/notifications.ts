import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth/supabaseAuth";
import { AuthenticatedRequest } from "../types";

export async function registerNotificationRoutes(app: Express) {
    app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
        try {
            const userId = (req as AuthenticatedRequest).user.claims.sub;
            const notifications = await storage.getNotifications(userId);
            res.json(notifications);
        } catch (error) {
            console.error("Error fetching notifications:", error);
            res.status(500).json({ message: "Failed to fetch notifications" });
        }
    });

    app.patch("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
        try {
            const { id } = req.params;
            const notifications = await storage.getNotifications((req as AuthenticatedRequest).user.claims.sub);
            const exists = notifications.find(n => n.id === id);

            if (!exists) {
                return res.status(404).json({ message: "Notification not found" });
            }

            const updated = await storage.markNotificationAsRead(id);
            res.json(updated);
        } catch (error) {
            console.error("Error updating notification:", error);
            res.status(500).json({ message: "Failed to update notification" });
        }
    });

    app.patch("/api/notifications/read-all", isAuthenticated, async (req: any, res) => {
        try {
            const userId = (req as AuthenticatedRequest).user.claims.sub;
            await storage.markAllNotificationsAsRead(userId);
            res.sendStatus(200);
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
            res.status(500).json({ message: "Failed to mark all as read" });
        }
    });
}
