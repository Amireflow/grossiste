import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Trash2, Plus, Minus, ChevronRight, Package, MapPin, Truck, ChevronLeft, User, Phone } from "lucide-react";
import { formatPrice } from "@/lib/constants";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";

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

interface UserProfile {
  businessName: string;
  phone: string;
  address: string | null;
  city: string | null;
}

export default function CartPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [contactName, setContactName] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [notes, setNotes] = useState("");

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
  });

  useEffect(() => {
    if (profile) {
      if (!contactName) setContactName(profile.businessName || "");
      if (!deliveryPhone) setDeliveryPhone(profile.phone || "");
      if (!deliveryAddress && profile.address) setDeliveryAddress(profile.address);
      if (!deliveryCity && profile.city) setDeliveryCity(profile.city);
    }
  }, [profile]);

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
      toast({ title: "Retire du panier" });
    },
  });

  const checkout = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/orders/checkout", {
        contactName,
        deliveryPhone,
        deliveryAddress,
        deliveryCity,
        notes,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Commande confirmee", description: "Votre commande a ete envoyee aux fournisseurs" });
      navigate("/orders");
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de passer la commande", variant: "destructive" });
    },
  });

  const total = cartItems?.reduce((sum, item) => {
    return sum + parseFloat(item.product.price) * item.quantity;
  }, 0) || 0;

  const totalItems = cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const currency = cartItems?.[0]?.product?.currency || "XOF";

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-cart-title">Mon panier</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {cartItems
              ? `${cartItems.length} article${cartItems.length !== 1 ? "s" : ""} - ${totalItems} unite${totalItems !== 1 ? "s" : ""}`
              : "Chargement..."}
          </p>
        </div>
        <Link href="/marketplace">
          <Button variant="outline" size="sm" data-testid="button-continue-shopping">
            <ChevronLeft className="w-3.5 h-3.5 mr-1" />
            Continuer mes achats
          </Button>
        </Link>
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
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="space-y-3">
            {cartItems.map((item, index) => {
              const lineTotal = parseFloat(item.product.price) * item.quantity;
              return (
                <Card key={item.id} className={`animate-fade-in-up stagger-${Math.min(index + 1, 6)} overflow-hidden`} data-testid={`cart-item-${item.id}`}>
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className="w-24 sm:w-28 shrink-0 self-stretch bg-muted">
                        {item.product.imageUrl ? (
                          <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <Package className="w-5 h-5 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 p-2 md:p-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium text-xs line-clamp-2">{item.product.name}</h3>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="shrink-0 h-6 w-6 -mt-1 -mr-1"
                            onClick={() => removeItem.mutate(item.id)}
                            data-testid={`button-cart-remove-${item.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatPrice(item.product.price, item.product.currency)} / {item.product.unit}
                        </p>
                        <div className="flex items-center justify-between gap-2 mt-2">
                          <div className="flex items-center border rounded-md h-7">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 rounded-none px-0"
                              onClick={() => updateQuantity.mutate({ itemId: item.id, quantity: Math.max(1, item.quantity - 1) })}
                              data-testid={`button-cart-minus-${item.id}`}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="text-xs w-6 text-center tabular-nums">{item.quantity}</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 rounded-none px-0"
                              onClick={() => updateQuantity.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                              data-testid={`button-cart-plus-${item.id}`}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <span className="text-sm font-bold tabular-nums" data-testid={`text-line-total-${item.id}`}>
                            {formatPrice(lineTotal, item.product.currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="space-y-4">
            <Card className="animate-fade-in-up stagger-2">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <h2 className="font-semibold text-sm">Contact</h2>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="contact-name" className="text-xs">Nom du contact / commerce</Label>
                  <Input
                    id="contact-name"
                    placeholder="Nom complet ou nom du commerce"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    data-testid="input-contact-name"
                  />
                </div>
                <div>
                  <Label htmlFor="delivery-phone" className="text-xs">Telephone</Label>
                  <Input
                    id="delivery-phone"
                    type="tel"
                    placeholder="+229 XX XX XX XX"
                    value={deliveryPhone}
                    onChange={(e) => setDeliveryPhone(e.target.value)}
                    data-testid="input-delivery-phone"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-in-up stagger-3">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <h2 className="font-semibold text-sm">Livraison</h2>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="delivery-city" className="text-xs">Ville</Label>
                  <Input
                    id="delivery-city"
                    placeholder="Cotonou"
                    value={deliveryCity}
                    onChange={(e) => setDeliveryCity(e.target.value)}
                    data-testid="input-delivery-city"
                  />
                </div>
                <div>
                  <Label htmlFor="delivery-address" className="text-xs">Adresse de livraison</Label>
                  <Input
                    id="delivery-address"
                    placeholder="Quartier, rue, repere..."
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    data-testid="input-delivery-address"
                  />
                </div>
                <div>
                  <Label htmlFor="notes" className="text-xs">Instructions de livraison (optionnel)</Label>
                  <Textarea
                    id="notes"
                    className="resize-none"
                    rows={2}
                    placeholder="Etage, code porte, heures preferees..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    data-testid="input-order-notes"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-in-up stagger-4">
              <CardHeader className="pb-3">
                <h2 className="font-semibold text-sm">Resume de la commande</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">Sous-total ({totalItems} unites)</span>
                  <span className="tabular-nums">{formatPrice(total, currency)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    Livraison
                  </span>
                  <Badge variant="secondary" className="text-[10px]">A determiner</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-4 font-bold text-base">
                  <span>Total</span>
                  <span className="text-primary tabular-nums" data-testid="text-cart-total">{formatPrice(total, currency)}</span>
                </div>
                <Button
                  className="w-full mt-2"
                  size="lg"
                  onClick={() => checkout.mutate()}
                  disabled={checkout.isPending || !deliveryCity || !contactName || !deliveryPhone}
                  data-testid="button-checkout"
                >
                  {checkout.isPending ? "Traitement..." : "Confirmer la commande"}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">
                  Le paiement sera convenu avec le fournisseur
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-5">
            <ShoppingCart className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-lg mb-2">Votre panier est vide</h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
            Parcourez le marketplace pour trouver les meilleurs produits pour votre commerce
          </p>
          <Link href="/marketplace">
            <Button data-testid="button-start-shopping">
              Parcourir le marketplace
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
