import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Store, ShoppingCart, ChevronRight, Search, X } from "lucide-react";
import type { UserProfile, CartItem } from "@shared/schema";
import { useRef } from "react";

export function MarketplaceNavbar({ onSearch, searchValue }: { onSearch?: (q: string) => void; searchValue?: string }) {
    const { user } = useAuth();
    const [location] = useLocation();
    const inputRef = useRef<HTMLInputElement>(null);

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
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b shadow-sm">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-2 sm:gap-4 h-14 sm:h-16">
                    <Link href="/marketplace">
                        <div className="flex items-center gap-2 cursor-pointer shrink-0" data-testid="link-marketplace-logo">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                                <Store className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <span className="font-serif text-lg font-bold tracking-tight hidden sm:inline">SokoB2B</span>
                        </div>
                    </Link>



                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <ThemeToggle />
                        {user ? (
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                {isShopOwner && (
                                    <Link href="/cart">
                                        <Button variant="ghost" size="icon" className="rounded-full relative h-9 w-9" data-testid="button-marketplace-cart">
                                            <ShoppingCart className="w-4 h-4" />
                                            {cartItemCount > 0 && (
                                                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm animate-in zoom-in">
                                                    {cartItemCount > 99 ? "99+" : cartItemCount}
                                                </span>
                                            )}
                                        </Button>
                                    </Link>
                                )}
                                <a href="/">
                                    <Button size="sm" className="shadow-sm text-xs sm:text-sm h-8 sm:h-9" data-testid="button-back-dashboard">
                                        <span className="hidden sm:inline">Mon espace</span>
                                        <span className="sm:hidden">Espace</span>
                                        <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                                    </Button>
                                </a>
                            </div>
                        ) : (
                            <>
                                <Link href="/login">
                                    <Button variant="ghost" size="sm" className="text-xs sm:text-sm h-8 sm:h-9" data-testid="button-marketplace-login">
                                        Connexion
                                    </Button>
                                </Link>
                                <Link href="/register">
                                    <Button size="sm" className="hidden sm:inline-flex h-8 sm:h-9 text-xs sm:text-sm" data-testid="button-marketplace-signup">
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
