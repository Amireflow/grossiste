
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatPrice } from "@/lib/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreditCard, TrendingUp, Users, Calendar, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import type { User, UserSubscription, SubscriptionPlan, WalletTransaction } from "@shared/schema";

type AdminSubscription = UserSubscription & { user: User; plan: SubscriptionPlan };
type AdminTransaction = WalletTransaction & { user: User };

export default function AdminSubscriptions() {
    const { data: subscriptions, isLoading: isLoadingSubs } = useQuery<AdminSubscription[]>({
        queryKey: ["/api/admin/subscriptions"],
    });

    const { data: transactions, isLoading: isLoadingTx } = useQuery<AdminTransaction[]>({
        queryKey: ["/api/admin/transactions"],
    });

    const { data: chartStats, isLoading: isLoadingCharts } = useQuery<{
        revenueStats: { date: string; revenue: number }[];
    }>({
        queryKey: ["/api/admin/stats/charts"],
    });

    const { data: stats } = useQuery<{ totalRevenue: string }>({
        queryKey: ["/api/admin/stats"],
    });

    const activeSubs = subscriptions?.filter(s => s.status === "active").length || 0;
    const totalTransactions = transactions?.length || 0;

    return (
        <div className="flex-1 w-full bg-muted/20 p-6 sm:p-10">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-primary/10 rounded-xl">
                    <CreditCard className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-serif font-bold text-foreground">Abonnements & Revenus</h1>
                    <p className="text-muted-foreground">Suivi des abonnements et transactions financières</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Revenu Total</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats ? formatPrice(parseFloat(stats.totalRevenue)) : <Skeleton className="h-8 w-24" />}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total des transactions</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Abonnements Actifs</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{isLoadingSubs ? <Skeleton className="h-8 w-16" /> : activeSubs}</div>
                        <p className="text-xs text-muted-foreground mt-1">Utilisateurs abonnés</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{isLoadingTx ? <Skeleton className="h-8 w-16" /> : totalTransactions}</div>
                        <p className="text-xs text-muted-foreground mt-1">Nombre total de transactions</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                    <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenus (7 derniers jours)</CardTitle>
                            <CardDescription>Évolution du chiffre d'affaires global</CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[350px] w-full">
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
                                            <Bar dataKey="revenue" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="subscriptions">
                    <Card>
                        <CardHeader>
                            <CardTitle>Liste des abonnements</CardTitle>
                            <CardDescription>Tous les abonnements utilisateurs.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Utilisateur</TableHead>
                                        <TableHead>Plan</TableHead>
                                        <TableHead>Statut</TableHead>
                                        <TableHead>Début</TableHead>
                                        <TableHead>Fin</TableHead>
                                        <TableHead>Renouvellement</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingSubs ? (
                                        [...Array(5)].map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                                <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : subscriptions?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">Aucun abonnement trouvé.</TableCell>
                                        </TableRow>
                                    ) : (
                                        subscriptions?.map((sub) => (
                                            <TableRow key={sub.id}>
                                                <TableCell>
                                                    <div className="font-medium">{sub.user.firstName} {sub.user.lastName}</div>
                                                    <div className="text-xs text-muted-foreground">{sub.user.email}</div>
                                                </TableCell>
                                                <TableCell><Badge variant="outline">{sub.plan.name}</Badge></TableCell>
                                                <TableCell>
                                                    <Badge variant={sub.status === "active" ? "default" : "secondary"}>
                                                        {sub.status === "active" ? "Actif" : sub.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{sub.startDate ? new Date(sub.startDate).toLocaleDateString() : "-"}</TableCell>
                                                <TableCell>{new Date(sub.endDate).toLocaleDateString()}</TableCell>
                                                <TableCell>{sub.autoRenew ? "Oui" : "Non"}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="transactions">
                    <Card>
                        <CardHeader>
                            <CardTitle>Historique des transactions</CardTitle>
                            <CardDescription>Toutes les transactions financières.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Utilisateur</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Montant</TableHead>
                                        <TableHead>Description</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingTx ? (
                                        [...Array(5)].map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                                <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : transactions?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">Aucune transaction trouvée.</TableCell>
                                        </TableRow>
                                    ) : (
                                        transactions?.map((tx) => (
                                            <TableRow key={tx.id}>
                                                <TableCell>{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() + " " + new Date(tx.createdAt).toLocaleTimeString() : "-"}</TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{tx.user.firstName} {tx.user.lastName}</div>
                                                    <div className="text-xs text-muted-foreground">{tx.user.email}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {tx.type === "topup" ? "Rechargement" :
                                                            tx.type === "subscription_payment" ? "Abonnement" :
                                                                tx.type === "boost_charge" ? "Boost" : tx.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className={tx.type === "topup" ? "text-green-600 font-medium" : "text-destructive font-medium"}>
                                                    {tx.type === "topup" ? "+" : "-"}{formatPrice(Number(tx.amount))}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">{tx.description}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
