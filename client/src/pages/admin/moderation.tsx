import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Check, X, Eye, Package } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatPrice } from "@/lib/constants";
import { Link } from "wouter";

interface PendingProduct {
    id: string;
    name: string;
    description: string;
    price: string;
    imageUrl: string;
    categoryId: string;
    supplierId: string;
    createdAt: string;
    supplierName: string;
    supplierCity: string | null;
    supplierImage: string | null;
}

export default function AdminModeration() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedProduct, setSelectedProduct] = useState<PendingProduct | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

    const { data: products, isLoading } = useQuery<PendingProduct[]>({
        queryKey: ["/api/admin/products/pending"],
    });

    const moderateMutation = useMutation({
        mutationFn: async ({ id, status, reason }: { id: string, status: "active" | "rejected", reason?: string }) => {
            const res = await fetch(`/api/admin/products/${id}/moderate`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, reason }),
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/products/pending"] });
            toast({
                title: "Succès",
                description: "Le statut du produit a été mis à jour.",
            });
            setIsRejectDialogOpen(false);
            setRejectionReason("");
            setSelectedProduct(null);
        },
        onError: (error) => {
            toast({
                title: "Erreur",
                description: "Une erreur est survenue lors de la modération.",
                variant: "destructive",
            });
        },
    });

    const handleApprove = (id: string) => {
        if (confirm("Valider ce produit ?")) {
            moderateMutation.mutate({ id, status: "active" });
        }
    };

    const handleRejectClick = (product: PendingProduct) => {
        setSelectedProduct(product);
        setRejectionReason("");
        setIsRejectDialogOpen(true);
    };

    const handleConfirmReject = () => {
        if (!selectedProduct) return;
        if (!rejectionReason.trim()) {
            toast({
                title: "Erreur",
                description: "Veuillez indiquer une raison pour le rejet.",
                variant: "destructive",
            });
            return;
        }
        moderateMutation.mutate({ id: selectedProduct.id, status: "rejected", reason: rejectionReason });
    };

    return (
        <div className="flex-1 w-full bg-muted/20 p-6 sm:p-10 space-y-8 animate-fade-in">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                    <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">
                        Modération
                    </h1>
                    <p className="text-muted-foreground">Validation des produits en attente</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Produits en attente ({products?.length || 0})</CardTitle>
                    <CardDescription>Examinez et validez les produits soumis par les fournisseurs</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="py-8 text-center text-muted-foreground">Chargement des produits...</div>
                    ) : products?.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground bg-muted/10 rounded-lg">
                            <Check className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                            <p className="text-lg font-medium">Tout est en ordre !</p>
                            <p>Aucun produit en attente de validation.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produit</TableHead>
                                    <TableHead>Fournisseur</TableHead>
                                    <TableHead>Prix</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products?.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {product.imageUrl ? (
                                                    <img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-md object-cover border" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                                                        <Package className="w-6 h-6 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium">{product.name}</div>
                                                    <Link href={`/product/${product.id}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                                                        Voir détails <Eye className="w-3 h-3" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={product.supplierImage || undefined} />
                                                    <AvatarFallback>{product.supplierName[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{product.supplierName}</span>
                                                    <span className="text-xs text-muted-foreground">{product.supplierCity}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{formatPrice(parseFloat(product.price))}</TableCell>
                                        <TableCell>{new Date(product.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleApprove(product.id)}>
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleRejectClick(product)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rejeter le produit</DialogTitle>
                        <DialogDescription>
                            Veuillez indiquer la raison du rejet pour notifier le fournisseur.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Produit : {selectedProduct?.name}</label>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Motif du rejet</label>
                            <Textarea
                                placeholder="Ex: Photo floue, Description incomplète, Contrefaçon..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Annuler</Button>
                        <Button variant="destructive" onClick={handleConfirmReject} disabled={moderateMutation.isPending}>
                            {moderateMutation.isPending ? "Traitement..." : "Rejeter le produit"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
