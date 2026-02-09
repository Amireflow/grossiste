import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Search, Package, Store, ArrowRight, X, MapPin, ShoppingCart,
  ChevronDown, Shield, Truck, Users, TrendingUp,
  ArrowUpDown, Plus, Minus, CheckCircle, Filter, Zap, Star,
} from "lucide-react";
import { formatPrice } from "@/lib/constants";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Product, Category, UserProfile } from "@shared/schema";
import { Link, useSearch } from "wouter";

type MarketplaceProduct = Product & { supplierName: string; supplierCity: string | null; isSponsored?: boolean; boostLevel?: string | null };

interface Supplier {
  id: string;
  businessName: string;
  city: string | null;
  country: string | null;
  description: string | null;
  productCount: number;
}

type SortOption = "newest" | "price_asc" | "price_desc" | "name_asc";

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Plus récents",
  price_asc: "Prix croissant",
  price_desc: "Prix décroissant",
  name_asc: "Nom A-Z",
};

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const supplierFilterFromUrl = urlParams.get("supplier") || undefined;
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all");
  const supplierFilter = selectedSupplier !== "all" ? selectedSupplier : supplierFilterFromUrl;
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: categories } = useQuery<Category[]>({ queryKey: ["/api/categories"] });
  const { data: suppliers } = useQuery<Supplier[]>({ queryKey: ["/api/suppliers"] });

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  const marketplaceUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (search) params.set("search", search);
    if (supplierFilter) params.set("supplier", supplierFilter);
    const qs = params.toString();
    return `/api/marketplace/products${qs ? `?${qs}` : ""}`;
  }, [selectedCategory, search, supplierFilter]);

  const { data: products, isLoading } = useQuery<MarketplaceProduct[]>({
    queryKey: [marketplaceUrl],
  });

  const addToCart = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const res = await apiRequest("POST", "/api/cart", { productId, quantity });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Produit ajouté",
        description: "Le produit a été ajouté à votre panier",
      });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'ajouter au panier", variant: "destructive" });
    },
  });

  const isShopOwner = !!user && profile?.role === "shop_owner";

  const sortedProducts = useMemo(() => {
    if (!products) return [];
    const sorted = [...products];
    switch (sortBy) {
      case "price_asc":
        return sorted.sort((a, b) => parseFloat(String(a.price)) - parseFloat(String(b.price)));
      case "price_desc":
        return sorted.sort((a, b) => parseFloat(String(b.price)) - parseFloat(String(a.price)));
      case "name_asc":
        return sorted.sort((a, b) => a.name.localeCompare(b.name, "fr"));
      default:
        return sorted;
    }
  }, [products, sortBy]);

  const categoryCounts = useMemo(() => {
    if (!products || selectedCategory !== "all") return {};
    const counts: Record<string, number> = {};
    products.forEach(p => {
      if (p.categoryId) {
        counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
      }
    });
    return counts;
  }, [products, selectedCategory]);

  const allProductsUrl = "/api/marketplace/products";
  const { data: allProducts } = useQuery<MarketplaceProduct[]>({
    queryKey: [allProductsUrl],
    enabled: selectedCategory !== "all" || !!search,
  });
  const globalCategoryCounts = useMemo(() => {
    const source = (selectedCategory !== "all" || search) ? allProducts : products;
    if (!source) return {};
    const counts: Record<string, number> = {};
    source.forEach(p => {
      if (p.categoryId) {
        counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
      }
    });
    return counts;
  }, [allProducts, products, selectedCategory, search]);

  const supplierName = supplierFilter && products && products.length > 0
    ? products[0].supplierName
    : null;

  const supplierCount = useMemo(() => {
    if (!products) return 0;
    return new Set(products.map(p => p.supplierId)).size;
  }, [products]);

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
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
                <div className="flex items-center gap-2">
                  {isShopOwner && (
                    <Link href="/cart">
                      <Button variant="outline" size="icon" data-testid="button-marketplace-cart">
                        <ShoppingCart className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                  <Link href="/">
                    <Button variant="outline" size="sm" data-testid="button-back-dashboard">
                      Mon espace
                    </Button>
                  </Link>
                </div>
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
        <div className="relative bg-card border-b overflow-hidden">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div className="flex-1">
                <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold mb-2" data-testid="text-marketplace-title">
                  Marketplace B2B
                </h1>
                <p className="text-muted-foreground mb-6 max-w-2xl text-sm sm:text-base">
                  Parcourez le catalogue de nos fournisseurs vérifiés. Trouvez les meilleurs prix de gros pour votre commerce.
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
              <div className="flex items-center gap-4 sm:gap-6 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1.5" data-testid="text-stat-products">
                  <Package className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">{products?.length || 0}</span> produits
                </span>
                <span className="flex items-center gap-1.5" data-testid="text-stat-suppliers">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">{supplierCount}</span> fournisseurs
                </span>
                <span className="flex items-center gap-1.5" data-testid="text-stat-categories">
                  <Filter className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">{categories?.length || 0}</span> catégories
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {categories && categories.length > 0 && !search && (
            <div className="mb-6">
              <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className="shrink-0 flex flex-col items-center gap-1.5 cursor-pointer"
                  data-testid="button-category-all"
                >
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden border-2 transition-colors ${selectedCategory === "all" ? "border-primary" : "border-transparent"}`}>
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Package className="w-6 h-6 sm:w-7 sm:h-7 text-muted-foreground" />
                    </div>
                  </div>
                  <span className={`text-[10px] sm:text-xs leading-tight text-center max-w-[68px] sm:max-w-[84px] line-clamp-2 ${selectedCategory === "all" ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                    Tout
                  </span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className="shrink-0 flex flex-col items-center gap-1.5 cursor-pointer"
                    data-testid={`button-category-${cat.slug}`}
                  >
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden border-2 transition-colors ${selectedCategory === cat.id ? "border-primary" : "border-transparent"}`}>
                      {cat.imageUrl ? (
                        <img src={cat.imageUrl} alt={cat.nameFr} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-muted" />
                      )}
                    </div>
                    <span className={`text-[10px] sm:text-xs leading-tight text-center max-w-[68px] sm:max-w-[84px] line-clamp-2 ${selectedCategory === cat.id ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                      {cat.nameFr}
                      {globalCategoryCounts[cat.id] !== undefined && (
                        <span className="text-muted-foreground ml-0.5">({globalCategoryCounts[cat.id]})</span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {supplierFilter && (
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSupplier("all")}
                data-testid="button-back-all-suppliers"
              >
                <ChevronDown className="w-3.5 h-3.5 mr-1.5 rotate-90" />
                Tous les fournisseurs
              </Button>
              <Badge variant="secondary" className="text-xs gap-1.5 pr-1">
                <Store className="w-3 h-3" />
                {supplierName || "Fournisseur"}
                <Button
                  size="icon"
                  variant="ghost"
                  className="no-default-hover-elevate ml-0.5"
                  onClick={() => setSelectedSupplier("all")}
                  data-testid="button-clear-supplier-filter"
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
                {sortedProducts.length > 0 && ` (${sortedProducts.length} produit${sortedProducts.length !== 1 ? "s" : ""})`}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <p className="text-sm text-muted-foreground" data-testid="text-marketplace-count">
              {sortedProducts.length > 0
                ? `${sortedProducts.length} produit${sortedProducts.length !== 1 ? "s" : ""} disponible${sortedProducts.length !== 1 ? "s" : ""}`
                : isLoading ? "Chargement..." : "Aucun produit"}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger className="w-[200px]" data-testid="select-marketplace-supplier">
                  <Store className="w-3.5 h-3.5 mr-2 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Tous les fournisseurs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les fournisseurs</SelectItem>
                  {suppliers?.map((s) => (
                    <SelectItem key={s.id} value={s.id} data-testid={`option-supplier-${s.id}`}>
                      {s.businessName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[170px]" data-testid="select-marketplace-sort">
                  <ArrowUpDown className="w-3.5 h-3.5 mr-2 text-muted-foreground shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SORT_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Card key={i}>
                  <CardContent className="p-3 sm:p-4">
                    <Skeleton className="w-full aspect-square rounded-md mb-3" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2 mb-2" />
                    <Skeleton className="h-3 w-2/3 mb-3" />
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sortedProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 animate-fade-in">
              {sortedProducts.map((product) => (
                <MarketplaceProductCard
                  key={product.id}
                  product={product}
                  isShopOwner={isShopOwner}
                  isLoggedIn={!!user}
                  onAddToCart={(qty) => addToCart.mutate({ productId: product.id, quantity: qty })}
                  isAdding={addToCart.isPending}
                  categories={categories}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Package className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg mb-2">Aucun produit trouvé</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {search
                  ? "Essayez avec d'autres termes de recherche"
                  : "Les fournisseurs ajouteront bientôt leurs produits"}
              </p>
              {(search || selectedCategory !== "all" || supplierFilter) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => { setSearch(""); setSelectedCategory("all"); setSelectedSupplier("all"); }}
                  data-testid="button-marketplace-reset-filters"
                >
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          )}

          <div className="mt-16 grid sm:grid-cols-3 gap-6 py-10 border-t">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-medium text-sm mb-1" data-testid="text-trust-verified">Fournisseurs vérifiés</h4>
              <p className="text-xs text-muted-foreground">Tous nos partenaires sont vérifiés et fiables</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-3">
                <Truck className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-medium text-sm mb-1" data-testid="text-trust-delivery">Livraison rapide</h4>
              <p className="text-xs text-muted-foreground">Réseau de livreurs dans toute l'Afrique de l'Ouest</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-medium text-sm mb-1" data-testid="text-trust-prices">Meilleurs prix de gros</h4>
              <p className="text-xs text-muted-foreground">Comparez et économisez sur vos approvisionnements</p>
            </div>
          </div>

          {!user && products && products.length > 0 && (
            <div className="mt-6 rounded-md bg-card border p-8 sm:p-10 text-center">
              <h3 className="font-serif text-xl sm:text-2xl font-bold mb-3" data-testid="text-marketplace-cta-title">
                Prêt à passer commande ?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
                Créez votre compte gratuitement pour commander directement auprès des fournisseurs aux meilleurs prix de gros.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <a href="/api/login">
                  <Button size="lg" data-testid="button-marketplace-cta">
                    Créer mon compte
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </a>
                <Link href="/">
                  <Button size="lg" variant="outline" data-testid="button-marketplace-learn-more">
                    En savoir plus
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <Store className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="font-serif text-lg font-bold">SokoB2B</span>
            </div>
            <p className="text-xs text-muted-foreground" data-testid="text-marketplace-footer">
              &copy; 2026 SokoB2B. Marketplace B2B pour l'Afrique de l'Ouest.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function MarketplaceProductCard({
  product,
  isShopOwner,
  isLoggedIn,
  onAddToCart,
  isAdding,
  categories,
}: {
  product: MarketplaceProduct;
  isShopOwner: boolean;
  isLoggedIn: boolean;
  onAddToCart: (qty: number) => void;
  isAdding: boolean;
  categories?: Category[];
}) {
  const [qty, setQty] = useState(product.minOrder || 1);
  const [justAdded, setJustAdded] = useState(false);
  const isOutOfStock = product.stock !== null && product.stock !== undefined && product.stock <= 0;
  const categoryName = categories?.find(c => c.id === product.categoryId)?.nameFr;

  const handleAdd = () => {
    onAddToCart(qty);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <Card className={`overflow-visible group transition-all ${product.isSponsored && product.boostLevel === "premium" ? "border-amber-400 dark:border-amber-600" : ""}`} data-testid={`card-marketplace-product-${product.id}`}>
      <CardContent className="p-3 sm:p-4">
        <div className="relative w-full aspect-square rounded-md overflow-hidden mb-3 bg-muted">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Package className="w-10 h-10 text-muted-foreground/50" />
            </div>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">Rupture</Badge>
            </div>
          )}
          {product.stock && product.stock > 0 && product.stock <= 10 && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                {product.stock} en stock
              </Badge>
            </div>
          )}
          {product.isSponsored ? (
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              <Badge className="text-[10px] bg-amber-500 text-white border-0 gap-1" data-testid={`badge-sponsored-${product.id}`}>
                {product.boostLevel === "premium" ? <Star className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                Sponsorise
              </Badge>
              {categoryName && (
                <Badge variant="secondary" className="text-[10px] bg-black/70 text-white border-0">
                  {categoryName}
                </Badge>
              )}
            </div>
          ) : categoryName ? (
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="text-[10px] bg-black/70 text-white border-0">
                {categoryName}
              </Badge>
            </div>
          ) : null}
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
          <span className="font-bold text-primary text-sm tabular-nums" data-testid={`text-marketplace-price-${product.id}`}>
            {formatPrice(product.price, product.currency || "XOF")}
          </span>
          <span className="text-[11px] text-muted-foreground">/ {product.unit}</span>
        </div>

        {product.minOrder && product.minOrder > 1 && (
          <p className="text-[11px] text-muted-foreground mb-2">
            Min. {product.minOrder} {product.unit}
          </p>
        )}

        {isShopOwner ? (
          isOutOfStock ? (
            <Button variant="secondary" size="sm" className="w-full" disabled data-testid={`button-unavailable-${product.id}`}>
              Indisponible
            </Button>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center border rounded-md shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="no-default-hover-elevate"
                  onClick={() => setQty(Math.max(product.minOrder || 1, qty - 1))}
                  data-testid={`button-qty-minus-${product.id}`}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="text-xs w-6 text-center tabular-nums" data-testid={`text-qty-${product.id}`}>{qty}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="no-default-hover-elevate"
                  onClick={() => setQty(qty + 1)}
                  data-testid={`button-qty-plus-${product.id}`}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <Button
                size="sm"
                className="flex-1 text-xs"
                onClick={handleAdd}
                disabled={isAdding}
                data-testid={`button-add-cart-${product.id}`}
              >
                {justAdded ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    Ajoute
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                    Ajouter
                  </>
                )}
              </Button>
            </div>
          )
        ) : isLoggedIn ? (
          <Button variant="outline" size="sm" className="w-full text-xs" disabled data-testid={`button-supplier-view-${product.id}`}>
            <Package className="w-3.5 h-3.5 mr-1" />
            Voir le produit
          </Button>
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
