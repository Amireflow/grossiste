
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { downloadCSV } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Eye, FileDown } from "lucide-react";
import type { Order } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/constants";
import { Link } from "wouter";

type AdminOrder = Order & { buyerName: string; supplierName: string; itemsCount: number };

export default function AdminOrders() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: orders, isLoading, isError, error } = useQuery<AdminOrder[]>({
        queryKey: ["/api/admin/orders"],
    });

    if (isError) {
        return (
            <div className="flex-1 w-full bg-muted/20 p-6 sm:p-10 flex items-center justify-center">
                <div className="text-center text-destructive">
                    <p className="text-lg font-semibold">Erreur lors du chargement des commandes</p>
                    <p>{error instanceof Error ? error.message : "Erreur inconnue"}</p>
                </div>
            </div>
        );
    }

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            await apiRequest("PATCH", `/api/admin/orders/${id}`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
            toast({
                title: "Succès",
                description: "Le statut de la commande a été mis à jour.",
            });
        },
        onError: () => {
            toast({
                title: "Erreur",
                description: "Impossible de mettre à jour le statut.",
                variant: "destructive",
            });
        },
    });

    const filteredOrders = orders?.filter((order) => {
        const term = search.toLowerCase();
        const matchesSearch = (
            order.id.toLowerCase().includes(term) ||
            order.buyerName.toLowerCase().includes(term) ||
            order.supplierName.toLowerCase().includes(term)
        );
        const matchesStatus = statusFilter === "all" || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
            case "confirmed": return "bg-blue-100 text-blue-800 hover:bg-blue-100";
            case "processing": return "bg-purple-100 text-purple-800 hover:bg-purple-100";
            case "shipped": return "bg-indigo-100 text-indigo-800 hover:bg-indigo-100";
            case "delivered": return "bg-green-100 text-green-800 hover:bg-green-100";
            case "cancelled": return "bg-red-100 text-red-800 hover:bg-red-100";
            default: return "bg-gray-100 text-gray-800 hover:bg-gray-100";
        }
    };

    const traverseStatus = {
        pending: "En attente",
        confirmed: "Confirmée",
        processing: "En cours",
        shipped: "Expédiée",
        delivered: "Livrée",
        cancelled: "Annulée",
    };

    const handleExport = () => {
        if (!filteredOrders) return;
        const data = filteredOrders.map(order => ({
            ID: order.id,
            Client: order.buyerName,
            Fournisseur: order.supplierName,
            Date: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "",
            Montant: order.totalAmount,
            Statut: traverseStatus[(order.status || "pending") as keyof typeof traverseStatus] || order.status
        }));
        downloadCSV(data, "commandes.csv");
    };

    return (
        <div className="flex-1 w-full bg-muted/20 p-6 sm:p-10">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-primary/10 rounded-xl">
                    <ShoppingCart className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-serif font-bold text-foreground">Commandes</h1>
                    <p className="text-muted-foreground">Suivi des transactions</p>
                </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher par ID, client ou fournisseur..."
                        className="pl-9 bg-background"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px] bg-background">
                        <SelectValue placeholder="Filtrer par statut" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="confirmed">Confirmée</SelectItem>
                        <SelectItem value="processing">En cours</SelectItem>
                        <SelectItem value="shipped">Expédiée</SelectItem>
                        <SelectItem value="delivered">Livrée</SelectItem>
                        <SelectItem value="cancelled">Annulée</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" onClick={handleExport}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Exporter
                </Button>
            </div>

            <div className="rounded-md border bg-background">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Réf</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Fournisseur</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Montant</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredOrders?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    Aucune commande trouvée.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredOrders?.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium font-mono text-xs">
                                        {order.id.slice(0, 8)}...
                                    </TableCell>
                                    <TableCell>{order.buyerName}</TableCell>
                                    <TableCell>{order.supplierName}</TableCell>
                                    <TableCell>
                                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-"}
                                    </TableCell>
                                    <TableCell>{formatPrice(Number(order.totalAmount))}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger className="cursor-pointer">
                                                <Badge className={getStatusColor(order.status || "pending")} variant="outline">
                                                    {traverseStatus[(order.status || "pending") as keyof typeof traverseStatus] || order.status}
                                                </Badge>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                {Object.entries(traverseStatus).map(([statusKey, label]) => (
                                                    <DropdownMenuItem
                                                        key={statusKey}
                                                        onClick={() => {
                                                            if (statusKey !== order.status) {
                                                                updateStatusMutation.mutate({
                                                                    id: order.id,
                                                                    status: statusKey
                                                                });
                                                            }
                                                        }}
                                                    >
                                                        {label}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0" asChild>
                                            <Link href={`/orders/${order.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
