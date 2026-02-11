
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Search, Banknote, Eye, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import type { User, WalletTransaction } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatPrice } from "@/lib/constants";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type AdminTransaction = WalletTransaction & { user: User };

export default function AdminFinance() {
    const [search, setSearch] = useState("");

    const { data: transactions, isLoading, isError, error } = useQuery<AdminTransaction[]>({
        queryKey: ["/api/admin/transactions"],
    });

    if (isError) {
        return (
            <div className="flex-1 w-full bg-muted/20 p-6 sm:p-10 flex items-center justify-center">
                <div className="text-center text-destructive">
                    <p className="text-lg font-semibold">Erreur lors du chargement des transactions</p>
                    <p>{error instanceof Error ? error.message : "Erreur inconnue"}</p>
                </div>
            </div>
        );
    }

    const filteredTransactions = transactions?.filter((tx) => {
        const term = search.toLowerCase();
        return (
            tx.user.firstName?.toLowerCase().includes(term) ||
            tx.user.lastName?.toLowerCase().includes(term) ||
            tx.user.email?.toLowerCase().includes(term) ||
            tx.description?.toLowerCase().includes(term) || false
        );
    });

    const getTypeColor = (type: string) => {
        switch (type) {
            case "topup": return "text-green-600 bg-green-50 border-green-200";
            case "refund": return "text-purple-600 bg-purple-50 border-purple-200";
            case "boost_charge":
            case "subscription_payment": return "text-blue-600 bg-blue-50 border-blue-200";
            default: return "text-gray-600 bg-gray-50 border-gray-200";
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "topup": return "Dépôt";
            case "refund": return "Remboursement";
            case "boost_charge": return "Boost";
            case "subscription_payment": return "Abonnement";
            default: return type;
        }
    };

    return (
        <div className="flex-1 w-full bg-muted/20 p-6 sm:p-10">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-primary/10 rounded-xl">
                    <Banknote className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-serif font-bold text-foreground">Finance</h1>
                    <p className="text-muted-foreground">Suivi des transactions et crédits</p>
                </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher par utilisateur ou description..."
                        className="pl-9 bg-background"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border bg-background">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Utilisateur</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Montant</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredTransactions?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    Aucune transaction trouvée.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTransactions?.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell className="text-muted-foreground font-mono text-xs">
                                        {format(new Date(tx.createdAt as any), "dd MMM yyyy, HH:mm", { locale: fr })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>
                                                    {tx.user.firstName?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {tx.user.firstName} {tx.user.lastName}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`${getTypeColor(tx.type)} border`}>
                                            {tx.type === 'topup' || tx.type === 'refund' ? <ArrowDownLeft className="w-3 h-3 mr-1" /> : <ArrowUpRight className="w-3 h-3 mr-1" />}
                                            {getTypeLabel(tx.type)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className={`font-mono font-medium ${tx.amount.startsWith('-') ? 'text-red-600' : 'text-green-600'}`}>
                                        {formatPrice(Number(tx.amount))}
                                    </TableCell>
                                    <TableCell className="max-w-[300px] truncate" title={tx.description || undefined}>
                                        {tx.description}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0" asChild>
                                            <Link href={`/admin/users/${tx.userId}`}>
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
