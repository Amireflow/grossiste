
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    ArrowLeft, User, Mail, MapPin, Phone, Store, Package,
    ShoppingCart, Wallet, Crown, Calendar,
} from "lucide-react";
import { formatPrice } from "@/lib/constants";
import type { UserProfile, Product, Order, OrderItem, UserSubscription, SubscriptionPlan } from "@shared/schema";

type UserDetail = {
    profile: UserProfile | null;
    orders: (Order & { items: OrderItem[] })[];
    products: Product[];
    walletBalance: string;
    subscription: (UserSubscription & { plan: SubscriptionPlan }) | null;
};

export default function AdminUserDetail() {
    const { id } = useParams<{ id: string }>();

    const { data, isLoading, isError } = useQuery<UserDetail>({
        queryKey: [`/api/admin/users/${id}`],
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="flex-1 w-full bg-muted/20 p-6 sm:p-10 space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid gap-4 md:grid-cols-3">
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                </div>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="flex-1 w-full bg-muted/20 p-6 sm:p-10 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-lg font-semibold text-destructive">Utilisateur non trouvé</p>
                    <Button variant="outline" className="mt-4" asChild>
                        <Link href="/admin/users"><ArrowLeft className="w-4 h-4 mr-2" /> Retour</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const { profile, orders, products, walletBalance, subscription } = data;

    const getRoleBadge = (role?: string) => {
        switch (role) {
            case "admin": return <Badge>Admin</Badge>;
            case "supplier": return <Badge variant="secondary">Fournisseur</Badge>;
            case "banned": return <Badge variant="destructive">Banni</Badge>;
            default: return <Badge variant="outline">Commerçant</Badge>;
        }
    };

    const totalSpent = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    return (
        <div className="flex-1 w-full bg-muted/20 p-6 sm:p-10">
            <div className="flex items-center gap-3 mb-8">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/users"><ArrowLeft className="w-5 h-5" /></Link>
                </Button>
                <div className="p-3 bg-primary/10 rounded-xl">
                    <User className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                    <h1 className="text-3xl font-serif font-bold text-foreground">
                        {profile?.businessName || "Utilisateur"}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        {getRoleBadge(profile?.role || undefined)}
                        {profile?.city && (
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {profile.city}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Solde Wallet</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPrice(Number(walletBalance || 0))}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Commandes</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{orders.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total dépensé : {formatPrice(totalSpent)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Produits</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{products.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {products.filter(p => p.isActive).length} actifs
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Abonnement</CardTitle>
                        <Crown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {subscription ? (
                            <>
                                <div className="text-2xl font-bold">{subscription.plan.name}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Expire le {new Date(subscription.endDate).toLocaleDateString("fr-FR")}
                                </p>
                            </>
                        ) : (
                            <div className="text-sm text-muted-foreground">Aucun abonnement</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Profile Info */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Store className="w-5 h-5" /> Informations du profil
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Email :</span>
                                <span>{profile?.userId || "-"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Téléphone :</span>
                                <span>{profile?.phone || "-"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Ville :</span>
                                <span>{profile?.city || "-"}, {profile?.country || "-"}</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Inscrit le :</span>
                                <span>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("fr-FR") : "-"}</span>
                            </div>
                            {profile?.description && (
                                <div className="text-sm">
                                    <span className="text-muted-foreground">Description : </span>
                                    <span>{profile.description}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Orders */}
            {orders.length > 0 && (
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5" /> Commandes récentes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Réf</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Montant</TableHead>
                                    <TableHead>Statut</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.slice(0, 10).map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                                        <TableCell>{order.createdAt ? new Date(order.createdAt).toLocaleDateString("fr-FR") : "-"}</TableCell>
                                        <TableCell>{formatPrice(Number(order.totalAmount))}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{order.status}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Products */}
            {products.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="w-5 h-5" /> Produits ({products.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[60px]">Image</TableHead>
                                    <TableHead>Nom</TableHead>
                                    <TableHead>Prix</TableHead>
                                    <TableHead>Statut</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.slice(0, 10).map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell>
                                            {product.imageUrl ? (
                                                <img src={product.imageUrl} alt={product.name} className="h-10 w-10 rounded-md object-cover" />
                                            ) : (
                                                <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                                                    <Package className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell>{formatPrice(Number(product.price))}</TableCell>
                                        <TableCell>
                                            <Badge variant={product.isActive ? "default" : "destructive"}>
                                                {product.isActive ? "Actif" : "Inactif"}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
