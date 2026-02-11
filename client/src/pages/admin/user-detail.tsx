
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    User, Mail, Phone, MapPin, Calendar, Shield,
    Wallet, ShoppingCart, Package, ArrowUpRight, ArrowDownLeft,
    Ban, CheckCircle, AlertTriangle, Building, ArrowLeft
} from "lucide-react";
import { formatPrice } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { AdminTopUpModal } from "@/components/admin/top-up-modal";
import { AdminSubscriptionModal } from "@/components/admin/subscription-modal";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AdminUserDetail() {
    const [match, params] = useRoute("/admin/users/:id");
    const [_, setLocation] = useLocation();
    const id = match ? params.id : "";
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data, isLoading, isError } = useQuery<any>({
        queryKey: [`/api/admin/users/${id}`],
        enabled: !!id
    });

    const updateUserRoleMutation = useMutation({
        mutationFn: async ({ role }: { role: string }) => {
            await apiRequest("PATCH", `/api/admin/users/${id}`, { role });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${id}`] });
            toast({ title: "Succès", description: "Rôle mis à jour" });
        },
        onError: () => toast({ title: "Erreur", variant: "destructive", description: "Échec de la mise à jour" })
    });

    if (isLoading) return <div className="p-10 space-y-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-64 w-full" />
    </div>;

    if (isError || !data) return (
        <div className="flex-1 w-full bg-muted/20 p-10 flex flex-col items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
            <h2 className="text-xl font-bold">Utilisateur non trouvé</h2>
            <Link href="/admin/users">
                <Button variant="ghost" className="mt-4">Retour à la liste</Button>
            </Link>
        </div>
    );

    const { user, profile, wallet, orders, products, subscription } = data;
    const isBanned = profile?.role === "banned";

    return (
        <div className="flex-1 w-full bg-muted/20 p-6 sm:p-10 space-y-8 animate-fade-in">
            {/* Breadcrumb / Back */}
            <Link href="/admin/users">
                <Button variant="ghost" className="pl-0 hover:pl-2 transition-all gap-2 text-muted-foreground mb-4">
                    <ArrowLeft className="w-4 h-4" /> Retour aux utilisateurs
                </Button>
            </Link>

            {/* Header Card */}
            <Card className="border-none shadow-sm bg-background/60 backdrop-blur-sm overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-primary/10 via-primary/5 to-background w-full" />
                <div className="px-8 pb-8 -mt-12 flex flex-col sm:flex-row justify-between items-end gap-6">
                    <div className="flex items-end gap-6">
                        <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                            <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                                {user.firstName?.[0] || user.email[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="mb-2">
                            <h1 className="text-3xl font-bold font-serif flex items-center gap-3">
                                {user.firstName} {user.lastName}
                                <Badge variant={isBanned ? "destructive" : "secondary"} className="text-sm px-3 py-1">
                                    {isBanned ? "Banni" : profile.role === 'shop_owner' ? 'Commerçant' : profile.role === 'supplier' ? 'Fournisseur' : profile.role}
                                </Badge>
                            </h1>
                            <div className="flex flex-wrap gap-4 text-muted-foreground text-sm mt-1">
                                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {user.email}</span>
                                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Inscrit le {new Date(user.createdAt).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {profile.city || "Ville ?"}, {profile.country || "Pays ?"}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 mb-2">
                        {isBanned ? (
                            <Button
                                className="bg-green-600 hover:bg-green-700 shadow-sm"
                                onClick={() => updateUserRoleMutation.mutate({ role: 'shop_owner' })}
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Restaurer l'accès
                            </Button>
                        ) : (
                            <Button
                                variant="destructive"
                                className="shadow-sm"
                                onClick={() => {
                                    if (confirm("Voulez-vous vraiment bannir cet utilisateur ? Il ne pourra plus se connecter."))
                                        updateUserRoleMutation.mutate({ role: 'banned' })
                                }}
                            >
                                <Ban className="w-4 h-4 mr-2" />
                                Bannir l'utilisateur
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Wallet Card */}
                    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="bg-gradient-to-br from-primary to-emerald-700 text-white pb-6 pt-6">
                            <CardTitle className="text-emerald-100 flex justify-between items-center text-base font-medium">
                                <span>Solde Portefeuille</span>
                                <Wallet className="w-5 h-5 opacity-80" />
                            </CardTitle>
                            <div className="text-4xl font-bold mt-2 tracking-tight">{formatPrice(wallet.balance)}</div>
                            <div className="mt-4">
                                <AdminTopUpModal userId={id} />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="p-6">
                                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-4 tracking-wider">Dernières transactions</h4>
                                <div className="space-y-4">
                                    {wallet.transactions.slice(0, 3).map((tx: any) => (
                                        <div key={tx.id} className="flex justify-between items-center text-sm group">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${tx.amount > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                    {tx.amount > 0 ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium max-w-[120px] truncate" title={tx.description}>{tx.description || "Transaction"}</span>
                                                    <span className="text-[10px] text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <span className={`font-bold ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                                                {tx.amount > 0 ? "+" : ""}{formatPrice(tx.amount)}
                                            </span>
                                        </div>
                                    ))}
                                    {wallet.transactions.length === 0 && <span className="text-sm text-muted-foreground text-center block py-2">Aucune transaction</span>}

                                    {wallet.transactions.length > 0 && (
                                        <Button variant="outline" className="w-full text-xs h-8 mt-2">Voir tout l'historique</Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Subscription Card */}
                    {profile.role === "supplier" && (
                        <Card className="shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex justify-between items-center">
                                    <span>Abonnement</span>
                                    <Badge variant={subscription ? (subscription.active ? "default" : "secondary") : "outline"}>
                                        {subscription ? (subscription.active ? "Actif" : "Inactif") : "Aucun"}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {subscription ? (
                                    <>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Plan actuel</p>
                                            <p className="text-xl font-bold text-primary">{subscription.plan.name}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-muted-foreground">Début</p>
                                                <p>{format(new Date(subscription.startDate), "dd MMM yyyy", { locale: fr })}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Fin</p>
                                                <p>{format(new Date(subscription.endDate), "dd MMM yyyy", { locale: fr })}</p>
                                            </div>
                                        </div>
                                        <Separator />
                                    </>
                                ) : (
                                    <div className="text-sm text-muted-foreground py-2 text-center bg-muted/50 rounded-md">
                                        Aucun abonnement actif
                                    </div>
                                )}
                                <AdminSubscriptionModal userId={id} currentUserRole={profile.role} />
                            </CardContent>
                        </Card>
                    )}

                    {/* Business/Contact Info */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Coordonnées</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="flex gap-4">
                                <Building className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium leading-none mb-1">Entreprise</p>
                                    <p className="text-sm text-muted-foreground">{profile.businessName || "Non renseigné"}</p>
                                </div>
                            </div>
                            <Separator />
                            <div className="flex gap-4">
                                <Phone className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium leading-none mb-1">Téléphone</p>
                                    <p className="text-sm text-muted-foreground">{profile.phone || "Non renseigné"}</p>
                                </div>
                            </div>
                            <Separator />
                            <div className="flex gap-4">
                                <MapPin className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium leading-none mb-1">Adresse</p>
                                    <p className="text-sm text-muted-foreground">
                                        {profile.address}<br />
                                        {profile.city}, {profile.country}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Tabs */}
                <div className="lg:col-span-2 space-y-6">
                    <Tabs defaultValue="orders" className="w-full">
                        <TabsList className="w-full justify-start h-auto p-1 bg-background/50 backdrop-blur-sm border rounded-xl overflow-x-auto">
                            <TabsTrigger value="orders" className="rounded-lg py-2 px-4">Commandes ({orders.bought.length})</TabsTrigger>
                            <TabsTrigger value="sales" className="rounded-lg py-2 px-4">Ventes ({orders.sold.length})</TabsTrigger>
                            <TabsTrigger value="products" className="rounded-lg py-2 px-4">Produits ({products.length})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="orders" className="mt-6">
                            <Card className="shadow-sm">
                                <CardHeader>
                                    <CardTitle>Historique d'achats</CardTitle>
                                    <CardDescription>Commandes passées par cet utilisateur</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <OrdersTable orders={orders.bought} type="buy" />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="sales" className="mt-6">
                            <Card className="shadow-sm">
                                <CardHeader>
                                    <CardTitle>Historique de ventes</CardTitle>
                                    <CardDescription>Commandes reçues par ce fournisseur</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <OrdersTable orders={orders.sold} type="sell" />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="products" className="mt-6">
                            <Card className="shadow-sm">
                                <CardHeader>
                                    <CardTitle>Catalogue Produits</CardTitle>
                                    <CardDescription>Produits listés sur la marketplace</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[80px]">Image</TableHead>
                                                    <TableHead>Produit</TableHead>
                                                    <TableHead>Prix</TableHead>
                                                    <TableHead className="text-right">Statut</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {products.map((product: any) => (
                                                    <TableRow key={product.id}>
                                                        <TableCell>
                                                            {product.imageUrl ? (
                                                                <img src={product.imageUrl} className="w-10 h-10 rounded-md object-cover bg-muted" />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                                                                    <Package className="w-5 h-5 text-muted-foreground" />
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="font-medium">{product.name}</TableCell>
                                                        <TableCell>{formatPrice(product.price)}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Badge variant={product.isActive ? "secondary" : "destructive"}>
                                                                {product.isActive ? "Actif" : "Inactif"}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {products.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Aucun produit listé</TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}

function OrdersTable({ orders, type }: { orders: any[], type: "buy" | "sell" }) {
    if (orders.length === 0) {
        return <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">Aucune commande trouvée</div>;
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Référence</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead className="text-right">Statut</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.map((order) => (
                        <TableRow key={order.id}>
                            <TableCell className="font-mono text-xs">
                                {order.id.slice(0, 8)}...
                            </TableCell>
                            <TableCell>
                                {new Date(order.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-medium">
                                {formatPrice(order.totalAmount)}
                            </TableCell>
                            <TableCell className="text-right">
                                <Badge variant="outline" className={`capitalize ${order.status === 'completed' ? 'border-green-500 text-green-600 bg-green-50' :
                                    order.status === 'cancelled' ? 'border-red-500 text-red-600 bg-red-50' :
                                        'border-amber-500 text-amber-600 bg-amber-50'
                                    }`}>
                                    {order.status}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}


