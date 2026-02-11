
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";
import { Loader2, TrendingUp, AlertCircle, Package } from "lucide-react";
import { formatPrice } from "@/lib/constants";

export default function AdminAnalytics() {
    const [deadStockDays, setDeadStockDays] = useState("90");

    const { data: forecastData, isLoading: isLoadingForecast } = useQuery<any>({
        queryKey: ["/api/admin/analytics/forecast"],
    });

    const { data: abcData, isLoading: isLoadingABC } = useQuery<any>({
        queryKey: ["/api/admin/analytics/abc"],
    });

    const { data: deadStockData, isLoading: isLoadingDeadStock } = useQuery<any>({
        queryKey: ["/api/admin/analytics/dead-stock", deadStockDays],
        queryFn: async () => {
            const res = await fetch(`/api/admin/analytics/dead-stock?days=${deadStockDays}`);
            if (!res.ok) throw new Error("Failed to fetch dead stock");
            return res.json();
        }
    });

    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

    if (isLoadingForecast || isLoadingABC) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Prepare Forecast Data
    const chartData = [
        ...(forecastData?.history || []).map((d: any) => ({ ...d, type: "Historique" })),
        ...(forecastData?.forecast || []).map((d: any) => ({ ...d, type: "Prévision" }))
    ];

    // Prepare ABC Data for Pie Chart
    const abcPieData = abcData?.distribution ? [
        { name: "Classe A (80% Revenus)", value: abcData.distribution.A },
        { name: "Classe B (15% Revenus)", value: abcData.distribution.B },
        { name: "Classe C (5% Revenus)", value: abcData.distribution.C },
    ] : [];

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Analytics Avancés</h2>
            </div>

            <Tabs defaultValue="forecast" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="forecast">Prévisions des Ventes</TabsTrigger>
                    <TabsTrigger value="abc">Analyse ABC</TabsTrigger>
                    <TabsTrigger value="dead-stock">Stock Dormant</TabsTrigger>
                </TabsList>

                <TabsContent value="forecast" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Prévisions des Ventes (30 jours)</CardTitle>
                            <CardDescription>
                                Analyse de tendance basée sur la régression linéaire des ventes passées.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(value) => new Date(value).toLocaleDateString()}
                                        />
                                        <YAxis />
                                        <Tooltip
                                            formatter={(value: number) => formatPrice(value)}
                                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#8884d8"
                                            name="Revenus"
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-4 flex gap-4 text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                <p>
                                    Tendance actuelle:
                                    <span className={forecastData?.trend?.slope > 0 ? "text-green-600 font-bold ml-1" : "text-red-600 font-bold ml-1"}>
                                        {forecastData?.trend?.slope > 0 ? "Croissance" : "Décroissance"}
                                    </span>
                                    {' '}avec une pente de {forecastData?.trend?.slope?.toFixed(2)}.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="abc" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Classement des Produits</CardTitle>
                                <CardDescription>
                                    Classification des produits selon le principe de Pareto (80/20).
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Produit</TableHead>
                                            <TableHead>Revenus</TableHead>
                                            <TableHead>% Total</TableHead>
                                            <TableHead>Classe</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {abcData?.items?.slice(0, 10).map((item: any) => (
                                            <TableRow key={item.productId}>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell>{formatPrice(item.revenue)}</TableCell>
                                                <TableCell>{item.percentage.toFixed(1)}%</TableCell>
                                                <TableCell>
                                                    <Badge variant={item.category === 'A' ? "default" : item.category === 'B' ? "secondary" : "outline"}>
                                                        Classe {item.category}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <p className="text-xs text-muted-foreground mt-4 text-center">
                                    Affichage des 10 premiers produits.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Distribution ABC</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={abcPieData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {abcPieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-2 mt-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-3 h-3 bg-[#0088FE] rounded-full"></div>
                                        <span>Classe A: 80% des revenus (Top performants)</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-3 h-3 bg-[#00C49F] rounded-full"></div>
                                        <span>Classe B: 15% des revenus (Intermédiaires)</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-3 h-3 bg-[#FFBB28] rounded-full"></div>
                                        <span>Classe C: 5% des revenus (Faible performance)</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="dead-stock" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Stock Dormant</CardTitle>
                                    <CardDescription>Produits sans vente depuis une période donnée.</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">Inactif depuis:</span>
                                    <Select value={deadStockDays} onValueChange={setDeadStockDays}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Période" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="30">30 jours</SelectItem>
                                            <SelectItem value="60">60 jours</SelectItem>
                                            <SelectItem value="90">90 jours</SelectItem>
                                            <SelectItem value="180">6 mois</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoadingDeadStock ? (
                                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                            ) : deadStockData?.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                                    <Package className="h-12 w-12 mb-4 opacity-50" />
                                    <p>Aucun stock dormant trouvé pour cette période. Bravo !</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Produit</TableHead>
                                            <TableHead>Dernière Commande</TableHead>
                                            <TableHead>Jours Inactif</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {deadStockData?.map((item: any) => (
                                            <TableRow key={item.productId}>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell>
                                                    {item.lastOrderDate
                                                        ? new Date(item.lastOrderDate).toLocaleDateString()
                                                        : "Jamais vendu"}
                                                </TableCell>
                                                <TableCell className="font-bold text-red-500">
                                                    {item.daysInactive} jours
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="destructive">Critique</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
