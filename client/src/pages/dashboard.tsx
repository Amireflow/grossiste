import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  Package, ShoppingCart, ClipboardList, TrendingUp, ArrowRight,
  AlertCircle, Truck, CheckCircle2, BarChart3, Zap, Store,
} from "lucide-react";
import { formatPrice, ORDER_STATUS_LABELS } from "@/lib/constants";
import type { UserProfile, Order } from "@shared/schema";

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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-greeting">{greeting}</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {isSupplier
                ? "Gerez vos produits et suivez vos commandes"
                : "Approvisionnez votre commerce facilement"}
            </p>
          </div>
          {!isSupplier && (
            <Link href="/marketplace">
              <Button size="sm" data-testid="button-explore-catalog">
                Parcourir le marketplace
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statsLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 sm:p-5">
                  <Skeleton className="h-4 w-20 mb-3" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatCard
              icon={<ClipboardList className="w-4 h-4" />}
              label="Commandes"
              value={String(stats?.totalOrders || 0)}
              color="text-blue-600 dark:text-blue-400"
              bg="bg-blue-100 dark:bg-blue-900/40"
              testId="stat-total-orders"
              delay="stagger-1"
            />
            <StatCard
              icon={<AlertCircle className="w-4 h-4" />}
              label="En attente"
              value={String(stats?.pendingOrders || 0)}
              color="text-amber-600 dark:text-amber-400"
              bg="bg-amber-100 dark:bg-amber-900/40"
              testId="stat-pending-orders"
              delay="stagger-2"
            />
            <StatCard
              icon={<Package className="w-4 h-4" />}
              label={isSupplier ? "Produits" : "Articles"}
              value={String(stats?.totalProducts || 0)}
              color="text-emerald-600 dark:text-emerald-400"
              bg="bg-emerald-100 dark:bg-emerald-900/40"
              testId="stat-total-products"
              delay="stagger-3"
            />
            <StatCard
              icon={<TrendingUp className="w-4 h-4" />}
              label={isSupplier ? "Revenus" : "Depense"}
              value={formatPrice(stats?.totalRevenue || "0", profile?.currency || "XOF")}
              color="text-primary"
              bg="bg-primary/15"
              testId="stat-total-revenue"
              delay="stagger-4"
            />
          </>
        )}
      </div>

      <div className={`grid ${isSupplier ? '' : 'lg:grid-cols-5'} gap-4 sm:gap-6`}>
        <Card className={`${isSupplier ? '' : 'lg:col-span-3'} animate-fade-in-up stagger-3`}>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold text-sm">Commandes recentes</h2>
            </div>
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
              <div className="space-y-1">
                {recentOrders.slice(0, 5).map((order) => {
                  const status = ORDER_STATUS_LABELS[order.status || "pending"];
                  return (
                    <Link key={order.id} href="/orders">
                      <div
                        className="flex items-center justify-between gap-4 p-3 rounded-md hover-elevate cursor-pointer"
                        data-testid={`order-row-${order.id}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                            {order.status === "delivered" ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : order.status === "shipped" ? (
                              <Truck className="w-4 h-4 text-blue-500" />
                            ) : (
                              <Package className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              #{order.id.slice(0, 8)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleDateString("fr-FR", {
                                    day: "numeric",
                                    month: "short",
                                  })
                                : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="text-sm font-medium hidden sm:block">
                            {formatPrice(order.totalAmount, order.currency || "XOF")}
                          </span>
                          <Badge variant="secondary" className={`text-[10px] ${status.color}`}>
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium mb-1">Aucune commande</p>
                <p className="text-xs text-muted-foreground mb-4 max-w-[240px] mx-auto">
                  {isSupplier
                    ? "Les commandes de vos clients apparaitront ici"
                    : "Parcourez le marketplace pour passer votre premiere commande"}
                </p>

                {!isSupplier && (
                  <Link href="/marketplace">
                    <Button variant="outline" size="sm" data-testid="button-browse-catalog">
                      Voir le marketplace
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {!isSupplier && (
          <Card className="lg:col-span-2 animate-fade-in-up stagger-4">
            <CardHeader className="pb-4">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                Actions rapides
              </h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <QuickAction
                  icon={<Package className="w-4 h-4" />}
                  title="Parcourir le marketplace"
                  description="Trouvez vos produits"
                  href="/marketplace"
                  testId="quick-browse-catalog"
                  accent="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                />
                <QuickAction
                  icon={<ShoppingCart className="w-4 h-4" />}
                  title="Mon panier"
                  description="Finalisez la commande"
                  href="/cart"
                  testId="quick-view-cart"
                  accent="bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
                />
                <QuickAction
                  icon={<ClipboardList className="w-4 h-4" />}
                  title="Mes commandes"
                  description="Suivi des livraisons"
                  href="/orders"
                  testId="quick-order-history"
                  accent="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  bg,
  testId,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bg: string;
  testId: string;
  delay: string;
}) {
  return (
    <Card className={`animate-fade-in-up ${delay}`}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <p className="text-xs text-muted-foreground">{label}</p>
          <div className={`w-8 h-8 rounded-md flex items-center justify-center ${bg} ${color}`}>
            {icon}
          </div>
        </div>
        <p className="text-xl sm:text-2xl font-bold tracking-tight tabular-nums" data-testid={testId}>{value}</p>
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
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  testId: string;
  accent: string;
}) {
  return (
    <Link href={href}>
      <div className="flex items-center gap-3 p-3 rounded-md hover-elevate cursor-pointer" data-testid={testId}>
        <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${accent}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </div>
    </Link>
  );
}
