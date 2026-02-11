
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, MoreVertical, Pencil, Trash2, FolderTree, Image as ImageIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Category, InsertCategory } from "@shared/schema";

export default function AdminCategories() {
    const [search, setSearch] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: categories, isLoading } = useQuery<Category[]>({
        queryKey: ["/api/categories"],
    });

    const createMutation = useMutation({
        mutationFn: async (data: InsertCategory) => {
            const res = await apiRequest("POST", "/api/admin/categories", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
            setIsDialogOpen(false);
            setEditingCategory(null);
            toast({ title: "Succès", description: "Catégorie créée avec succès." });
        },
        onError: () => {
            toast({ title: "Erreur", description: "Impossible de créer la catégorie.", variant: "destructive" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<InsertCategory> }) => {
            const res = await apiRequest("PATCH", `/api/admin/categories/${id}`, data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
            setIsDialogOpen(false);
            setEditingCategory(null);
            toast({ title: "Succès", description: "Catégorie mise à jour." });
        },
        onError: () => {
            toast({ title: "Erreur", description: "Impossible de mettre à jour la catégorie.", variant: "destructive" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiRequest("DELETE", `/api/admin/categories/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
            toast({ title: "Succès", description: "Catégorie supprimée." });
        },
        onError: () => {
            toast({ title: "Erreur", description: "Impossible de supprimer la catégorie.", variant: "destructive" });
        },
    });

    const filteredCategories = categories?.filter((cat) =>
        cat.name.toLowerCase().includes(search.toLowerCase()) ||
        cat.slug.toLowerCase().includes(search.toLowerCase())
    );

    function CategoryForm({ initialData, onSubmit }: { initialData?: Category | null, onSubmit: (data: any) => void }) {
        const [formData, setFormData] = useState({
            name: initialData?.name || "",
            nameFr: initialData?.nameFr || "",
            slug: initialData?.slug || "",
            imageUrl: initialData?.imageUrl || "",
            description: initialData?.description || "",
        });

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            onSubmit(formData);
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Nom (EN)</Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="nameFr">Nom (FR)</Label>
                    <Input
                        id="nameFr"
                        value={formData.nameFr}
                        onChange={(e) => setFormData({ ...formData, nameFr: e.target.value })}
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="imageUrl">URL Image</Label>
                    <Input
                        id="imageUrl"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>
                <div className="flex justify-end pt-4">
                    <Button type="submit">
                        {initialData ? "Mettre à jour" : "Créer"}
                    </Button>
                </div>
            </form>
        );
    }

    return (
        <div className="flex-1 w-full bg-muted/20 p-6 sm:p-10">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <FolderTree className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-foreground">Catégories</h1>
                        <p className="text-muted-foreground">Gérer les catégories de produits</p>
                    </div>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) setEditingCategory(null);
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Nouvelle Catégorie
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingCategory ? "Modifier la catégorie" : "Nouvelle catégorie"}
                            </DialogTitle>
                        </DialogHeader>
                        <CategoryForm
                            initialData={editingCategory}
                            onSubmit={(data) => {
                                if (editingCategory) {
                                    updateMutation.mutate({ id: editingCategory.id, data });
                                } else {
                                    createMutation.mutate(data);
                                }
                            }}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher une catégorie..."
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
                            <TableHead>Nom (FR)</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-10 w-10 rounded-md" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredCategories?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Aucune catégorie trouvée.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCategories?.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell>
                                        {category.imageUrl ? (
                                            <img
                                                src={category.imageUrl}
                                                alt={category.name}
                                                className="h-10 w-10 rounded-md object-cover"
                                            />
                                        ) : (
                                            <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {category.nameFr}
                                        <span className="text-xs text-muted-foreground block font-normal">
                                            {category.name}
                                        </span>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">{category.slug}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm truncate max-w-[200px]">
                                        {category.description}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => {
                                                    setEditingCategory(category);
                                                    setIsDialogOpen(true);
                                                }}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Modifier
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => setCategoryToDelete(category)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Supprimer
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

            <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmation</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer la catégorie "{categoryToDelete?.name}" ?
                            Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => {
                                if (categoryToDelete) {
                                    deleteMutation.mutate(categoryToDelete.id);
                                    setCategoryToDelete(null);
                                }
                            }}
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
}
