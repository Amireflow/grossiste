
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Package, ShoppingCart, TrendingUp, Store } from "lucide-react";
import { formatPrice } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

export default function AdminDashboard() {
    const { data: stats, isLoading, isError, error } = useQuery<{
        totalUsers: number;
        totalProducts: number;
        totalOrders: number;
        totalRevenue: string;
    }>({
        queryKey: ["/api/admin/stats"],
    });

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

    const { data: chartStats, isLoading: isLoadingCharts } = useQuery<{
        revenueStats: { date: string; revenue: number }[];
        userStats: { role: string; count: number }[];
    }>({
        queryKey: ["/api/admin/stats/charts"],
    });

    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

    return (
        <div className="flex-1 w-full bg-muted/20 p-6 sm:p-10">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-primary/10 rounded-xl">
                    <Store className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-serif font-bold text-foreground">Administration</h1>
                    <p className="text-muted-foreground">Vue d'ensemble de la plateforme</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Utilisateurs Total
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-20" />
                        ) : (
                            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Commerçants et Fournisseurs
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Produits Actifs
                        </CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-20" />
                        ) : (
                            <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Sur la marketplace
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Commandes</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-20" />
                        ) : (
                            <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Depuis le lancement
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Volume d'affaires
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-28" />
                        ) : (
                            <div className="text-2xl font-bold">{formatPrice(parseFloat(stats?.totalRevenue || "0"))}</div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Total ventes générées
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-8">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Revenus (7 derniers jours)</CardTitle>
                        <CardDescription>
                            Évolution du chiffre d'affaires.
                        </CardDescription>
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
                                            itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                                            cursor={{ fill: 'transparent' }}
                                            formatter={(value: number) => [formatPrice(value), "Revenu"]}
                                            labelFormatter={(label) => new Date(label).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                                        />
                                        <Bar
                                            dataKey="revenue"
                                            fill="currentColor"
                                            radius={[4, 4, 0, 0]}
                                            className="fill-primary"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Répartition Utilisateurs</CardTitle>
                        <CardDescription>
                            Par type de compte.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
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
                                            outerRadius={80}
                                            label={(entry) => entry.role}
                                        >
                                            {chartStats?.userStats.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)', color: 'hsl(var(--popover-foreground))' }}
                                            itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
