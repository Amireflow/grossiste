import type { Express, RequestHandler, Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { supabaseAdmin } from "./supabaseClient";
import { db } from "../db";
import { users } from "@shared/models/auth";
import { users } from "@shared/models/auth";
import { userProfiles } from "@shared/schema";
import { eq } from "drizzle-orm";

// Extend Express Request to include user
declare global {
    namespace Express {
        interface User {
            claims: {
                sub: string;
                email?: string;
            };
        }
    }
}

export function getSession() {
    const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
    const pgStore = connectPg(session);
    const sessionStore = new pgStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: true,
        ttl: sessionTtl,
        tableName: "sessions",
    });

    return session({
        secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: sessionTtl,
        },
    });
}

async function upsertUser(userData: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
}) {
    const [user] = await db
        .insert(users)
        .values({
            id: userData.id,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
        })
        .onConflictDoUpdate({
            target: users.id,
            set: {
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                updatedAt: new Date(),
            },
        })
        .returning();
    return user;
}

export async function setupAuth(app: Express) {
    app.set("trust proxy", 1);
    app.use(getSession());
}

export function registerAuthRoutes(app: Express) {
    // Register new user
    app.post("/api/auth/register", async (req: Request, res: Response) => {
        try {
            const { email, password, firstName, lastName } = req.body;

            if (!email || !password) {
                return res.status(400).json({ message: "Email et mot de passe requis" });
            }

            const { data, error } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { firstName, lastName },
            });

            if (error) {
                console.error("Registration error:", error);
                if (error.message.includes("already")) {
                    return res.status(400).json({ message: "Cet email est déjà utilisé" });
                }
                return res.status(400).json({ message: error.message });
            }

            // Create user in our database
            await upsertUser({
                id: data.user.id,
                email: data.user.email,
                firstName,
                lastName,
            });

            // Sign in the user to get session
            const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError || !signInData.session) {
                return res.status(201).json({ message: "Compte créé. Veuillez vous connecter." });
            }

            // Store in session
            (req.session as any).user = {
                claims: {
                    sub: data.user.id,
                    email: data.user.email,
                },
                accessToken: signInData.session.access_token,
                refreshToken: signInData.session.refresh_token,
            };

            res.status(201).json({
                user: { id: data.user.id, email: data.user.email, firstName, lastName }
            });
        } catch (error) {
            console.error("Registration error:", error);
            res.status(500).json({ message: "Erreur lors de l'inscription" });
        }
    });

    // Login
    app.post("/api/auth/login", async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ message: "Email et mot de passe requis" });
            }

            const { data, error } = await supabaseAdmin.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error("Login error:", error);
                return res.status(401).json({ message: "Email ou mot de passe incorrect" });
            }

            // Ensure user exists in our database
            await upsertUser({
                id: data.user.id,
                email: data.user.email,
                firstName: data.user.user_metadata?.firstName,
                lastName: data.user.user_metadata?.lastName,
            });

            // Store in session
            (req.session as any).user = {
                claims: {
                    sub: data.user.id,
                    email: data.user.email,
                },
                accessToken: data.session.access_token,
                refreshToken: data.session.refresh_token,
            };

            const [dbUser] = await db.select().from(users).where(eq(users.id, data.user.id));

            res.json({ user: dbUser });
        } catch (error) {
            console.error("Login error:", error);
            res.status(500).json({ message: "Erreur lors de la connexion" });
        }
    });

    // Get current user
    app.get("/api/auth/user", async (req: Request, res: Response) => {
        const sessionUser = (req.session as any)?.user;

        if (!sessionUser?.claims?.sub) {
            return res.status(401).json({ message: "Non connecté" });
        }

        try {
            const [user] = await db.select().from(users).where(eq(users.id, sessionUser.claims.sub));

            if (!user) {
                return res.status(401).json({ message: "Utilisateur non trouvé" });
            }

            res.json(user);
        } catch (error) {
            res.status(500).json({ message: "Erreur serveur" });
        }
    });

    // Logout
    app.get("/api/logout", (req: Request, res: Response) => {
        req.session.destroy((err) => {
            if (err) {
                console.error("Logout error:", err);
            }
            res.redirect("/");
        });
    });

    app.post("/api/auth/logout", (req: Request, res: Response) => {
        req.session.destroy((err) => {
            if (err) {
                console.error("Logout error:", err);
                return res.status(500).json({ message: "Erreur lors de la déconnexion" });
            }
            res.json({ success: true });
        });
    });
}

export const isAuthenticated: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const sessionUser = (req.session as any)?.user;

    if (!sessionUser?.claims?.sub) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    // Attach user to request for route handlers
    (req as any).user = sessionUser;

    next();
};

export const requireAdmin: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const sessionUser = (req.session as any)?.user;

    if (!sessionUser?.claims?.sub) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        console.log("Checking admin access for user:", sessionUser.claims.sub);
        const [profile] = await db
            .select()
            .from(userProfiles)
            .where(eq(userProfiles.userId, sessionUser.claims.sub));

        console.log("Found profile:", profile ? `Role: ${profile.role}` : "No profile found");

        if (!profile || profile.role !== "admin") {
            console.log("Access denied: User is not admin");
            return res.status(403).json({ message: "Admin access required" });
        }

        // Attach user and profile to request
        (req as any).user = sessionUser;
        (req as any).userProfile = profile;

        next();
    } catch (error) {
        console.error("Admin check error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
