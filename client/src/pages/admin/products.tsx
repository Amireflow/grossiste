
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { Search, Package, MoreVertical, Store, ExternalLink } from "lucide-react";
import type { Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/constants";
import { Link } from "wouter";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AdminProduct = Product & { supplierName: string; categoryName: string };

export default function AdminProducts() {
    const [search, setSearch] = useState("");

    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: products, isLoading } = useQuery<AdminProduct[]>({
        queryKey: ["/api/admin/products"],
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
            await apiRequest("PATCH", `/api/admin/products/${id}`, { isActive });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
            toast({
                title: "Succès",
                description: "Le statut du produit a été mis à jour.",
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

    const filteredProducts = products?.filter((product) => {
        const term = search.toLowerCase();
        return (
            product.name.toLowerCase().includes(term) ||
            product.supplierName.toLowerCase().includes(term) ||
            product.categoryName.toLowerCase().includes(term)
        );
    });

    return (
        <div className="flex-1 w-full bg-muted/20 p-6 sm:p-10">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-primary/10 rounded-xl">
                    <Package className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-serif font-bold text-foreground">Produits</h1>
                    <p className="text-muted-foreground">Gestion du catalogue marketplace</p>
                </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher un produit..."
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
                            <TableHead className="w-[80px]">Image</TableHead>
                            <TableHead>Produit</TableHead>
                            <TableHead>Prix</TableHead>
                            <TableHead>Catégorie</TableHead>
                            <TableHead>Fournisseur</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-10 w-10 rounded-md" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredProducts?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    Aucun produit trouvé.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProducts?.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        {product.imageUrl ? (
                                            <img
                                                src={product.imageUrl}
                                                alt={product.name}
                                                className="h-10 w-10 rounded-md object-cover"
                                            />
                                        ) : (
                                            <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                                                <Package className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {product.name}
                                    </TableCell>
                                    <TableCell>{formatPrice(Number(product.price))}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{product.categoryName}</Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {product.supplierName}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={product.isActive ? "default" : "destructive"}>
                                            {product.isActive ? "Actif" : "Inactif"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/product/${product.id}`}>
                                                        <span className="flex items-center cursor-pointer">
                                                            <ExternalLink className="mr-2 h-4 w-4" />
                                                            Voir fiche
                                                        </span>
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className={product.isActive ? "text-destructive" : "text-green-600"}
                                                    onClick={() => {
                                                        if (confirm(`Êtes-vous sûr de vouloir ${product.isActive ? 'désactiver' : 'activer'} ce produit ?`)) {
                                                            updateStatusMutation.mutate({
                                                                id: product.id,
                                                                isActive: !product.isActive
                                                            });
                                                        }
                                                    }}
                                                >
                                                    {product.isActive ? "Désactiver" : "Activer"}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
