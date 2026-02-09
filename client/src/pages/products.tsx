import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "wouter";
import { Plus, Package, Pencil, EyeOff, Zap, Rocket, Clock, Star } from "lucide-react";
import { formatPrice } from "@/lib/constants";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product, ProductBoost } from "@shared/schema";

interface BoostWithProduct extends ProductBoost {
  productName: string;
}

export default function ProductsPage() {
  const { toast } = useToast();
  const [boostDialogProduct, setBoostDialogProduct] = useState<Product | null>(null);
  const [boostLevel, setBoostLevel] = useState<"standard" | "premium">("standard");
  const [boostDuration, setBoostDuration] = useState("7");

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/my-products"],
  });

  const { data: boosts } = useQuery<BoostWithProduct[]>({
    queryKey: ["/api/boosts"],
  });

  const toggleActive = useMutation({
    mutationFn: async ({ productId, isActive }: { productId: string; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/products/${productId}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-products"] });
      toast({ title: "Produit mis \u00e0 jour" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de modifier le produit", variant: "destructive" });
    },
  });

  const createBoost = useMutation({
    mutationFn: async ({ productId, boostLevel, durationDays }: { productId: string; boostLevel: string; durationDays: number }) => {
      const res = await apiRequest("POST", "/api/boosts", { productId, boostLevel, durationDays });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boosts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-products"] });
      toast({ title: "Boost activ\u00e9", description: "Votre produit est maintenant sponsoris\u00e9 dans le marketplace" });
      setBoostDialogProduct(null);
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error?.message || "Impossible d'activer le boost", variant: "destructive" });
    },
  });

  const stopBoost = useMutation({
    mutationFn: async (boostId: string) => {
      const res = await apiRequest("PATCH", `/api/boosts/${boostId}`, { status: "expired" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boosts"] });
      toast({ title: "Boost arr\u00eat\u00e9" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'arr\u00eater le boost", variant: "destructive" });
    },
  });

  const activeCount = products?.filter(p => p.isActive).length || 0;
  const totalCount = products?.length || 0;

  const getActiveBoost = (productId: string) => {
    if (!boosts) return null;
    const now = new Date();
    return boosts.find(b =>
      b.productId === productId &&
      b.status === "active" &&
      new Date(b.startDate) <= now &&
      new Date(b.endDate) >= now
    ) || null;
  };

  const BOOST_PRICES: Record<string, Record<string, number>> = {
    standard: { "7": 5000, "14": 8500, "30": 15000 },
    premium: { "7": 10000, "14": 17000, "30": 30000 },
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-start sm:items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold" data-testid="text-products-title">Mes produits</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {totalCount > 0 ? `${activeCount} actif${activeCount !== 1 ? "s" : ""} sur ${totalCount}` : "G\u00e9rez votre catalogue"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/boosts">
            <Button variant="outline" data-testid="button-manage-boosts">
              <Zap className="w-4 h-4 mr-1" />
              G\u00e9rer les boosts
            </Button>
          </Link>
          <Link href="/products/new">
            <Button data-testid="button-add-product">
              <Plus className="w-4 h-4 mr-1" />
              Ajouter un produit
            </Button>
          </Link>
        </div>
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
            const activeBoost = getActiveBoost(product.id);
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
                          Masqu\u00e9
                        </Badge>
                      </div>
                    )}
                    {activeBoost && (
                      <div className="absolute top-2 left-2">
                        <Badge className="text-[10px] bg-amber-500 text-white border-0 gap-1" data-testid={`badge-boost-${product.id}`}>
                          {activeBoost.boostLevel === "premium" ? <Star className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                          {activeBoost.boostLevel === "premium" ? "Premium" : "Sponsoris\u00e9"}
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

                  {activeBoost ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        Boost jusqu'au {new Date(activeBoost.endDate).toLocaleDateString("fr-FR")}
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/products/${product.id}/edit`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full" data-testid={`button-edit-${product.id}`}>
                            <Pencil className="w-3 h-3 mr-1" />
                            Modifier
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => stopBoost.mutate(activeBoost.id)}
                          disabled={stopBoost.isPending}
                          data-testid={`button-stop-boost-${product.id}`}
                        >
                          Arr\u00eater
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Link href={`/products/${product.id}/edit`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full" data-testid={`button-edit-${product.id}`}>
                          <Pencil className="w-3 h-3 mr-1" />
                          Modifier
                        </Button>
                      </Link>
                      {isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setBoostDialogProduct(product); setBoostLevel("standard"); setBoostDuration("7"); }}
                          data-testid={`button-boost-${product.id}`}
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Booster
                        </Button>
                      )}
                    </div>
                  )}
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

      <Dialog open={!!boostDialogProduct} onOpenChange={(open) => !open && setBoostDialogProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle data-testid="text-boost-dialog-title">Booster un produit</DialogTitle>
            <DialogDescription>
              Sponsorisez "{boostDialogProduct?.name}" pour qu'il apparaisse en priorit\u00e9 dans le marketplace.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <Card
                className={`cursor-pointer overflow-visible hover-elevate ${boostLevel === "standard" ? "border-primary" : ""}`}
                onClick={() => setBoostLevel("standard")}
                data-testid="card-boost-standard"
              >
                <CardContent className="p-4 text-center">
                  <Zap className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <h4 className="font-medium text-sm mb-1">Standard</h4>
                  <p className="text-[11px] text-muted-foreground">Appara\u00eet en t\u00eate des r\u00e9sultats</p>
                </CardContent>
              </Card>
              <Card
                className={`cursor-pointer overflow-visible hover-elevate ${boostLevel === "premium" ? "border-primary" : ""}`}
                onClick={() => setBoostLevel("premium")}
                data-testid="card-boost-premium"
              >
                <CardContent className="p-4 text-center">
                  <Rocket className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <h4 className="font-medium text-sm mb-1">Premium</h4>
                  <p className="text-[11px] text-muted-foreground">Priorit\u00e9 maximale + badge dor\u00e9</p>
                </CardContent>
              </Card>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Dur\u00e9e</label>
              <Select value={boostDuration} onValueChange={setBoostDuration}>
                <SelectTrigger data-testid="select-boost-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 jours</SelectItem>
                  <SelectItem value="14">14 jours</SelectItem>
                  <SelectItem value="30">30 jours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md bg-muted/50 p-3 flex items-center justify-between gap-3">
              <span className="text-sm">Co\u00fbt du boost</span>
              <span className="font-bold text-primary" data-testid="text-boost-price">
                {formatPrice(BOOST_PRICES[boostLevel]?.[boostDuration] || 0)}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBoostDialogProduct(null)} data-testid="button-cancel-boost">
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (boostDialogProduct) {
                  createBoost.mutate({
                    productId: boostDialogProduct.id,
                    boostLevel,
                    durationDays: parseInt(boostDuration),
                  });
                }
              }}
              disabled={createBoost.isPending}
              data-testid="button-confirm-boost"
            >
              <Zap className="w-4 h-4 mr-1" />
              {createBoost.isPending ? "Activation..." : "Activer le boost"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
