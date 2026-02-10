import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Printer, ChevronLeft, Package, MapPin, Phone, User, Calendar, Truck } from "lucide-react";
import { formatPrice } from "@/lib/constants";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Order, OrderItem } from "@shared/schema";

type OrderWithItems = Order & { items: (OrderItem & { product?: { name: string; imageUrl: string | null } })[] };

export default function OrderDetailsPage() {
    const [, params] = useRoute("/orders/:id");
    const orderId = params?.id;

    const { data: order, isLoading } = useQuery<OrderWithItems>({
        queryKey: [`/api/orders/${orderId}`],
        enabled: !!orderId,
    });

    if (isLoading) {
        return (
            <div className="p-6 max-w-4xl mx-auto space-y-6">
                <Skeleton className="h-12 w-1/3" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/4" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold">Commande introuvable</h2>
                <Link href="/orders">
                    <Button className="mt-4">Retour aux commandes</Button>
                </Link>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "delivered": return "bg-green-100 text-green-700 hover:bg-green-100";
            case "shipped": return "bg-blue-100 text-blue-700 hover:bg-blue-100";
            case "confirmed": return "bg-purple-100 text-purple-700 hover:bg-purple-100";
            case "cancelled": return "bg-red-100 text-red-700 hover:bg-red-100";
            default: return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "pending": return "En attente";
            case "confirmed": return "Confirmée";
            case "processing": return "En préparation";
            case "shipped": return "Expédiée";
            case "delivered": return "Livrée";
            case "cancelled": return "Annulée";
            default: return status;
        }
    };

    const currentStatus = (order.status || "pending") as string;

    return (
        <div className="min-h-screen bg-muted/20 pb-10 p-3 md:p-4">
            <div className="max-w-4xl mx-auto space-y-4">
                {/* Header with Navigation and Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden">
                    <div className="flex items-center gap-2">
                        <Link href="/orders">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-serif font-bold tracking-tight">Détails de la commande</h1>
                            <p className="text-xs text-muted-foreground">
                                Référence #{order.id.substring(0, 8).toUpperCase()}
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2 h-8 text-xs">
                        <Printer className="w-3.5 h-3.5" />
                        Imprimer
                    </Button>
                </div>

                {/* Main Content Card (Printable Area) */}
                <Card className="print:shadow-none print:border-none">
                    <CardHeader className="border-b pb-4 pt-5 px-5">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-lg mb-1">Commande #{order.id.substring(0, 8).toUpperCase()}</CardTitle>
                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {format(order.createdAt ? new Date(order.createdAt) : new Date(), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                                </div>
                            </div>
                            <Badge className={`${getStatusColor(currentStatus)} border-none px-2 py-0.5 text-xs`}>
                                {getStatusLabel(currentStatus)}
                            </Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-5 px-5 space-y-6">
                        {/* Steps / Timeline (Simplified) */}
                        <div className="relative pb-2 print:hidden">
                            <div className="flex justify-between text-xs font-medium text-muted-foreground mb-1.5">
                                <span className={currentStatus !== "cancelled" ? "text-primary" : ""}>Commandé</span>
                                <span className={["confirmed", "processing", "shipped", "delivered"].includes(currentStatus) ? "text-primary" : ""}>Traitement</span>
                                <span className={["shipped", "delivered"].includes(currentStatus) ? "text-primary" : ""}>Expédition</span>
                                <span className={currentStatus === "delivered" ? "text-primary" : ""}>Livraison</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                    className={`h-full bg-primary transition-all duration-500`}
                                    style={{
                                        width: currentStatus === "delivered" ? "100%" :
                                            currentStatus === "shipped" ? "75%" :
                                                currentStatus === "processing" || currentStatus === "confirmed" ? "50%" :
                                                    "25%"
                                    }}
                                />
                            </div>
                        </div>

                        {/* Customer & Delivery Info */}
                        <div className="grid md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <User className="w-3.5 h-3.5 text-primary" />
                                    Informations Client
                                </h3>
                                <div className="text-xs space-y-1 text-muted-foreground bg-muted/30 p-3 rounded-md">
                                    <p className="font-medium text-foreground">{order.contactName}</p>
                                    <p className="flex items-center gap-2">
                                        <Phone className="w-3 h-3" /> {order.deliveryPhone}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-primary" />
                                    Adresse de Livraison
                                </h3>
                                <div className="text-xs space-y-1 text-muted-foreground bg-muted/30 p-3 rounded-md">
                                    <p className="font-medium text-foreground capitalize">{order.deliveryCity}</p>
                                    <p>{order.deliveryAddress || "Pas d'adresse spécifique"}</p>
                                    {order.notes && (
                                        <p className="mt-2 pt-2 border-t text-[10px] italic">NB: {order.notes}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Order Items */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Package className="w-3.5 h-3.5 text-primary" />
                                Articles
                            </h3>
                            <div className="border rounded-md overflow-hidden">
                                <table className="w-full text-xs">
                                    <thead className="bg-muted/50 text-left">
                                        <tr>
                                            <th className="p-2 font-medium">Produit</th>
                                            <th className="p-2 font-medium text-right">Prix</th>
                                            <th className="p-2 font-medium text-center">Qté</th>
                                            <th className="p-2 font-medium text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {order.items.map((item) => (
                                            <tr key={item.id}>
                                                <td className="p-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded bg-muted overflow-hidden shrink-0">
                                                            {item.product?.imageUrl ? (
                                                                <img src={item.product.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Package className="w-full h-full p-1.5 text-muted-foreground/50" />
                                                            )}
                                                        </div>
                                                        <span className="font-medium line-clamp-1">{item.productName}</span>
                                                    </div>
                                                </td>
                                                <td className="p-2 text-right text-muted-foreground">
                                                    {formatPrice(item.unitPrice)}
                                                </td>
                                                <td className="p-2 text-center">
                                                    {item.quantity}
                                                </td>
                                                <td className="p-2 text-right font-medium">
                                                    {formatPrice(item.totalPrice)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Total */}
                        <div className="flex justify-end pt-2">
                            <div className="w-full md:w-5/12 space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Sous-total</span>
                                    <span>{formatPrice(order.totalAmount, order.currency || "XOF")}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Livraison</span>
                                    <span className="text-muted-foreground italic">À définir</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-sm">Total</span>
                                    <span className="font-bold text-lg text-primary">
                                        {formatPrice(order.totalAmount, order.currency || "XOF")}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Footer Information */}
                        <div className="text-[10px] text-muted-foreground text-center pt-4 print:block hidden">
                            <p>Merci pour votre confiance !</p>
                            <p>Market Africa - Plateforme de commerce B2B</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
