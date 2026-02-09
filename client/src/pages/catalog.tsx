import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ShoppingCart, Plus, Minus, Package } from "lucide-react";
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
      toast({ title: "Ajouté au panier", description: "Le produit a été ajouté à votre panier" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'ajouter au panier", variant: "destructive" });
    },
  });

  const filteredProducts = products?.filter((p) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Catalogue produits</h1>
        <p className="text-muted-foreground mt-1">Trouvez les meilleurs produits pour votre commerce</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-products"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]" data-testid="select-category-filter">
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

      {categories && categories.length > 0 && selectedCategory === "all" && !search && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Card
              key={cat.id}
              className="cursor-pointer hover-elevate overflow-visible"
              onClick={() => setSelectedCategory(cat.id)}
              data-testid={`card-category-${cat.slug}`}
            >
              <CardContent className="p-4 text-center">
                {cat.imageUrl && (
                  <div className="w-full aspect-square rounded-md overflow-hidden mb-3">
                    <img src={cat.imageUrl} alt={cat.nameFr} className="w-full h-full object-cover" />
                  </div>
                )}
                <p className="font-medium text-sm">{cat.nameFr}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="w-full aspect-square rounded-md mb-3" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-3" />
                <Skeleton className="h-6 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProducts && filteredProducts.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={(qty) => addToCart.mutate({ productId: product.id, quantity: qty })}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-2">Aucun produit trouvé</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {search
              ? "Essayez avec d'autres termes de recherche"
              : "Les fournisseurs ajouteront bientôt leurs produits"}
          </p>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, onAddToCart }: { product: Product; onAddToCart: (qty: number) => void }) {
  const [qty, setQty] = useState(product.minOrder || 1);

  return (
    <Card className="overflow-visible" data-testid={`card-product-${product.id}`}>
      <CardContent className="p-4">
        <div className="w-full aspect-square rounded-md overflow-hidden mb-3 bg-muted">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-10 h-10 text-muted-foreground/30" />
            </div>
          )}
        </div>
        <h3 className="font-medium text-sm mb-1 truncate" title={product.name}>{product.name}</h3>
        {product.description && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
        )}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="font-bold text-primary">
            {formatPrice(product.price, product.currency || "XOF")}
          </span>
          <Badge variant="secondary" className="text-xs shrink-0">/{product.unit}</Badge>
        </div>
        {product.stock !== null && product.stock !== undefined && product.stock <= 0 ? (
          <Badge variant="secondary" className="w-full justify-center bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            Rupture de stock
          </Badge>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-md">
              <Button
                size="icon"
                variant="ghost"
                className="no-default-hover-elevate"
                onClick={() => setQty(Math.max(product.minOrder || 1, qty - 1))}
                data-testid={`button-qty-minus-${product.id}`}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="text-sm w-8 text-center" data-testid={`text-qty-${product.id}`}>{qty}</span>
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
              className="flex-1"
              onClick={() => onAddToCart(qty)}
              data-testid={`button-add-cart-${product.id}`}
            >
              <ShoppingCart className="w-3.5 h-3.5 mr-1" />
              Ajouter
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
