import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { Store, ShoppingCart, ChevronRight } from "lucide-react";
import type { UserProfile, CartItem } from "@shared/schema";

export function MarketplaceNavbar() {
    const { user } = useAuth();
    const [location] = useLocation();

    const { data: profile } = useQuery<UserProfile>({
        queryKey: ["/api/profile"],
        enabled: !!user,
    });

    const isShopOwner = !!user && profile?.role === "shop_owner";

    const { data: cartItems } = useQuery<CartItem[]>({
        queryKey: ["/api/cart"],
        enabled: !!user && isShopOwner,
    });

    const cartItemCount = cartItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b shadow-sm overflow-hidden">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-2 sm:gap-4 h-16 sm:h-20">
                    <Link href="/marketplace">
                        <div className="flex items-center gap-2.5 cursor-pointer" data-testid="link-marketplace-logo">
                            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                                <Store className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <span className="font-serif text-xl font-bold tracking-tight">SokoB2B</span>
                        </div>
                    </Link>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        {user ? (
                            <div className="flex items-center gap-2">
                                <NotificationsDropdown />
                                {isShopOwner && (
                                    <Link href="/cart">
                                        <Button variant="secondary" size="icon" className="rounded-full shadow-none bg-muted hover:bg-muted/80 relative" data-testid="button-marketplace-cart">
                                            <ShoppingCart className="w-4 h-4" />
                                            {cartItemCount > 0 && (
                                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-in zoom-in">
                                                    {cartItemCount > 99 ? "99+" : cartItemCount}
                                                </span>
                                            )}
                                        </Button>
                                    </Link>
                                )}
                                <a href="/">
                                    <Button size="sm" className="shadow-sm text-xs sm:text-sm" data-testid="button-back-dashboard">
                                        <span className="hidden sm:inline">Mon espace</span>
                                        <span className="sm:hidden">Espace</span>
                                        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5 sm:ml-1" />
                                    </Button>
                                </a>
                            </div>
                        ) : (
                            <>
                                <Link href="/login">
                                    <Button variant="ghost" size="sm" data-testid="button-marketplace-login">
                                        Connexion
                                    </Button>
                                </Link>
                                <Link href="/register">
                                    <Button size="sm" className="hidden sm:inline-flex" data-testid="button-marketplace-signup">
                                        Commencer
                                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
