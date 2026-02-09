import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Link } from "wouter";
import { Plus, Package, Pencil, Eye, EyeOff } from "lucide-react";
import { formatPrice } from "@/lib/constants";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";

export default function ProductsPage() {
  const { toast } = useToast();

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/my-products"],
  });

  const toggleActive = useMutation({
    mutationFn: async ({ productId, isActive }: { productId: string; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/products/${productId}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-products"] });
      toast({ title: "Produit mis à jour" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de modifier le produit", variant: "destructive" });
    },
  });

  const activeCount = products?.filter(p => p.isActive).length || 0;
  const totalCount = products?.length || 0;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-start sm:items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold" data-testid="text-products-title">Mes produits</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {totalCount > 0 ? `${activeCount} actif${activeCount !== 1 ? "s" : ""} sur ${totalCount}` : "Gérez votre catalogue"}
          </p>
        </div>
        <Link href="/products/new">
          <Button data-testid="button-add-product">
            <Plus className="w-4 h-4 mr-1" />
            Ajouter un produit
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="w-full aspect-video rounded-md mb-3" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-3" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => {
            const isActive = product.isActive ?? true;
            return (
              <Card key={product.id} className={!isActive ? "opacity-60" : ""} data-testid={`product-card-${product.id}`}>
                <CardContent className="p-3 sm:p-4">
                  <div className="relative w-full aspect-video rounded-md overflow-hidden bg-muted mb-3">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}
                    {!isActive && (
                      <div className="absolute inset-0 bg-background/40 flex items-center justify-center">
                        <Badge variant="secondary" className="text-[10px]">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Masqué
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
                    <Switch
                      checked={isActive}
                      onCheckedChange={(checked) => toggleActive.mutate({ productId: product.id, isActive: checked })}
                      data-testid={`switch-active-${product.id}`}
                    />
                  </div>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="font-bold text-primary text-sm">
                      {formatPrice(product.price, product.currency || "XOF")}
                    </span>
                    <span className="text-xs text-muted-foreground">/ {product.unit}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Badge variant="secondary" className="text-[10px]">
                      Stock: {product.stock ?? 0}
                    </Badge>
                    {product.minOrder && product.minOrder > 1 && (
                      <Badge variant="secondary" className="text-[10px]">
                        Min: {product.minOrder}
                      </Badge>
                    )}
                  </div>
                  <Link href={`/products/${product.id}/edit`}>
                    <Button variant="outline" size="sm" className="w-full" data-testid={`button-edit-${product.id}`}>
                      <Pencil className="w-3 h-3 mr-1" />
                      Modifier
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-5">
            <Package className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <h3 className="font-medium text-lg mb-2">Aucun produit</h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
            Commencez par ajouter vos premiers produits pour qu'ils apparaissent dans le catalogue
          </p>
          <Link href="/products/new">
            <Button data-testid="button-first-product">
              <Plus className="w-4 h-4 mr-1" />
              Ajouter mon premier produit
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
