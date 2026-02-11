
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { downloadCSV } from "@/lib/utils";
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
import { Search, Store, MoreVertical, Shield, FileDown } from "lucide-react";
import type { User, UserProfile } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type UserWithProfile = User & { profile: UserProfile | null };

export default function AdminUsers() {
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [userToUpdate, setUserToUpdate] = useState<UserWithProfile | null>(null);

    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: users, isLoading } = useQuery<UserWithProfile[]>({
        queryKey: ["/api/admin/users"],
    });

    const updateRoleMutation = useMutation({
        mutationFn: async ({ id, role }: { id: string; role: string }) => {
            await apiRequest("PATCH", `/api/admin/users/${id}`, { role });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            toast({
                title: "Succès",
                description: "Le rôle de l'utilisateur a été mis à jour.",
            });
        },
        onError: () => {
            toast({
                title: "Erreur",
                description: "Impossible de mettre à jour le rôle.",
                variant: "destructive",
            });
        },
    });

    const filteredUsers = users?.filter((user) => {
        const term = search.toLowerCase();
        const matchesSearch = (
            user.email?.toLowerCase().includes(term) ||
            user.firstName?.toLowerCase().includes(term) ||
            user.lastName?.toLowerCase().includes(term) ||
            user.profile?.businessName?.toLowerCase().includes(term)
        );
        const matchesRole = roleFilter === "all" ||
            (roleFilter === "shop_owner" && (!user.profile?.role || user.profile.role === "shop_owner")) ||
            user.profile?.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    const handleExport = () => {
        if (!filteredUsers) return;
        const data = filteredUsers.map(user => ({
            ID: user.id,
            Prénom: user.firstName,
            Nom: user.lastName,
            Email: user.email,
            Rôle: user.profile?.role || "user",
            Business: user.profile?.businessName || "",
            "Date d'inscription": user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "",
        }));
        downloadCSV(data, "utilisateurs.csv");
    };

    return (
        <div className="flex-1 w-full bg-muted/20 p-6 sm:p-10">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-primary/10 rounded-xl">
                    <Shield className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-serif font-bold text-foreground">Utilisateurs</h1>
                    <p className="text-muted-foreground">Gérer les comptes et les accès</p>
                </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher par email, nom..."
                        className="pl-9 bg-background"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[180px] bg-background">
                        <SelectValue placeholder="Filtrer par rôle" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les rôles</SelectItem>
                        <SelectItem value="shop_owner">Commerçants</SelectItem>
                        <SelectItem value="supplier">Fournisseurs</SelectItem>
                        <SelectItem value="admin">Administrateurs</SelectItem>
                        <SelectItem value="banned">Bannis</SelectItem>
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
                            <TableHead>Utilisateur</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rôle</TableHead>
                            <TableHead>Business</TableHead>
                            <TableHead>Inscrit le</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredUsers?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    Aucun utilisateur trouvé.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers?.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">
                                        {user.firstName} {user.lastName}
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            user.profile?.role === "admin" ? "default" :
                                                user.profile?.role === "supplier" ? "secondary" :
                                                    user.profile?.role === "banned" ? "destructive" : "outline"
                                        }>
                                            {user.profile?.role === "admin" ? "Admin" :
                                                user.profile?.role === "supplier" ? "Fournisseur" :
                                                    user.profile?.role === "banned" ? "Banni" : "Commerçant"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {user.profile?.businessName || "-"}
                                    </TableCell>
                                    <TableCell>
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => window.location.href = `/admin/users/${user.id}`}
                                                >
                                                    Voir détails
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className={user.profile?.role === "banned" ? "text-green-600" : "text-destructive"}
                                                    onClick={() => setUserToUpdate(user)}
                                                >
                                                    {user.profile?.role === "banned" ? "Restaurer" : "Bannir"}
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


            <AlertDialog open={!!userToUpdate} onOpenChange={(open) => !open && setUserToUpdate(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmation</AlertDialogTitle>
                        <AlertDialogDescription>
                            {userToUpdate?.profile?.role === "banned"
                                ? "Êtes-vous sûr de vouloir restaurer cet utilisateur ?"
                                : "Êtes-vous sûr de vouloir bannir cet utilisateur ?"}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            className={userToUpdate?.profile?.role === "banned" ? "bg-green-600 hover:bg-green-700" : "bg-destructive hover:bg-destructive/90"}
                            onClick={() => {
                                if (userToUpdate) {
                                    updateRoleMutation.mutate({
                                        id: userToUpdate.id,
                                        role: userToUpdate.profile?.role === "banned" ? "shop_owner" : "banned"
                                    });
                                    setUserToUpdate(null);
                                }
                            }}
                        >
                            {userToUpdate?.profile?.role === "banned" ? "Restaurer" : "Bannir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
}
