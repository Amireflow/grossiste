import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus, Package, Pencil, EyeOff, Zap, Rocket, Clock, Star, Wallet, AlertTriangle } from "lucide-react";
import BoostsPage from "@/pages/boosts";
import { formatPrice } from "@/lib/constants";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product, ProductBoost, WalletTransaction } from "@shared/schema";

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

  const { data: walletData } = useQuery<{ balance: string; transactions: WalletTransaction[] }>({
    queryKey: ["/api/wallet"],
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

  const createBoost = useMutation({
    mutationFn: async ({ productId, boostLevel, durationDays }: { productId: string; boostLevel: string; durationDays: number }) => {
      const res = await apiRequest("POST", "/api/boosts", { productId, boostLevel, durationDays });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boosts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      toast({ title: "Boost activé", description: "Votre produit est maintenant sponsorisé dans le marketplace" });
      setBoostDialogProduct(null);
    },
    onError: (error: any) => {
      const msg = error?.message || "";
      if (msg.includes("insuffisant") || msg.includes("INSUFFICIENT")) {
        toast({ title: "Solde insuffisant", description: "Rechargez votre portefeuille pour activer ce boost", variant: "destructive" });
      } else {
        toast({ title: "Erreur", description: msg || "Impossible d'activer le boost", variant: "destructive" });
      }
    },
  });

  const stopBoost = useMutation({
    mutationFn: async (boostId: string) => {
      const res = await apiRequest("PATCH", `/api/boosts/${boostId}`, { status: "expired" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boosts"] });
      toast({ title: "Boost arrêté" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'arrêter le boost", variant: "destructive" });
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
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-products-title">Mes produits</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {totalCount > 0 ? `${activeCount} actif${activeCount !== 1 ? "s" : ""} sur ${totalCount}` : "Gérez votre catalogue"}
          </p>
        </div>
        <Link href="/products/new" className="w-full sm:w-auto">
          <Button size="sm" className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm" data-testid="button-add-product">
            <Plus className="w-3.5 h-3.5 mr-1" />
            Ajouter un produit
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="w-full grid grid-cols-2 h-10">
          <TabsTrigger value="products" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Package className="w-4 h-4" />
            Catalogue
          </TabsTrigger>
          <TabsTrigger value="boosts" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Zap className="w-4 h-4" />
            Mes Boosts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4">

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
                              Masqué
                              Masqué
                            </Badge>
                          </div>
                        )}
                        {activeBoost && (
                          <div className="absolute top-2 left-2">
                            <Badge className="text-[10px] bg-amber-500 text-white border-0 gap-1" data-testid={`badge-boost-${product.id}`}>
                              <span className="text-yellow-600 font-medium text-[10px] uppercase tracking-wider bg-yellow-100/50 px-1.5 py-0.5 rounded border border-yellow-200/50">
                                {activeBoost.boostLevel === "premium" ? "Premium" : "Sponsorisé"}
                              </span>
                            </Badge>
                          </div>
                        )}
                        {product.status === "pending" && (
                          <div className="absolute top-2 right-2">
                            <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                              Vérification en cours
                            </Badge>
                          </div>
                        )}
                        {product.status === "rejected" && (
                          <div className="absolute top-2 right-2">
                            <Badge variant="destructive" className="text-[10px]">
                              Rejeté
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

                      {product.status === "rejected" && product.rejectionReason && (
                        <div className="mb-3 p-2 bg-red-50 border border-red-100 rounded text-xs text-red-800">
                          <span className="font-semibold">Motif du rejet :</span> {product.rejectionReason}
                        </div>
                      )}

                      {activeBoost ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-muted-foreground bg-primary/5 p-1.5 rounded-md">
                            <Clock className="w-3 h-3" />
                            Fin le {new Date(activeBoost.endDate).toLocaleDateString("fr-FR")}
                          </div>
                          <div className="flex items-center gap-2">
                            <Link href={`/products/${product.id}/edit`} className="flex-1">
                              <Button variant="outline" size="sm" className="w-full h-8 sm:h-9 text-xs" data-testid={`button-edit-${product.id}`}>
                                <Pencil className="w-3.5 h-3.5 sm:mr-1.5" />
                                <span>Modifier</span>
                              </Button>
                            </Link>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="flex-1 h-8 sm:h-9 text-xs text-destructive hover:text-destructive"
                              onClick={() => stopBoost.mutate(activeBoost.id)}
                              disabled={stopBoost.isPending}
                              data-testid={`button-stop-boost-${product.id}`}
                            >
                              <span className="hidden sm:inline mr-1.5">Arrêter</span>
                              <span className="sm:hidden">Stop</span>
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Link href={`/products/${product.id}/edit`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full h-8 sm:h-9 text-xs" data-testid={`button-edit-${product.id}`}>
                              <Pencil className="w-3.5 h-3.5 sm:mr-1.5" />
                              <span>Modifier</span>
                            </Button>
                          </Link>
                          {isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-8 sm:h-9 text-xs border-primary/20 hover:bg-primary/5 hover:text-primary text-foreground"
                              onClick={() => { setBoostDialogProduct(product); setBoostLevel("standard"); setBoostDuration("7"); }}
                              data-testid={`button-boost-${product.id}`}
                            >
                              <Zap className="w-3.5 h-3.5 sm:mr-1.5 fill-current" />
                              <span>Booster</span>
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
        </TabsContent>

        <TabsContent value="boosts" className="mt-4">
          <BoostsPage />
        </TabsContent>
      </Tabs>

      <Dialog open={!!boostDialogProduct} onOpenChange={(open) => !open && setBoostDialogProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle data-testid="text-boost-dialog-title">Booster un produit</DialogTitle>
            <DialogDescription>
              Sponsorisez "{boostDialogProduct?.name}" pour qu'il apparaisse en priorité dans le marketplace.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-2">
              <Card
                className={`cursor-pointer overflow-visible transition-all hover:shadow-md ${boostLevel === "standard" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/50"}`}
                onClick={() => setBoostLevel("standard")}
                data-testid="card-boost-standard"
              >
                <CardContent className="p-3 text-center">
                  <Zap className={`w-5 h-5 mx-auto mb-1.5 ${boostLevel === "standard" ? "text-primary filter drop-shadow-sm" : "text-muted-foreground"}`} />
                  <h4 className={`font-medium text-sm mb-0.5 ${boostLevel === "standard" ? "text-primary" : ""}`}>Standard</h4>
                  <p className="text-[10px] text-muted-foreground leading-tight">Apparaît en tête des résultats</p>
                </CardContent>
              </Card>
              <Card
                className={`cursor-pointer overflow-visible transition-all hover:shadow-md ${boostLevel === "premium" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/50"}`}
                onClick={() => setBoostLevel("premium")}
                data-testid="card-boost-premium"
              >
                <CardContent className="p-3 text-center">
                  <Rocket className={`w-5 h-5 mx-auto mb-1.5 ${boostLevel === "premium" ? "text-primary filter drop-shadow-sm" : "text-muted-foreground"}`} />
                  <h4 className={`font-medium text-sm mb-0.5 ${boostLevel === "premium" ? "text-primary" : ""}`}>Premium</h4>
                  <p className="text-[10px] text-muted-foreground leading-tight">Priorité maximale + badge doré</p>
                </CardContent>
              </Card>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Durée</label>
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

            <div className="space-y-2">
              <div className="rounded-md bg-muted/50 p-3 flex items-center justify-between gap-3">
                <span className="text-sm">Coût du boost</span>
                <span className="font-bold text-foreground" data-testid="text-boost-price">
                  {formatPrice(BOOST_PRICES[boostLevel]?.[boostDuration] || 0)}
                </span>
              </div>
              <div className="rounded-md bg-muted/50 p-3 flex items-center justify-between gap-3">
                <span className="text-sm flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5" />
                  Mon solde
                </span>
                <span className="font-bold text-foreground" data-testid="text-wallet-balance">
                  {formatPrice(parseFloat(walletData?.balance || "0"))}
                </span>
              </div>
              {parseFloat(walletData?.balance || "0") < (BOOST_PRICES[boostLevel]?.[boostDuration] || 0) && (
                <div className="rounded-md bg-destructive/10 p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-destructive">Solde insuffisant</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Rechargez votre portefeuille pour activer ce boost.
                    </p>
                    <Link href="/account-pro">
                      <Button variant="outline" size="sm" className="mt-2 text-xs" data-testid="button-goto-topup">
                        <Wallet className="w-3 h-3 mr-1" />
                        Recharger
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
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
              disabled={createBoost.isPending || parseFloat(walletData?.balance || "0") < (BOOST_PRICES[boostLevel]?.[boostDuration] || 0)}
              data-testid="button-confirm-boost"
            >
              <Zap className="w-4 h-4 mr-1" />
              {createBoost.isPending ? "Activation..." : "Payer et activer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
