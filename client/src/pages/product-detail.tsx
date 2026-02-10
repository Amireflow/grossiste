import { useState, useEffect, useMemo } from "react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi,
} from "@/components/ui/carousel";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
    ArrowLeft, Package, Store, MapPin, ShoppingCart, Plus, Minus,
    CheckCircle, Zap, Star, Shield, Truck, Eye,
} from "lucide-react";
import { formatPrice } from "@/lib/constants";
import { MarketplaceNavbar } from "@/components/marketplace-navbar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Product, Category } from "@shared/schema";

type ProductDetail = Product & {
    supplierName: string;
    supplierCity: string | null;
    supplierCountry: string | null;
    supplierDescription: string | null;
    images?: string | null;
};

export default function ProductDetailPage() {
    const [, params] = useRoute("/product/:id");
    const productId = params?.id;
    const { user } = useAuth();
    const { toast } = useToast();
    const [qty, setQty] = useState(1);
    const [justAdded, setJustAdded] = useState(false);

    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [api, setApi] = useState<CarouselApi>();

    // Sync thumbnail click to carousel scroll
    useEffect(() => {
        if (!api) return;
        api.scrollTo(selectedImageIndex);
    }, [selectedImageIndex, api]);

    const { data: product, isLoading } = useQuery<ProductDetail>({
        queryKey: [`/api/products/${productId}`],
        enabled: !!productId,
    });

    useEffect(() => {
        if (product?.minOrder && product.minOrder > 1) {
            setQty(product.minOrder);
        }
    }, [product?.minOrder]);

    const { data: profile } = useQuery<{ role: string }>({
        queryKey: ["/api/profile"],
        enabled: !!user,
    });

    const { data: categories } = useQuery<Category[]>({
        queryKey: ["/api/categories"],
    });

    const isShopOwner = !!user && profile?.role === "shop_owner";
    const isOutOfStock = product?.stock !== null && product?.stock !== undefined && product?.stock <= 0;
    const categoryName = categories?.find(c => c.id === product?.categoryId)?.nameFr;

    // Parse all images
    const allImages = useMemo(() => {
        if (!product) return [];
        const imgs: string[] = [];
        if (product.imageUrl) imgs.push(product.imageUrl);
        if (product.images) {
            try {
                const parsed = JSON.parse(product.images);
                if (Array.isArray(parsed)) imgs.push(...parsed);
            } catch { }
        }
        return imgs;
    }, [product]);

    const addToCart = useMutation({
        mutationFn: async () => {
            await apiRequest("POST", "/api/cart", { productId: product!.id, quantity: qty });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
            toast({ title: "Ajouté au panier", description: `${qty} x ${product!.name}` });
            setJustAdded(true);
            setTimeout(() => setJustAdded(false), 2000);
        },
        onError: () => {
            toast({ title: "Erreur", description: "Impossible d'ajouter au panier", variant: "destructive" });
        },
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-muted/20">
                <MarketplaceNavbar />
                <div className="pt-16 sm:pt-20 max-w-4xl mx-auto px-4 py-6">
                    <Skeleton className="h-8 w-32 mb-6" />
                    <div className="grid md:grid-cols-2 gap-6">
                        <Skeleton className="aspect-square rounded-xl" />
                        <div className="space-y-4">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-8 w-1/3" />
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-muted/20">
                <MarketplaceNavbar />
                <div className="pt-16 sm:pt-20 max-w-4xl mx-auto px-4 py-20 text-center">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-lg font-semibold mb-2">Produit introuvable</h2>
                    <p className="text-sm text-muted-foreground mb-4">Ce produit n'existe pas ou a été supprimé.</p>
                    <Link href="/marketplace">
                        <Button variant="outline">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Retour au marketplace
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/20">
            <MarketplaceNavbar />
            <div className="pt-16 sm:pt-20 max-w-4xl mx-auto px-4 py-6">
                {/* Back button */}
                <Link href="/marketplace">
                    <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Retour
                    </Button>
                </Link>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Product Image Gallery */}
                    <div className="space-y-3">
                        <Carousel
                            setApi={(api) => {
                                // Sync carousel change to state
                                api?.on("select", () => {
                                    setSelectedImageIndex(api.selectedScrollSnap());
                                });
                                // Sync state change to carousel is handled by useEffect below
                            }}
                            className="w-full relative aspect-square rounded-xl overflow-hidden bg-muted"
                        >
                            <CarouselContent>
                                {allImages.length > 0 ? (
                                    allImages.map((src, index) => (
                                        <CarouselItem key={index}>
                                            <div className="w-full h-full aspect-square relative">
                                                <img
                                                    src={src}
                                                    alt={`${product.name} - Vue ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </CarouselItem>
                                    ))
                                ) : (
                                    <CarouselItem>
                                        <div className="w-full h-full aspect-square flex items-center justify-center bg-muted">
                                            {product.imageUrl ? (
                                                <img
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Package className="w-16 h-16 text-muted-foreground/30" />
                                            )}
                                        </div>
                                    </CarouselItem>
                                )}
                            </CarouselContent>

                            {/* Navigation Arrows */}
                            {allImages.length > 1 && (
                                <>
                                    <CarouselPrevious className="left-2" />
                                    <CarouselNext className="right-2" />
                                </>
                            )}

                            {isOutOfStock && (
                                <div className="absolute inset-0 bg-background/80 z-10 pointer-events-none flex items-center justify-center">
                                    <Badge variant="secondary" className="bg-red-100 text-red-800 text-sm px-4 py-1">
                                        Rupture de stock
                                    </Badge>
                                </div>
                            )}
                            {product.stock && product.stock > 0 && product.stock <= 10 && (
                                <div className="absolute top-3 right-3 z-10 pointer-events-none">
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                                        {product.stock} restant{product.stock > 1 ? "s" : ""}
                                    </Badge>
                                </div>
                            )}
                        </Carousel>

                        {/* Thumbnails */}
                        {allImages.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                {allImages.map((url, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            // Handle click via a ref or by forcing the carousel api if we had access here
                                            // Since we don't have the API reference in this scope easily without another state,
                                            // we will use the `selectedImageIndex` to trigger a useEffect that calls `api.scrollTo`.
                                            // See useEffect implementation below.
                                            setSelectedImageIndex(index);
                                        }}
                                        className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${index === selectedImageIndex
                                            ? "border-primary ring-1 ring-primary/20"
                                            : "border-border hover:border-primary/50 opacity-70 hover:opacity-100"
                                            }`}
                                    >
                                        <img src={url} alt={`Aperçu ${index + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-4">
                        {/* Category */}
                        {categoryName && (
                            <Badge variant="secondary" className="text-xs">
                                {categoryName}
                            </Badge>
                        )}

                        {/* Name */}
                        <h1 className="text-xl sm:text-2xl font-bold leading-tight">{product.name}</h1>

                        {/* Description */}
                        {product.description && (
                            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
                        )}

                        <Separator />

                        {/* Price */}
                        <div className="space-y-1">
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-primary tabular-nums">
                                    {formatPrice(product.price, product.currency || "XOF")}
                                </span>
                                <span className="text-sm text-muted-foreground">/ {product.unit}</span>
                            </div>
                            {product.minOrder && product.minOrder > 1 && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Package className="w-3 h-3" />
                                    Commande minimum : {product.minOrder} {product.unit}
                                </p>
                            )}
                        </div>

                        <Separator />

                        {/* Supplier Info */}
                        <Link href={`/shop/${product.supplierId}`}>
                            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                                <CardContent className="p-3 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                        {product.supplierName.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold truncate">{product.supplierName}</p>
                                        {product.supplierCity && (
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <MapPin className="w-3 h-3 shrink-0" />
                                                <span>{product.supplierCity}{product.supplierCountry ? `, ${product.supplierCountry}` : ""}</span>
                                            </div>
                                        )}
                                    </div>
                                    <Badge variant="outline" className="text-[10px] shrink-0">
                                        Voir boutique
                                    </Badge>
                                </CardContent>
                            </Card>
                        </Link>

                        {/* Trust Badges */}
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Shield className="w-3.5 h-3.5 text-green-600" />
                                Paiement sécurisé
                            </div>
                            <div className="flex items-center gap-1">
                                <Truck className="w-3.5 h-3.5 text-blue-600" />
                                Livraison possible
                            </div>
                        </div>

                        <Separator />

                        {/* Add to Cart */}
                        {isShopOwner ? (
                            isOutOfStock ? (
                                <Button variant="secondary" className="w-full" disabled>
                                    Indisponible
                                </Button>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-muted-foreground">Quantité :</span>
                                        <div className="flex items-center border rounded-lg">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-9 w-9"
                                                onClick={() => setQty(Math.max(product.minOrder || 1, qty - 1))}
                                            >
                                                <Minus className="w-4 h-4" />
                                            </Button>
                                            <span className="w-10 text-center text-sm tabular-nums font-medium">{qty}</span>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-9 w-9"
                                                onClick={() => setQty(qty + 1)}
                                            >
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full h-11 text-sm"
                                        onClick={() => addToCart.mutate()}
                                        disabled={addToCart.isPending}
                                    >
                                        {justAdded ? (
                                            <>
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Ajouté au panier !
                                            </>
                                        ) : (
                                            <>
                                                <ShoppingCart className="w-4 h-4 mr-2" />
                                                Ajouter au panier — {formatPrice(parseFloat(product.price) * qty, product.currency || "XOF")}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )
                        ) : !user ? (
                            <a href="/api/login">
                                <Button variant="outline" className="w-full h-11 text-sm">
                                    Connexion pour commander
                                </Button>
                            </a>
                        ) : (
                            <Button variant="outline" className="w-full h-11 text-sm" disabled>
                                <Eye className="w-4 h-4 mr-2" />
                                Voir le produit
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
