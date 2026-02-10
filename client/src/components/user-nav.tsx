import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, User, Settings, CreditCard } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { UserProfile } from "@shared/schema";

export function UserNav() {
    const { user, logout } = useAuth();

    const { data: profile } = useQuery<UserProfile>({
        queryKey: ["/api/profile"],
        enabled: !!user,
    });

    const initials = user
        ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U"
        : "U";

    const isSupplier = profile?.role === "supplier";

    return (
        <Link href="/profile">
            <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-transparent">
                <Avatar className="h-10 w-10 border-none">
                    <AvatarImage src={user?.profileImageUrl || undefined} alt="Avatar" />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
            </Button>
        </Link>
    );
}
