import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Search, Package, Store, ArrowRight, X, SlidersHorizontal,
  MapPin, ShoppingCart, Grid3X3, ChevronDown, ChevronUp,
} from "lucide-react";
import { formatPrice } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";
import type { Product, Category } from "@shared/schema";
import { Link } from "wouter";

type MarketplaceProduct = Product & { supplierName: string; supplierCity: string | null };

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const { user } = useAuth();

  const { data: categories } = useQuery<Category[]>({ queryKey: ["/api/categories"] });

  const marketplaceUrl = (() => {
    const params = new URLSearchParams();
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (search) params.set("search", search);
    const qs = params.toString();
    return `/api/marketplace/products${qs ? `?${qs}` : ""}`;
  })();

  const { data: products, isLoading } = useQuery<MarketplaceProduct[]>({
    queryKey: [marketplaceUrl],
  });

  const selectedCatName = selectedCategory !== "all"
    ? categories?.find(c => c.id === selectedCategory)?.nameFr
    : null;

  const visibleCategories = showAllCategories ? categories : categories?.slice(0, 8);

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-14">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer" data-testid="link-marketplace-logo">
                <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                  <Store className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-serif text-xl font-bold">SokoB2B</span>
                <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">Marketplace</Badge>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {user ? (
                <Link href="/">
                  <Button variant="outline" size="sm" data-testid="button-back-dashboard">
                    Mon espace
                  </Button>
                </Link>
              ) : (
                <>
                  <a href="/api/login">
                    <Button variant="outline" size="sm" data-testid="button-marketplace-login">
                      Connexion
                    </Button>
                  </a>
                  <a href="/api/login" className="hidden sm:block">
                    <Button size="sm" data-testid="button-marketplace-signup">
                      Commencer
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-14">
        <div className="bg-primary/5 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold mb-2" data-testid="text-marketplace-title">
              Marketplace B2B
            </h1>
            <p className="text-muted-foreground mb-6 max-w-2xl">
              Parcourez le catalogue de produits de nos fournisseurs vérifiés. Trouvez les meilleurs prix de gros pour votre commerce.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit, une marque..."
                  className="pl-9 bg-background"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="input-marketplace-search"
                />
                {search && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-1 top-1/2 -translate-y-1/2 no-default-hover-elevate"
                    onClick={() => setSearch("")}
                    data-testid="button-clear-marketplace-search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {categories && categories.length > 0 && selectedCategory === "all" && !search && (
            <div className="mb-6">
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <Grid3X3 className="w-4 h-4 text-muted-foreground" />
                  Catégories
                </h2>
                {categories.length > 8 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllCategories(!showAllCategories)}
                    data-testid="button-toggle-categories"
                  >
                    {showAllCategories ? "Voir moins" : `Voir tout (${categories.length})`}
                    {showAllCategories ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {visibleCategories?.map((cat) => (
                  <Card
                    key={cat.id}
                    className="cursor-pointer overflow-visible hover-elevate"
                    onClick={() => setSelectedCategory(cat.id)}
                    data-testid={`card-marketplace-category-${cat.slug}`}
                  >
                    <CardContent className="p-0 relative aspect-[4/3] overflow-hidden rounded-[inherit]">
                      {cat.imageUrl ? (
                        <img src={cat.imageUrl} alt={cat.nameFr} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-muted" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-3">
                        <p className="font-medium text-sm text-white">{cat.nameFr}</p>
                        <p className="text-[11px] text-white/70 mt-0.5 line-clamp-1">{cat.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {selectedCategory !== "all" && (
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategory("all")}
                data-testid="button-back-all-categories"
              >
                <Grid3X3 className="w-3.5 h-3.5 mr-1.5" />
                Toutes les catégories
              </Button>
              <Badge variant="secondary" className="text-xs gap-1.5 pr-1">
                {selectedCatName}
                <Button
                  size="icon"
                  variant="ghost"
                  className="no-default-hover-elevate ml-0.5"
                  onClick={() => setSelectedCategory("all")}
                  data-testid="button-clear-marketplace-category"
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            </div>
          )}

          {search && (
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <p className="text-sm text-muted-foreground">
                Résultats pour "<span className="font-medium text-foreground">{search}</span>"
                {products && ` (${products.length} produit${products.length !== 1 ? "s" : ""})`}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <p className="text-sm text-muted-foreground" data-testid="text-marketplace-count">
              {products
                ? `${products.length} produit${products.length !== 1 ? "s" : ""} disponible${products.length !== 1 ? "s" : ""}`
                : "Chargement..."}
            </p>
            {selectedCategory === "all" && !search && categories && categories.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {categories.slice(0, 6).map(cat => (
                  <Button
                    key={cat.id}
                    variant="outline"
                    size="sm"
                    className="text-xs whitespace-nowrap shrink-0"
                    onClick={() => setSelectedCategory(cat.id)}
                    data-testid={`button-quick-filter-${cat.slug}`}
                  >
                    {cat.nameFr}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Card key={i}>
                  <CardContent className="p-3 sm:p-4">
                    <Skeleton className="w-full aspect-square rounded-md mb-3" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2 mb-3" />
                    <Skeleton className="h-6 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {products.map((product) => (
                <MarketplaceProductCard key={product.id} product={product} isLoggedIn={!!user} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Package className="w-7 h-7 text-muted-foreground/40" />
              </div>
              <h3 className="font-medium text-lg mb-2">Aucun produit trouvé</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {search
                  ? "Essayez avec d'autres termes de recherche"
                  : "Les fournisseurs ajouteront bientôt leurs produits"}
              </p>
              {(search || selectedCategory !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => { setSearch(""); setSelectedCategory("all"); }}
                  data-testid="button-marketplace-reset-filters"
                >
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          )}

          {!user && products && products.length > 0 && (
            <div className="mt-12 text-center py-10 border-t">
              <h3 className="font-serif text-xl sm:text-2xl font-bold mb-3">
                Prêt à passer commande ?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Créez votre compte gratuitement pour commander directement auprès des fournisseurs aux meilleurs prix de gros.
              </p>
              <a href="/api/login">
                <Button size="lg" data-testid="button-marketplace-cta">
                  Créer mon compte
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MarketplaceProductCard({ product, isLoggedIn }: { product: MarketplaceProduct; isLoggedIn: boolean }) {
  const isOutOfStock = product.stock !== null && product.stock !== undefined && product.stock <= 0;

  return (
    <Card className="overflow-visible group" data-testid={`card-marketplace-product-${product.id}`}>
      <CardContent className="p-3 sm:p-4">
        <div className="relative w-full aspect-square rounded-md overflow-hidden mb-3 bg-muted">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-10 h-10 text-muted-foreground/30" />
            </div>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400">Rupture</Badge>
            </div>
          )}
        </div>

        <h3 className="font-medium text-sm mb-0.5 line-clamp-2 leading-tight min-h-[2.5rem]" title={product.name} data-testid={`text-marketplace-product-name-${product.id}`}>
          {product.name}
        </h3>

        <div className="flex items-center gap-1.5 mb-1.5 text-muted-foreground">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="text-[11px] truncate" data-testid={`text-supplier-${product.id}`}>
            {product.supplierName}{product.supplierCity ? ` - ${product.supplierCity}` : ""}
          </span>
        </div>

        <div className="flex items-baseline gap-1.5 mb-2.5 flex-wrap">
          <span className="font-bold text-primary text-sm" data-testid={`text-marketplace-price-${product.id}`}>
            {formatPrice(product.price, product.currency || "XOF")}
          </span>
          <span className="text-xs text-muted-foreground">/ {product.unit}</span>
        </div>

        {product.minOrder && product.minOrder > 1 && (
          <p className="text-[11px] text-muted-foreground mb-2">
            Min. {product.minOrder} {product.unit}
          </p>
        )}

        {isLoggedIn ? (
          <Link href="/catalog">
            <Button variant="outline" size="sm" className="w-full text-xs" data-testid={`button-goto-catalog-${product.id}`}>
              <ShoppingCart className="w-3.5 h-3.5 mr-1" />
              Commander
            </Button>
          </Link>
        ) : (
          <a href="/api/login">
            <Button variant="outline" size="sm" className="w-full text-xs" data-testid={`button-login-to-order-${product.id}`}>
              Connexion pour commander
            </Button>
          </a>
        )}
      </CardContent>
    </Card>
  );
}
