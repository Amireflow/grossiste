
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
import { Search, Crown, Eye, Calendar, User as UserIcon } from "lucide-react";
import type { User, UserSubscription, SubscriptionPlan } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type AdminSubscription = UserSubscription & { user: User; plan: SubscriptionPlan };

export default function AdminSubscriptions() {
    const [search, setSearch] = useState("");

    const { data: subscriptions, isLoading, isError, error } = useQuery<AdminSubscription[]>({
        queryKey: ["/api/admin/subscriptions"],
    });

    if (isError) {
        return (
            <div className="flex-1 w-full bg-muted/20 p-6 sm:p-10 flex items-center justify-center">
                <div className="text-center text-destructive">
                    <p className="text-lg font-semibold">Erreur lors du chargement des abonnements</p>
                    <p>{error instanceof Error ? error.message : "Erreur inconnue"}</p>
                </div>
            </div>
        );
    }

    const filteredSubscriptions = subscriptions?.filter((sub) => {
        const term = search.toLowerCase();
        return (
            sub.user.firstName?.toLowerCase().includes(term) ||
            sub.user.lastName?.toLowerCase().includes(term) ||
            sub.user.email?.toLowerCase().includes(term) ||
            sub.plan.name.toLowerCase().includes(term)
        );
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active": return "bg-green-100 text-green-800 hover:bg-green-100";
            case "expired": return "bg-gray-100 text-gray-800 hover:bg-gray-100";
            case "cancelled": return "bg-red-100 text-red-800 hover:bg-red-100";
            default: return "bg-gray-100 text-gray-800 hover:bg-gray-100";
        }
    };

    const translateStatus = (status: string) => {
        switch (status) {
            case "active": return "Actif";
            case "expired": return "Expiré";
            case "cancelled": return "Annulé";
            default: return status;
        }
    };

    return (
        <div className="flex-1 w-full bg-muted/20 p-6 sm:p-10">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-primary/10 rounded-xl">
                    <Crown className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-serif font-bold text-foreground">Abonnements</h1>
                    <p className="text-muted-foreground">Gestion des souscriptions fournisseurs</p>
                </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher par utilisateur ou plan..."
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
                            <TableHead>Utilisateur</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Période</TableHead>
                            <TableHead>Renouvellement</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredSubscriptions?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    Aucun abonnement trouvé.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredSubscriptions?.map((sub) => (
                                <TableRow key={sub.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>
                                                    {sub.user.firstName?.[0] || <UserIcon className="w-4 h-4" />}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {sub.user.firstName} {sub.user.lastName}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {sub.user.email}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {sub.plan.name}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getStatusColor(sub.status)} variant="outline">
                                            {translateStatus(sub.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-xs">
                                            <span className="text-muted-foreground">{sub.startDate ? `Du: ${format(new Date(sub.startDate), "dd MMM yyyy", { locale: fr })}` : ""}</span>
                                            <span>Au: {format(new Date(sub.endDate), "dd MMM yyyy", { locale: fr })}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={sub.autoRenew ? "default" : "secondary"}>
                                            {sub.autoRenew ? "Oui" : "Non"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0" asChild>
                                            <Link href={`/admin/users/${sub.userId}`}>
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
