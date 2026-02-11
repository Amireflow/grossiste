
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Users, Package, ShoppingCart, TrendingUp, Store,
    CheckCircle2, Truck, AlertCircle, ChevronRight, ClipboardList
} from "lucide-react";
import { formatPrice, ORDER_STATUS_LABELS } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { Link } from "wouter";

// ... AdminDashboard component ... (keeping it for now, will replace next)

function KpiCard({
    icon,
    label,
    value,
    color,
    bg,
    subtext,
    loading,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number | undefined;
    color: string;
    bg: string;
    subtext?: string;
    loading?: boolean;
}) {
    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center ${bg} ${color}`}>
                        {icon}
                    </div>
                </div>
                {loading ? (
                    <Skeleton className="h-7 w-20 mb-1" />
                ) : (
                    <p className="text-xl sm:text-2xl font-bold tracking-tight tabular-nums">{value}</p>
                )}
                {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
            </CardContent>
        </Card>
    );
}



// ... imports and helper components are already there ...

export default function AdminDashboard() {
    const { data: stats, isLoading, isError, error } = useQuery<{
        totalUsers: number;
        totalProducts: number;
        totalOrders: number;
        totalRevenue: string;
    }>({
        queryKey: ["/api/admin/stats"],
    });

    const { data: chartStats, isLoading: isLoadingCharts } = useQuery<{
        revenueStats: { date: string; revenue: number }[];
        userStats: { role: string; count: number }[];
    }>({
        queryKey: ["/api/admin/stats/charts"],
    });

    const { data: activity, isLoading: isLoadingActivity } = useQuery<{
        recentOrders: { id: string; buyerName: string; totalAmount: string; status: string; createdAt: string }[];
        recentUsers: { id: string; email: string; firstName: string; lastName: string; role: string; createdAt: string; profile?: { businessName: string; phone: string } }[];
    }>({
        queryKey: ["/api/admin/dashboard"],
    });

    const COLORS = ["#16a34a", "#ca8a04", "#2563eb", "#dc2626"];

    if (isError) {
        return (
            <div className="flex-1 w-full bg-muted/20 p-6 sm:p-10 flex items-center justify-center">
                <div className="text-center text-destructive">
                    <p className="text-lg font-semibold">Erreur lors du chargement des statistiques</p>
                    <p>{error instanceof Error ? error.message : "Erreur inconnue"}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">Administration</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Vue d'ensemble et gestion de la plateforme
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Actions or filters could go here */}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <KpiCard
                    label="Utilisateurs"
                    icon={<Users className="w-4 h-4" />}
                    value={stats?.totalUsers}
                    subtext="Commerçants & Fournisseurs"
                    loading={isLoading}
                    color="text-blue-600 dark:text-blue-400"
                    bg="bg-blue-100 dark:bg-blue-900/40"
                />
                <KpiCard
                    label="Produits Actifs"
                    icon={<Package className="w-4 h-4" />}
                    value={stats?.totalProducts}
                    subtext="Sur la marketplace"
                    loading={isLoading}
                    color="text-amber-600 dark:text-amber-400"
                    bg="bg-amber-100 dark:bg-amber-900/40"
                />
                <KpiCard
                    label="Commandes"
                    icon={<ShoppingCart className="w-4 h-4" />}
                    value={stats?.totalOrders}
                    subtext="Toutes périodes"
                    loading={isLoading}
                    color="text-purple-600 dark:text-purple-400"
                    bg="bg-purple-100 dark:bg-purple-900/40"
                />
                <KpiCard
                    label="Volume d'affaires"
                    icon={<TrendingUp className="w-4 h-4" />}
                    value={stats?.totalRevenue ? formatPrice(parseFloat(stats.totalRevenue)) : "0"}
                    subtext="Revenus générés"
                    loading={isLoading}
                    color="text-emerald-600 dark:text-emerald-400"
                    bg="bg-emerald-100 dark:bg-emerald-900/40"
                />
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Revenus (7 jours)</CardTitle>
                        <CardDescription>Évolution du chiffre d'affaires quotidien</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            {isLoadingCharts ? (
                                <Skeleton className="h-full w-full" />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartStats?.revenueStats}>
                                        <XAxis
                                            dataKey="date"
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => {
                                                const date = new Date(value);
                                                return date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
                                            }}
                                        />
                                        <YAxis
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `${value}`}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)', color: 'hsl(var(--popover-foreground))' }}
                                            cursor={{ fill: 'transparent' }}
                                            formatter={(value: number) => [formatPrice(value), "Revenu"]}
                                            labelFormatter={(label) => new Date(label).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                                        />
                                        <Bar
                                            dataKey="revenue"
                                            fill="hsl(var(--primary))"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Répartition Utilisateurs</CardTitle>
                        <CardDescription>Par type de compte</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full relative">
                            {isLoadingCharts ? (
                                <Skeleton className="h-full w-full" />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartStats?.userStats}
                                            dataKey="count"
                                            nameKey="role"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                        >
                                            {chartStats?.userStats.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                        <div className="flex justify-center gap-4 mt-4 flex-wrap">
                            {chartStats?.userStats.map((entry, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span className="text-muted-foreground capitalize">{entry.role === 'shop_owner' ? 'Commerçants' : entry.role === 'supplier' ? 'Fournisseurs' : entry.role}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Orders List */}
                <Card className="lg:col-span-2 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div className="space-y-1">
                            <CardTitle className="text-base font-semibold">Dernières Commandes</CardTitle>
                        </div>
                        <Link href="/admin/orders">
                            <Button variant="ghost" size="sm" className="h-8 text-xs">
                                Voir tout <ChevronRight className="w-3 h-3 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {isLoadingActivity ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {activity?.recentOrders.map((order) => {
                                    const statusLabel = ORDER_STATUS_LABELS[order.status] || { label: order.status, color: "bg-gray-100 text-gray-800" };
                                    return (
                                        <Link key={order.id} href="/admin/orders">
                                            <div className="flex items-center justify-between gap-4 p-3 rounded-md hover-elevate cursor-pointer">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-9 h-9 rounded-md bg-muted/50 flex items-center justify-center shrink-0">
                                                        {order.status === "delivered" ? (
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                        ) : order.status === "shipped" ? (
                                                            <Truck className="w-4 h-4 text-blue-500" />
                                                        ) : (
                                                            <Package className="w-4 h-4 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium truncate">#{order.id.slice(0, 8)}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{order.buyerName}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <span className="text-sm font-medium hidden sm:block">
                                                        {formatPrice(parseFloat(order.totalAmount))}
                                                    </span>
                                                    <Badge variant="secondary" className={`text-[10px] ${statusLabel.color}`}>
                                                        {statusLabel.label}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                                {activity?.recentOrders.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground text-sm">Aucune commande récente</div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions & New Users */}
                <div className="space-y-6">


                    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-base font-semibold">Nouveaux Inscrits</CardTitle>
                            <Link href="/admin/users">
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {isLoadingActivity ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {activity?.recentUsers.slice(0, 5).map((user) => (
                                        <Link href={`/admin/users/${user.id}`} key={user.id}>
                                            <div className="flex items-center justify-between gap-4 p-3 rounded-md hover-elevate cursor-pointer">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <Avatar className="h-9 w-9 border shrink-0">
                                                        <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                                                            {user.firstName?.[0] || user.email[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium truncate">
                                                            {user.firstName} {user.lastName}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {user.profile?.businessName || user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <Badge variant="secondary" className="text-[10px] px-1.5 h-4 font-normal">
                                                        {user.role === 'shop_owner' ? 'Commerçant' : user.role === 'supplier' ? 'Fournisseur' : user.role === 'admin' ? 'Admin' : user.role}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                    {activity?.recentUsers.length === 0 && (
                                        <div className="text-center py-4 text-muted-foreground text-sm">Aucun nouvel inscrit</div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}




