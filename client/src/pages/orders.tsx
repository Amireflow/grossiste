import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, Package, ChevronDown, ChevronUp } from "lucide-react";
import { formatPrice, ORDER_STATUS_LABELS } from "@/lib/constants";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { Order, OrderItem, UserProfile } from "@shared/schema";

interface OrderWithItems extends Order {
  items: (OrderItem & { product?: { name: string; imageUrl: string | null } })[];
}

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
      toast({ title: "Statut mis à jour" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de mettre à jour", variant: "destructive" });
    },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">
          {isSupplier ? "Commandes reçues" : "Mes commandes"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isSupplier ? "Gérez les commandes de vos clients" : "Suivez l'état de vos commandes"}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-5 w-1/3 mb-3" />
                <Skeleton className="h-4 w-1/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = ORDER_STATUS_LABELS[order.status || "pending"];
            const isExpanded = expandedOrder === order.id;

            return (
              <Card key={order.id} data-testid={`order-card-${order.id}`}>
                <CardContent className="p-0">
                  <div
                    className="flex items-center justify-between gap-4 p-4 cursor-pointer"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    data-testid={`order-toggle-${order.id}`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">
                          Commande #{order.id.slice(0, 8)}
                        </p>
                        <Badge variant="secondary" className={`text-xs ${status.color}`}>
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-bold text-sm">
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
                    <div className="border-t px-4 pb-4">
                      <div className="space-y-3 mt-4">
                        {order.items?.map((item) => (
                          <div key={item.id} className="flex items-center gap-3">
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
                            <span className="text-sm font-medium shrink-0">
                              {formatPrice(item.totalPrice)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.deliveryAddress && (
                        <div className="mt-4 p-3 rounded-md bg-muted/50">
                          <p className="text-xs text-muted-foreground mb-1">Adresse de livraison</p>
                          <p className="text-sm">{order.deliveryAddress}, {order.deliveryCity}</p>
                        </div>
                      )}

                      {order.notes && (
                        <div className="mt-3 p-3 rounded-md bg-muted/50">
                          <p className="text-xs text-muted-foreground mb-1">Notes</p>
                          <p className="text-sm">{order.notes}</p>
                        </div>
                      )}

                      {isSupplier && order.status !== "delivered" && order.status !== "cancelled" && (
                        <div className="mt-4 flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">Changer le statut :</span>
                          <Select
                            value={order.status || "pending"}
                            onValueChange={(val) => updateStatus.mutate({ orderId: order.id, status: val })}
                          >
                            <SelectTrigger className="w-[180px]" data-testid={`select-status-${order.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">En attente</SelectItem>
                              <SelectItem value="confirmed">Confirmée</SelectItem>
                              <SelectItem value="processing">En cours</SelectItem>
                              <SelectItem value="shipped">Expédiée</SelectItem>
                              <SelectItem value="delivered">Livrée</SelectItem>
                              <SelectItem value="cancelled">Annulée</SelectItem>
                            </SelectContent>
                          </Select>
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
        <div className="text-center py-16">
          <ClipboardList className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-2">Aucune commande</h3>
          <p className="text-sm text-muted-foreground">
            {isSupplier
              ? "Vos commandes apparaîtront ici"
              : "Parcourez le catalogue pour passer votre première commande"}
          </p>
        </div>
      )}
    </div>
  );
}
