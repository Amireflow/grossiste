import { useState, useMemo, useRef, type RefObject } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Search, Package, Store, ArrowRight, X, MapPin, ShoppingCart,
  ChevronRight, Shield, Truck, Users, TrendingUp,
  ArrowUpDown, Plus, Minus, CheckCircle, Zap, Star,
  ChevronLeft, Sparkles, Eye, Grid3X3,
} from "lucide-react";
import { formatPrice } from "@/lib/constants";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Product, Category, UserProfile } from "@shared/schema";
import { Link, useSearch } from "wouter";

import catAlimentation from "@assets/cat-alimentation.png";
import catBoissons from "@assets/cat-boissons.png";
import catHygiene from "@assets/cat-hygiene.png";
import catParapharmacie from "@assets/cat-parapharmacie.png";
import catBebe from "@assets/cat-bebe.png";
import catCosmetique from "@assets/cat-cosmetique.png";
import catTabac from "@assets/cat-tabac.png";
import catPapeterie from "@assets/cat-papeterie.png";
import catTelephonie from "@assets/cat-telephonie.png";
import catCondiments from "@assets/cat-condiments.png";
import catConfiserie from "@assets/cat-confiserie.png";
import catMenage from "@assets/cat-menage.png";

const CATEGORY_IMAGES: Record<string, string> = {
  "alimentation": catAlimentation,
  "boissons": catBoissons,
  "hygiene-entretien": catHygiene,
  "parapharmacie": catParapharmacie,
  "bebe-puericulture": catBebe,
  "cosmetique-beaute": catCosmetique,
  "tabac-accessoires": catTabac,
  "papeterie-fournitures": catPapeterie,
  "telephonie-accessoires": catTelephonie,
  "condiments-epices": catCondiments,
  "confiserie-biscuits": catConfiserie,
  "menage-cuisine": catMenage,
};

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
  newest: "Plus recents",
  price_asc: "Prix croissant",
  price_desc: "Prix decroissant",
  name_asc: "Nom A-Z",
};

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const supplierFilterFromUrl = urlParams.get("supplier") || undefined;
  const [selectedSupplier, setSelectedSupplier] = useState<string>(supplierFilterFromUrl || "all");
  const supplierFilter = selectedSupplier !== "all" ? selectedSupplier : undefined;
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const { user } = useAuth();
  const { toast } = useToast();
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const supplierScrollRef = useRef<HTMLDivElement>(null);

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
        title: "Produit ajoute",
        description: "Le produit a ete ajoute a votre panier",
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

  const sponsoredProducts = useMemo(() => {
    return sortedProducts.filter(p => p.isSponsored);
  }, [sortedProducts]);

  const regularProducts = useMemo(() => {
    return sortedProducts.filter(p => !p.isSponsored);
  }, [sortedProducts]);

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

  const supplierCount = useMemo(() => {
    if (!products) return 0;
    return new Set(products.map(p => p.supplierId)).size;
  }, [products]);

  const activeFilters = useMemo(() => {
    const filters: { label: string; onClear: () => void }[] = [];
    if (selectedCategory !== "all") {
      const cat = categories?.find(c => c.id === selectedCategory);
      filters.push({ label: cat?.nameFr || "Categorie", onClear: () => setSelectedCategory("all") });
    }
    if (supplierFilter) {
      const sup = suppliers?.find(s => s.id === supplierFilter);
      filters.push({ label: sup?.businessName || "Fournisseur", onClear: () => setSelectedSupplier("all") });
    }
    if (search) {
      filters.push({ label: `"${search}"`, onClear: () => setSearch("") });
    }
    return filters;
  }, [selectedCategory, supplierFilter, search, categories, suppliers]);

  const scrollContainer = (ref: RefObject<HTMLDivElement | null>, dir: "left" | "right") => {
    ref.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-14">
            <Link href="/">
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
        <div className="bg-primary/[0.04] dark:bg-primary/[0.06] border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <div className="max-w-2xl">
              <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight mb-2" data-testid="text-marketplace-title">
                Trouvez vos produits de gros
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base mb-6">
                Comparez les prix, commandez directement aupres des fournisseurs verifies
              </p>
              <div className="relative max-w-xl">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit, une marque..."
                  className="pl-10 pr-10 bg-background border-border/60 h-11"
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
            <div className="flex items-center gap-5 mt-6 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5" data-testid="text-stat-products">
                <Package className="w-3.5 h-3.5 text-primary" />
                <span className="font-semibold text-foreground">{products?.length || 0}</span> produits
              </span>
              <span className="flex items-center gap-1.5" data-testid="text-stat-suppliers">
                <Users className="w-3.5 h-3.5 text-primary" />
                <span className="font-semibold text-foreground">{supplierCount}</span> fournisseurs
              </span>
              <span className="flex items-center gap-1.5" data-testid="text-stat-categories">
                <Grid3X3 className="w-3.5 h-3.5 text-primary" />
                <span className="font-semibold text-foreground">{categories?.length || 0}</span> categories
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

          {categories && categories.length > 0 && !search && (
            <div className="mb-8">
              <div className="flex items-center justify-between gap-2 mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categories</p>
                <div className="flex items-center gap-1">
                  {selectedCategory !== "all" && (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedCategory("all")} data-testid="button-category-all">
                      <X className="w-3.5 h-3.5 mr-1" /> Effacer
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="no-default-hover-elevate" onClick={() => scrollContainer(categoryScrollRef, "left")} data-testid="button-scroll-categories-left">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="no-default-hover-elevate" onClick={() => scrollContainer(categoryScrollRef, "right")} data-testid="button-scroll-categories-right">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="relative">
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scroll-smooth" ref={categoryScrollRef}>
                  {categories.map((cat) => {
                    const catImage = CATEGORY_IMAGES[cat.slug];
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(isSelected ? "all" : cat.id)}
                        className={`relative shrink-0 w-[calc(50%-6px)] sm:w-[calc(33.333%-8px)] md:w-[calc(25%-9px)] rounded-md overflow-hidden cursor-pointer transition-all group ${isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
                        data-testid={`button-category-${cat.slug}`}
                      >
                        <div className="aspect-[4/3] w-full">
                          {catImage ? (
                            <img src={catImage} alt={cat.nameFr} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <Package className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3">
                            <p className="text-white text-xs sm:text-sm font-semibold leading-tight drop-shadow-sm">
                              {cat.nameFr}
                            </p>
                            {globalCategoryCounts[cat.id] !== undefined && (
                              <p className="text-white/70 text-[10px] sm:text-xs mt-0.5">
                                {globalCategoryCounts[cat.id]} produit{globalCategoryCounts[cat.id] !== 1 ? "s" : ""}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {suppliers && suppliers.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fournisseurs</p>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="no-default-hover-elevate" onClick={() => scrollContainer(supplierScrollRef, "left")} data-testid="button-scroll-suppliers-left">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="no-default-hover-elevate" onClick={() => scrollContainer(supplierScrollRef, "right")} data-testid="button-scroll-suppliers-right">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div ref={supplierScrollRef} className="flex items-start gap-2.5 overflow-x-auto pb-2 scrollbar-thin scroll-smooth">
                <button
                  onClick={() => setSelectedSupplier("all")}
                  className="shrink-0 flex flex-col items-center gap-1.5 cursor-pointer"
                  data-testid="button-supplier-all"
                >
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 transition-all ${selectedSupplier === "all" ? "border-primary ring-2 ring-primary/20" : "border-transparent"}`}>
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                    </div>
                  </div>
                  <span className={`text-[10px] sm:text-xs leading-tight text-center max-w-[64px] sm:max-w-[72px] line-clamp-2 ${selectedSupplier === "all" ? "font-bold text-primary" : "text-muted-foreground font-medium"}`}>
                    Tous
                  </span>
                </button>
                {suppliers.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSupplier(s.id)}
                    className="shrink-0 flex flex-col items-center gap-1.5 cursor-pointer"
                    data-testid={`option-supplier-${s.id}`}
                  >
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 transition-all ${selectedSupplier === s.id ? "border-primary ring-2 ring-primary/20" : "border-transparent"}`}>
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                        <span className="text-base sm:text-lg font-bold text-primary">
                          {s.businessName.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[10px] sm:text-xs leading-tight text-center max-w-[64px] sm:max-w-[72px] line-clamp-2 ${selectedSupplier === s.id ? "font-bold text-primary" : "text-muted-foreground font-medium"}`}>
                      {s.businessName}
                      <span className="text-muted-foreground/70 ml-0.5 font-normal">({s.productCount})</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeFilters.length > 0 && (
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              <span className="text-xs text-muted-foreground">Filtres actifs :</span>
              {activeFilters.map((f, i) => (
                <Badge key={i} variant="secondary" className="text-xs gap-1 pr-1">
                  {f.label}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="no-default-hover-elevate ml-0.5 h-4 w-4"
                    onClick={f.onClear}
                    data-testid={`button-clear-filter-${i}`}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
              {activeFilters.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={() => { setSearch(""); setSelectedCategory("all"); setSelectedSupplier("all"); }}
                  data-testid="button-marketplace-reset-filters"
                >
                  Tout effacer
                </Button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <p className="text-sm text-muted-foreground" data-testid="text-marketplace-count">
              {sortedProducts.length > 0
                ? `${sortedProducts.length} produit${sortedProducts.length !== 1 ? "s" : ""} disponible${sortedProducts.length !== 1 ? "s" : ""}`
                : isLoading ? "Chargement..." : "Aucun produit"}
            </p>
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

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Card key={i}>
                  <CardContent className="p-0">
                    <Skeleton className="w-full aspect-[4/3] rounded-t-md" />
                    <div className="p-3 sm:p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-9 w-full mt-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sortedProducts.length > 0 ? (
            <div className="space-y-8">
              {sponsoredProducts.length > 0 && selectedCategory === "all" && !search && !supplierFilter && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <p className="text-sm font-semibold">Produits mis en avant</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 animate-fade-in">
                    {sponsoredProducts.map((product) => (
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
                </div>
              )}

              <div>
                {sponsoredProducts.length > 0 && selectedCategory === "all" && !search && !supplierFilter && (
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-semibold">Tous les produits</p>
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 animate-fade-in">
                  {(sponsoredProducts.length > 0 && selectedCategory === "all" && !search && !supplierFilter ? regularProducts : sortedProducts).map((product) => (
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
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-5">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-serif text-xl font-bold mb-2">Aucun produit trouve</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">
                {search
                  ? "Essayez avec d'autres termes de recherche ou modifiez vos filtres"
                  : "Les fournisseurs ajouteront bientot leurs produits"}
              </p>
              {activeFilters.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setSearch(""); setSelectedCategory("all"); setSelectedSupplier("all"); }}
                  data-testid="button-marketplace-reset-filters-empty"
                >
                  Reinitialiser les filtres
                </Button>
              )}
            </div>
          )}

          <div className="mt-16 py-10 border-t">
            <div className="grid sm:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-semibold text-sm mb-1" data-testid="text-trust-verified">Fournisseurs verifies</h4>
                <p className="text-xs text-muted-foreground max-w-[200px]">Tous nos partenaires sont verifies et fiables</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Truck className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-semibold text-sm mb-1" data-testid="text-trust-delivery">Livraison rapide</h4>
                <p className="text-xs text-muted-foreground max-w-[200px]">Reseau de livreurs dans toute l'Afrique de l'Ouest</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-semibold text-sm mb-1" data-testid="text-trust-prices">Meilleurs prix de gros</h4>
                <p className="text-xs text-muted-foreground max-w-[200px]">Comparez et economisez sur vos approvisionnements</p>
              </div>
            </div>
          </div>

          {!user && products && products.length > 0 && (
            <Card className="overflow-visible mb-8">
              <CardContent className="p-8 sm:p-10 text-center">
                <h3 className="font-serif text-xl sm:text-2xl font-bold mb-2" data-testid="text-marketplace-cta-title">
                  Pret a passer commande ?
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
                  Creez votre compte gratuitement pour commander directement aupres des fournisseurs aux meilleurs prix de gros.
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <a href="/api/login">
                    <Button size="lg" data-testid="button-marketplace-cta">
                      Creer mon compte
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </a>
                  <Link href="/">
                    <Button size="lg" variant="outline" data-testid="button-marketplace-learn-more">
                      En savoir plus
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <footer className="border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <Store className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="font-serif text-lg font-bold tracking-tight">SokoB2B</span>
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
    <Card
      className={`overflow-visible group transition-all ${
        product.isSponsored && product.boostLevel === "premium"
          ? "ring-1 ring-amber-400/50 dark:ring-amber-600/50"
          : ""
      }`}
      data-testid={`card-marketplace-product-${product.id}`}
    >
      <CardContent className="p-0">
        <div className="relative w-full aspect-[4/3] rounded-t-md overflow-hidden bg-muted">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Package className="w-10 h-10 text-muted-foreground/30" />
            </div>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">Rupture de stock</Badge>
            </div>
          )}
          {product.stock && product.stock > 0 && product.stock <= 10 && !isOutOfStock && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                {product.stock} restant{product.stock > 1 ? "s" : ""}
              </Badge>
            </div>
          )}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isSponsored && (
              <Badge className="text-[10px] bg-amber-500 text-white border-0 gap-1" data-testid={`badge-sponsored-${product.id}`}>
                {product.boostLevel === "premium" ? <Star className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                Sponsorise
              </Badge>
            )}
            {categoryName && (
              <Badge variant="secondary" className="text-[10px] bg-black/60 text-white border-0">
                {categoryName}
              </Badge>
            )}
          </div>
        </div>

        <div className="p-3 sm:p-4">
          <h3 className="font-semibold text-sm mb-1 line-clamp-2 leading-snug min-h-[2.5rem]" title={product.name} data-testid={`text-marketplace-product-name-${product.id}`}>
            {product.name}
          </h3>

          {product.description && (
            <p className="text-[11px] text-muted-foreground line-clamp-1 mb-1.5">{product.description}</p>
          )}

          <div className="flex items-center gap-1.5 mb-2 text-muted-foreground">
            <Store className="w-3 h-3 shrink-0" />
            <span className="text-[11px] truncate" data-testid={`text-supplier-${product.id}`}>
              {product.supplierName}
            </span>
            {product.supplierCity && (
              <>
                <span className="text-[9px]">-</span>
                <MapPin className="w-2.5 h-2.5 shrink-0" />
                <span className="text-[11px] truncate">{product.supplierCity}</span>
              </>
            )}
          </div>

          <div className="flex items-baseline gap-1.5 mb-3 flex-wrap">
            <span className="font-bold text-primary text-base tabular-nums" data-testid={`text-marketplace-price-${product.id}`}>
              {formatPrice(product.price, product.currency || "XOF")}
            </span>
            <span className="text-[11px] text-muted-foreground">/ {product.unit}</span>
          </div>

          {product.minOrder && product.minOrder > 1 && (
            <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
              <Package className="w-3 h-3" />
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
              <Eye className="w-3.5 h-3.5 mr-1" />
              Voir le produit
            </Button>
          ) : (
            <a href="/api/login">
              <Button variant="outline" size="sm" className="w-full text-xs" data-testid={`button-login-to-order-${product.id}`}>
                Connexion pour commander
              </Button>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
