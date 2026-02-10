import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import type { AuthenticatedRequest } from "../types";

const BOOST_PRICES: Record<string, Record<string, number>> = {
    standard: { "7": 5000, "14": 8500, "30": 15000 },
    premium: { "7": 10000, "14": 17000, "30": 30000 },
};

export function registerWalletAndBoostRoutes(app: Express) {
    // Wallet routes
    app.get("/api/wallet", isAuthenticated, async (req: any, res) => {
        try {
            const userId = (req as AuthenticatedRequest).user.claims.sub;
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

            const userId = (req as AuthenticatedRequest).user.claims.sub;
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

    // Boost routes
    app.get("/api/boosts", isAuthenticated, async (req: any, res) => {
        try {
            const userId = (req as AuthenticatedRequest).user.claims.sub;
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

            const userId = (req as AuthenticatedRequest).user.claims.sub;
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

            const userId = (req as AuthenticatedRequest).user.claims.sub;
            const profile = await storage.getProfileByUserId(userId);
            if (!profile || profile.role !== "supplier") {
                return res.status(403).json({ message: "Only suppliers can update boosts" });
            }

            const existingBoost = await storage.getBoostById(req.params.id);
            if (!existingBoost || existingBoost.supplierId !== userId) {
                return res.status(403).json({ message: "Not authorized to update this boost" });
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
}
