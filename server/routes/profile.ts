import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import type { AuthenticatedRequest } from "../types";

export function registerProfileRoutes(app: Express) {
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

    const profileUpdateSchema = z.object({
        businessName: z.string().min(2).optional(),
        phone: z.string().min(8).optional(),
        address: z.string().optional(),
        city: z.string().min(2).optional(),
        country: z.string().min(2).optional(),
        currency: z.enum(["XOF", "XAF", "NGN", "GHS"]).optional(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
    });

    app.get("/api/profile", isAuthenticated, async (req: any, res) => {
        try {
            const userId = (req as AuthenticatedRequest).user.claims.sub;
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
            const userId = (req as AuthenticatedRequest).user.claims.sub;
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

    app.patch("/api/profile", isAuthenticated, async (req: any, res) => {
        try {
            const parsed = profileUpdateSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
            }

            const userId = (req as AuthenticatedRequest).user.claims.sub;
            const { imageUrl, ...profileData } = parsed.data;

            if (imageUrl !== undefined) {
                await storage.updateUser(userId, { profileImageUrl: imageUrl });
            }

            if (Object.keys(profileData).length > 0) {
                const profile = await storage.updateProfile(userId, profileData);
                if (!profile) {
                    return res.status(404).json({ message: "Profile not found" });
                }
                res.json(profile);
            } else {
                const profile = await storage.getProfileByUserId(userId);
                res.json(profile);
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            res.status(500).json({ message: "Failed to update profile" });
        }
    });
}
