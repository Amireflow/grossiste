import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ShoppingCart, Plus, Minus, Package, Grid3X3, SlidersHorizontal, X, CheckCircle } from "lucide-react";
import { formatPrice } from "@/lib/constants";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product, Category } from "@shared/schema";

export default function CatalogPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { toast } = useToast();

  const { data: categories } = useQuery<Category[]>({ queryKey: ["/api/categories"] });
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const addToCart = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const res = await apiRequest("POST", "/api/cart", { productId, quantity });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Ajouté au panier",
        description: "Le produit a été ajouté à votre panier",
      });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'ajouter au panier", variant: "destructive" });
    },
  });

  const filteredProducts = products?.filter((p) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedCatName = selectedCategory !== "all"
    ? categories?.find(c => c.id === selectedCategory)?.nameFr
    : null;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold" data-testid="text-catalog-title">Catalogue</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {filteredProducts
              ? `${filteredProducts.length} produit${filteredProducts.length !== 1 ? "s" : ""} disponible${filteredProducts.length !== 1 ? "s" : ""}`
              : "Chargement des produits..."}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-products"
          />
          {search && (
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 -translate-y-1/2 no-default-hover-elevate"
              onClick={() => setSearch("")}
              data-testid="button-clear-search"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[220px]" data-testid="select-category-filter">
            <SlidersHorizontal className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Toutes les catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.nameFr}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCatName && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs gap-1.5 pr-1">
            {selectedCatName}
            <Button
              size="icon"
              variant="ghost"
              className="no-default-hover-elevate ml-0.5"
              onClick={() => setSelectedCategory("all")}
              data-testid="button-clear-category"
            >
              <X className="w-3 h-3" />
            </Button>
          </Badge>
        </div>
      )}

      {categories && categories.length > 0 && selectedCategory === "all" && !search && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {categories.map((cat) => (
            <Card
              key={cat.id}
              className="cursor-pointer overflow-visible hover-elevate"
              onClick={() => setSelectedCategory(cat.id)}
              data-testid={`card-category-${cat.slug}`}
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
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
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
      ) : filteredProducts && filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={(qty) => addToCart.mutate({ productId: product.id, quantity: qty })}
              isAdding={addToCart.isPending}
            />
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
              data-testid="button-reset-filters"
            >
              Réinitialiser les filtres
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, onAddToCart, isAdding }: { product: Product; onAddToCart: (qty: number) => void; isAdding: boolean }) {
  const [qty, setQty] = useState(product.minOrder || 1);
  const [justAdded, setJustAdded] = useState(false);
  const isOutOfStock = product.stock !== null && product.stock !== undefined && product.stock <= 0;

  const handleAdd = () => {
    onAddToCart(qty);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <Card className="overflow-visible group" data-testid={`card-product-${product.id}`}>
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
          {product.stock && product.stock > 0 && product.stock <= 10 && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400">
                {product.stock} en stock
              </Badge>
            </div>
          )}
        </div>

        <h3 className="font-medium text-sm mb-0.5 line-clamp-2 leading-tight min-h-[2.5rem]" title={product.name} data-testid={`text-product-name-${product.id}`}>
          {product.name}
        </h3>

        <div className="flex items-baseline gap-1.5 mb-2.5 flex-wrap">
          <span className="font-bold text-primary text-sm" data-testid={`text-product-price-${product.id}`}>
            {formatPrice(product.price, product.currency || "XOF")}
          </span>
          <span className="text-xs text-muted-foreground">/ {product.unit}</span>
        </div>

        {product.minOrder && product.minOrder > 1 && (
          <p className="text-[11px] text-muted-foreground mb-2">
            Min. {product.minOrder} {product.unit}
          </p>
        )}

        {isOutOfStock ? (
          <Button variant="secondary" size="sm" className="w-full" disabled>
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
                  Ajouté
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                  Ajouter
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
