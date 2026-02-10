import { type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Redirect } from "wouter";
import type { UserProfile } from "@shared/schema";

interface AdminGuardProps {
    children: ReactNode;
}

/**
 * Protects admin routes client-side.
 * Redirects non-admin users to the dashboard.
 */
export function AdminGuard({ children }: AdminGuardProps) {
    const { data: profile, isLoading } = useQuery<UserProfile>({
        queryKey: ["/api/profile"],
    });

    if (isLoading) return null;

    if (!profile || profile.role !== "admin") {
        return <Redirect to="/" />;
    }

    return <>{children}</>;
}
