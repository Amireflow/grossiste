import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    MapPin, Phone, Search,
    ChevronLeft, Package, CheckCircle2
} from "lucide-react";
import { useState } from "react";
import type { Product, UserProfile } from "@shared/schema";
import { MarketplaceNavbar } from "@/components/marketplace-navbar";
import { MarketplaceProductCard } from "@/pages/marketplace";
import { useAuth } from "@/hooks/use-auth";

export default function ShopPage() {
    const [, params] = useRoute("/shop/:id");
    const supplierId = params?.id;
    const [search, setSearch] = useState("");
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    // Fetch user profile to check role
    const { data: profile } = useQuery<UserProfile>({
        queryKey: ["/api/profile"],
        enabled: !!user,
    });
    // In the context of ShopPage, we want "isShopOwner" to effectively mean "Can Buy" or "Is Retailer".
    // If the user has "shop_owner" role, they can buy.
    const isShopOwner = !!user && profile?.role === "shop_owner";

    const { data: supplier, isLoading: loadingSupplier } = useQuery<UserProfile>({
        queryKey: [`/api/suppliers/${supplierId}`],
        enabled: !!supplierId,
    });

    const queryParams = new URLSearchParams();
    if (supplierId) queryParams.append("supplier", supplierId);
    if (search) queryParams.append("search", search);

    const { data: products, isLoading: loadingProducts } = useQuery<Product[]>({
        queryKey: [`/api/marketplace/products?${queryParams.toString()}`],
    });

    const addToCart = useMutation({
        mutationFn: async (data: { productId: string; quantity: number }) => {
            const res = await apiRequest("POST", "/api/cart", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
            toast({
                title: "Produit ajouté",
                description: "Le produit a été ajouté à votre panier",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Erreur",
                description: "Impossible d'ajouter le produit au panier",
                variant: "destructive",
            });
        },
    });

    if (loadingSupplier) {
        return (
            <div className="min-h-screen bg-muted/20">
                <MarketplaceNavbar />
                <div className="pt-20 p-3 md:p-4 space-y-4 max-w-7xl mx-auto">
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Skeleton className="h-48 w-full rounded-lg" />
                        <Skeleton className="h-48 w-full rounded-lg" />
                        <Skeleton className="h-48 w-full rounded-lg" />
                        <Skeleton className="h-48 w-full rounded-lg" />
                    </div>
                </div>
            </div>
        );
    }

    if (!supplier) {
        return (
            <div className="min-h-screen bg-muted/20">
                <MarketplaceNavbar />
                <div className="pt-20 p-8 text-center">
                    <h2 className="text-xl font-bold">Boutique introuvable</h2>
                    <Link href="/marketplace">
                        <Button className="mt-4">Retour au Marketplace</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/20 pb-10">
            <MarketplaceNavbar />
            <div className="pt-20">
                {/* Header Boutique */}
                <div className="bg-background border-b">
                    <div className="max-w-7xl mx-auto px-3 py-2 md:px-4 md:py-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Link href="/marketplace">
                                <Button variant="ghost" size="sm" className="-ml-2 h-7 w-7 p-0 text-muted-foreground">
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                            </Link>
                            <span className="text-xs font-medium text-muted-foreground">Retour au Marketplace</span>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary/10 border-2 border-background shadow-sm flex items-center justify-center text-primary font-bold text-xl shrink-0">
                                {supplier.businessName?.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg font-bold truncate">{supplier.businessName}</h1>
                                    <Badge variant="secondary" className="gap-0.5 bg-green-100 text-green-700 hover:bg-green-100 border-none text-[10px] px-1.5 py-0">
                                        <CheckCircle2 className="w-2.5 h-2.5" />
                                        Vérifié
                                    </Badge>
                                </div>

                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
                                    {supplier.city && (
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {supplier.city}, {supplier.country || "Bénin"}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <Package className="w-3 h-3" />
                                        {products?.length || 0} produits
                                    </div>
                                    {supplier.phone && (
                                        <div className="flex items-center gap-1">
                                            <Phone className="w-3 h-3" />
                                            {supplier.phone}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Barre de recherche interne */}
                        <div className="mt-3 relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
                            <Input
                                className="pl-8 h-9 text-sm bg-muted/50 border-none shadow-inner"
                                placeholder={`Rechercher chez ${supplier.businessName}...`}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Liste Produits */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {loadingProducts ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="h-48 w-full rounded-lg" />
                            ))}
                        </div>
                    ) : products && products.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                            {products.map((product) => (
                                <MarketplaceProductCard
                                    key={product.id}
                                    product={{ ...product, supplierName: supplier.businessName || "", supplierCity: supplier.city }}
                                    isShopOwner={isShopOwner}
                                    isLoggedIn={!!user}
                                    onAddToCart={(qty) => addToCart.mutate({ productId: product.id, quantity: qty })}
                                    isAdding={addToCart.isPending}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                                <Package className="w-6 h-6 text-muted-foreground/50" />
                            </div>
                            <h3 className="font-medium text-base">Aucun produit trouvé</h3>
                            <p className="text-muted-foreground text-xs">Ce fournisseur n'a pas encore de produits correspondant à votre recherche.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
