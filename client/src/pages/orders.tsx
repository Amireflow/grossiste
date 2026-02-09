import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ClipboardList, Package, ChevronDown, ChevronUp, MapPin, StickyNote,
  Truck, CheckCircle2, Clock, XCircle, ArrowRight, RefreshCw,
} from "lucide-react";
import { formatPrice, ORDER_STATUS_LABELS } from "@/lib/constants";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Link } from "wouter";
import type { Order, OrderItem, UserProfile } from "@shared/schema";

interface OrderWithItems extends Order {
  items: (OrderItem & { product?: { name: string; imageUrl: string | null } })[];
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="w-4 h-4 text-amber-500" />,
  confirmed: <CheckCircle2 className="w-4 h-4 text-blue-500" />,
  processing: <RefreshCw className="w-4 h-4 text-purple-500" />,
  shipped: <Truck className="w-4 h-4 text-indigo-500" />,
  delivered: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  cancelled: <XCircle className="w-4 h-4 text-red-500" />,
};

export default function OrdersPage() {
  const { toast } = useToast();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const { data: profile } = useQuery<UserProfile>({ queryKey: ["/api/profile"] });
  const { data: orders, isLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders"],
  });

  const isSupplier = profile?.role === "supplier";

  const updateStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/orders/${orderId}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Statut mis a jour" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de mettre a jour", variant: "destructive" });
    },
  });

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold" data-testid="text-orders-title">
          {isSupplier ? "Commandes recues" : "Mes commandes"}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {isSupplier
            ? `${orders?.length || 0} commande${(orders?.length || 0) !== 1 ? "s" : ""} au total`
            : "Suivez l'etat de vos commandes"}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-5 w-1/3 mb-3" />
                <Skeleton className="h-4 w-1/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map((order, index) => {
            const status = ORDER_STATUS_LABELS[order.status || "pending"];
            const isExpanded = expandedOrder === order.id;
            const itemCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

            return (
              <Card key={order.id} className={`animate-fade-in-up stagger-${Math.min(index + 1, 6)}`} data-testid={`order-card-${order.id}`}>
                <CardContent className="p-0">
                  <div
                    className="flex items-center justify-between gap-3 p-4 w-full text-left cursor-pointer hover-elevate rounded-md"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedOrder(isExpanded ? null : order.id); } }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    data-testid={`order-toggle-${order.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                        {STATUS_ICONS[order.status || "pending"]}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">
                            #{order.id.slice(0, 8)}
                          </p>
                          <Badge variant="secondary" className={`text-[10px] ${status.color}`}>
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })
                            : ""}
                          {" - "}
                          {itemCount} article{itemCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-sm tabular-nums">
                        {formatPrice(order.totalAmount, order.currency || "XOF")}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t animate-fade-in">
                      <div className="p-4 space-y-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Articles</p>
                        {order.items?.map((item) => (
                          <div key={item.id} className="flex items-center gap-3" data-testid={`order-item-${item.id}`}>
                            <div className="w-10 h-10 rounded-md overflow-hidden bg-muted shrink-0">
                              {item.product?.imageUrl ? (
                                <img src={item.product.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-4 h-4 text-muted-foreground/30" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">{item.productName}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.quantity} x {formatPrice(item.unitPrice)}
                              </p>
                            </div>
                            <span className="text-sm font-medium shrink-0 tabular-nums">
                              {formatPrice(item.totalPrice)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {(order.deliveryAddress || order.notes) && (
                        <div className="px-4 pb-4 space-y-2">
                          <Separator />
                          {order.deliveryAddress && (
                            <div className="flex items-start gap-2 pt-2">
                              <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">Livraison</p>
                                <p className="text-sm">{order.deliveryAddress}{order.deliveryCity ? `, ${order.deliveryCity}` : ""}</p>
                              </div>
                            </div>
                          )}
                          {order.notes && (
                            <div className="flex items-start gap-2">
                              <StickyNote className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">Notes</p>
                                <p className="text-sm">{order.notes}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {isSupplier && order.status !== "delivered" && order.status !== "cancelled" && (
                        <div className="px-4 pb-4">
                          <Separator className="mb-3" />
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-xs text-muted-foreground">Modifier le statut :</span>
                            <Select
                              value={order.status || "pending"}
                              onValueChange={(val) => updateStatus.mutate({ orderId: order.id, status: val })}
                            >
                              <SelectTrigger className="w-[180px]" data-testid={`select-status-${order.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">En attente</SelectItem>
                                <SelectItem value="confirmed">Confirmee</SelectItem>
                                <SelectItem value="processing">En cours</SelectItem>
                                <SelectItem value="shipped">Expediee</SelectItem>
                                <SelectItem value="delivered">Livree</SelectItem>
                                <SelectItem value="cancelled">Annulee</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-5">
            <ClipboardList className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <h3 className="font-medium text-lg mb-2">Aucune commande</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-5">
            {isSupplier
              ? "Les commandes de vos clients apparaitront ici des qu'elles seront passees"
              : "Parcourez le marketplace pour passer votre premiere commande"}
          </p>
          {!isSupplier && (
            <Link href="/marketplace">
              <Button data-testid="button-go-catalog">
                Voir le marketplace
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
