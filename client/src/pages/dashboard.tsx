import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Package, ShoppingCart, ClipboardList, TrendingUp, ArrowRight, AlertCircle } from "lucide-react";
import { formatPrice, ORDER_STATUS_LABELS } from "@/lib/constants";
import type { UserProfile, Order, Product } from "@shared/schema";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: profile } = useQuery<UserProfile>({ queryKey: ["/api/profile"] });
  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalOrders: number;
    pendingOrders: number;
    totalProducts: number;
    totalRevenue: string;
  }>({ queryKey: ["/api/stats"] });
  const { data: recentOrders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const isSupplier = profile?.role === "supplier";
  const greeting = user?.firstName
    ? `Bonjour, ${user.firstName}`
    : "Bienvenue";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold" data-testid="text-greeting">{greeting}</h1>
        <p className="text-muted-foreground mt-1">
          {isSupplier
            ? "Gérez vos produits et suivez vos commandes"
            : "Approvisionnez votre commerce facilement"}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-3" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatCard
              icon={<ClipboardList className="w-4 h-4" />}
              label="Commandes totales"
              value={String(stats?.totalOrders || 0)}
              testId="stat-total-orders"
            />
            <StatCard
              icon={<AlertCircle className="w-4 h-4" />}
              label="En attente"
              value={String(stats?.pendingOrders || 0)}
              highlight
              testId="stat-pending-orders"
            />
            <StatCard
              icon={<Package className="w-4 h-4" />}
              label={isSupplier ? "Produits actifs" : "Produits commandés"}
              value={String(stats?.totalProducts || 0)}
              testId="stat-total-products"
            />
            <StatCard
              icon={<TrendingUp className="w-4 h-4" />}
              label={isSupplier ? "Chiffre d'affaires" : "Total dépensé"}
              value={formatPrice(stats?.totalRevenue || "0", profile?.currency || "XOF")}
              testId="stat-total-revenue"
            />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
            <h2 className="font-semibold">Commandes récentes</h2>
            <Link href="/orders">
              <Button variant="ghost" size="sm" data-testid="link-view-all-orders">
                Voir tout
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.slice(0, 5).map((order) => {
                  const status = ORDER_STATUS_LABELS[order.status || "pending"];
                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between gap-4 py-3 border-b last:border-0"
                      data-testid={`order-row-${order.id}`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          Commande #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString("fr-FR")
                            : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-medium">
                          {formatPrice(order.totalAmount, order.currency || "XOF")}
                        </span>
                        <Badge variant="secondary" className={`text-xs ${status.color}`}>
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <ClipboardList className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Aucune commande pour le moment</p>
                {!isSupplier && (
                  <Link href="/catalog">
                    <Button variant="outline" size="sm" className="mt-3" data-testid="button-browse-catalog">
                      Parcourir le catalogue
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
            <h2 className="font-semibold">Actions rapides</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isSupplier ? (
                <>
                  <QuickAction
                    icon={<Package className="w-4 h-4" />}
                    title="Ajouter un produit"
                    description="Ajoutez un nouveau produit à votre catalogue"
                    href="/products/new"
                    testId="quick-add-product"
                  />
                  <QuickAction
                    icon={<ClipboardList className="w-4 h-4" />}
                    title="Gérer les commandes"
                    description="Consultez et traitez les commandes en cours"
                    href="/orders"
                    testId="quick-manage-orders"
                  />
                </>
              ) : (
                <>
                  <QuickAction
                    icon={<Package className="w-4 h-4" />}
                    title="Parcourir le catalogue"
                    description="Trouvez les produits dont vous avez besoin"
                    href="/catalog"
                    testId="quick-browse-catalog"
                  />
                  <QuickAction
                    icon={<ShoppingCart className="w-4 h-4" />}
                    title="Mon panier"
                    description="Consultez et finalisez votre commande"
                    href="/cart"
                    testId="quick-view-cart"
                  />
                  <QuickAction
                    icon={<ClipboardList className="w-4 h-4" />}
                    title="Historique des commandes"
                    description="Suivez vos commandes passées"
                    href="/orders"
                    testId="quick-order-history"
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight,
  testId,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
  testId: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-8 h-8 rounded-md flex items-center justify-center ${highlight ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" : "bg-primary/10 text-primary"}`}>
            {icon}
          </div>
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <p className="text-2xl font-bold" data-testid={testId}>{value}</p>
      </CardContent>
    </Card>
  );
}

function QuickAction({
  icon,
  title,
  description,
  href,
  testId,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  testId: string;
}) {
  return (
    <Link href={href}>
      <div className="flex items-center gap-3 p-3 rounded-md hover-elevate cursor-pointer" data-testid={testId}>
        <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 ml-auto" />
      </div>
    </Link>
  );
}
