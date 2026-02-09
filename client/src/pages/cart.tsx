import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package } from "lucide-react";
import { formatPrice } from "@/lib/constants";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useState } from "react";

interface CartItemWithProduct {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: string;
    currency: string;
    unit: string;
    imageUrl: string | null;
    supplierId: string;
    stock: number | null;
  };
}

export default function CartPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [notes, setNotes] = useState("");

  const { data: cartItems, isLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart"],
  });

  const updateQuantity = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const res = await apiRequest("PATCH", `/api/cart/${itemId}`, { quantity });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/cart"] }),
  });

  const removeItem = useMutation({
    mutationFn: async (itemId: string) => {
      await apiRequest("DELETE", `/api/cart/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({ title: "Retiré du panier" });
    },
  });

  const checkout = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/orders/checkout", {
        deliveryAddress,
        deliveryCity,
        notes,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Commande passée", description: "Votre commande a été envoyée aux fournisseurs" });
      navigate("/orders");
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de passer la commande", variant: "destructive" });
    },
  });

  const total = cartItems?.reduce((sum, item) => {
    return sum + parseFloat(item.product.price) * item.quantity;
  }, 0) || 0;

  const currency = cartItems?.[0]?.product?.currency || "XOF";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Mon panier</h1>
        <p className="text-muted-foreground mt-1">
          {cartItems ? `${cartItems.length} article(s)` : "Chargement..."}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="w-20 h-20 rounded-md shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/3 mb-3" />
                    <Skeleton className="h-8 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : cartItems && cartItems.length > 0 ? (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {cartItems.map((item) => (
              <Card key={item.id} data-testid={`cart-item-${item.id}`}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-md overflow-hidden bg-muted shrink-0">
                      {item.product.imageUrl ? (
                        <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{item.product.name}</h3>
                      <p className="text-sm text-primary font-bold mt-1">
                        {formatPrice(item.product.price, item.product.currency)} / {item.product.unit}
                      </p>
                      <div className="flex items-center justify-between gap-4 mt-3">
                        <div className="flex items-center border rounded-md">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="no-default-hover-elevate"
                            onClick={() => updateQuantity.mutate({ itemId: item.id, quantity: Math.max(1, item.quantity - 1) })}
                            data-testid={`button-cart-minus-${item.id}`}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm w-8 text-center">{item.quantity}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="no-default-hover-elevate"
                            onClick={() => updateQuantity.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                            data-testid={`button-cart-plus-${item.id}`}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold">
                            {formatPrice(parseFloat(item.product.price) * item.quantity, item.product.currency)}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeItem.mutate(item.id)}
                            data-testid={`button-cart-remove-${item.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <h2 className="font-semibold">Livraison</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="delivery-city">Ville</Label>
                  <Input
                    id="delivery-city"
                    placeholder="Cotonou"
                    value={deliveryCity}
                    onChange={(e) => setDeliveryCity(e.target.value)}
                    data-testid="input-delivery-city"
                  />
                </div>
                <div>
                  <Label htmlFor="delivery-address">Adresse</Label>
                  <Input
                    id="delivery-address"
                    placeholder="Quartier, rue, repère..."
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    data-testid="input-delivery-address"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes (optionnel)</Label>
                  <Textarea
                    id="notes"
                    className="resize-none"
                    placeholder="Instructions spéciales..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    data-testid="input-order-notes"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <h2 className="font-semibold">Résumé</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>{formatPrice(total, currency)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Livraison</span>
                  <span className="text-muted-foreground">À déterminer</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary" data-testid="text-cart-total">{formatPrice(total, currency)}</span>
                </div>
                <Button
                  className="w-full mt-2"
                  size="lg"
                  onClick={() => checkout.mutate()}
                  disabled={checkout.isPending || !deliveryCity}
                  data-testid="button-checkout"
                >
                  {checkout.isPending ? "Traitement..." : "Passer la commande"}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Paiement mobile money ou à la livraison
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <ShoppingCart className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-2">Votre panier est vide</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Parcourez le catalogue pour trouver vos produits
          </p>
          <a href="/catalog">
            <Button data-testid="button-start-shopping">
              Parcourir le catalogue
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </a>
        </div>
      )}
    </div>
  );
}
