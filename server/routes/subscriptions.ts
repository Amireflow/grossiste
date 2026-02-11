import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import type { AuthenticatedRequest } from "../types";

export function registerSubscriptionRoutes(app: Express) {
    // Get all active subscription plans
    app.get("/api/plans", async (_req, res) => {
        try {
            const plans = await storage.getSubscriptionPlans();
            res.json(plans);
        } catch (error) {
            res.status(500).json({ message: "Failed to fetch plans" });
        }
    });

    // Get current user's active subscription
    app.get("/api/subscription", isAuthenticated, async (req: any, res) => {
        try {
            const userId = (req as AuthenticatedRequest).user.claims.sub;
            const profile = await storage.getProfileByUserId(userId);

            if (!profile || profile.role !== "supplier") {
                return res.status(403).json({ message: "Only suppliers can have subscriptions" });
            }

            const subscription = await storage.getActiveSubscription(userId);
            if (!subscription) {
                return res.json({ active: false });
            }

            res.json({ active: true, ...subscription });
        } catch (error) {
            res.status(500).json({ message: "Failed to fetch subscription" });
        }
    });

    // Subscribe to a plan
    app.post("/api/subscription", isAuthenticated, async (req: any, res) => {
        try {
            const schema = z.object({
                planId: z.string().min(1)
            });
            const parsed = schema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: "Invalid plan ID", errors: parsed.error.flatten() });
            }

            const userId = (req as AuthenticatedRequest).user.claims.sub;
            const profile = await storage.getProfileByUserId(userId);

            if (!profile || profile.role !== "supplier") {
                return res.status(403).json({ message: "Only suppliers can subscribe" });
            }

            // Check if already subscribed
            const activeSub = await storage.getActiveSubscription(userId);
            if (activeSub) {
                // For now, prevent double subscription or upgrade logic.
                // Simple version: cancel old one or wait until it expires.
                // Let's block if active.
                return res.status(400).json({ message: "Vous avez déjà un abonnement actif." });
            }

            const plans = await storage.getSubscriptionPlans();
            const plan = plans.find(p => p.id === parsed.data.planId);

            if (!plan) {
                return res.status(404).json({ message: "Plan non trouvé" });
            }

            if (!plan.isActive) {
                return res.status(400).json({ message: "Ce plan n'est plus disponible" });
            }

            const price = parseFloat(plan.price);

            // Charge wallet
            await storage.chargeWalletForSubscription(
                userId,
                price,
                plan.id,
                `Abonnement ${plan.name} (${plan.duration} jours)`
            );

            // Create subscription
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + plan.duration);

            const subscription = await storage.createSubscription({
                userId,
                planId: plan.id,
                status: "active",
                startDate,
                endDate,
                autoRenew: false
            });

            const newBalance = await storage.getWalletBalance(userId);

            res.status(201).json({
                message: "Abonnement activé avec succès",
                subscription: { ...subscription, plan },
                newBalance
            });

        } catch (error: any) {
            console.error("Subscription error:", error);

            // Handle known errors
            if (error.message === "Solde insuffisant" || (error.message && error.message.includes("Solde insuffisant"))) {
                return res.status(400).json({ message: "Votre solde est insuffisant pour souscrire à ce plan." });
            }

            // Handle DB check constraint violation (if any)
            if (error.code === '23514') { // check_violation
                return res.status(400).json({ message: "Votre solde est insuffisant." });
            }

            res.status(500).json({
                message: "Une erreur est survenue lors de l'activation. Veuillez réessayer ou contacter le support.",
                details: process.env.NODE_ENV === "development" ? error.message : undefined
            });
        }
    });
}
