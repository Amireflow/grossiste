import type { Request } from "express";

/**
 * Typed request for authenticated routes.
 * Replaces `req: any` throughout the codebase.
 */
export interface AuthenticatedRequest extends Request {
    user: {
        claims: {
            sub: string;         // Supabase user ID
            email?: string;
            role?: string;
        };
    };
}
