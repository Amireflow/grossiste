import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, User, MapPin, Phone, Store, Building2, Globe, Wallet, LogOut } from "lucide-react";
import { COUNTRIES } from "@/lib/constants";
import type { UserProfile } from "@shared/schema";

const profileSchema = z.object({
    businessName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    phone: z.string().min(8, "Numéro de téléphone invalide"),
    address: z.string().optional(),
    city: z.string().min(2, "Ville requise"),
    country: z.string().min(2, "Pays requis"),
    description: z.string().optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);

    const { data: profile, isLoading } = useQuery<UserProfile>({
        queryKey: ["/api/profile"],
    });

    const form = useForm<ProfileValues>({
        resolver: zodResolver(profileSchema),
        values: {
            businessName: profile?.businessName || "",
            phone: profile?.phone || "",
            address: profile?.address || "",
            city: profile?.city || "",
            country: profile?.country || "Bénin",
            description: profile?.description || "",
        },
    });

    const updateProfile = useMutation({
        mutationFn: async (data: ProfileValues) => {
            const res = await apiRequest("PATCH", "/api/profile", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
            toast({ title: "Profil mis à jour", description: "Vos informations ont été enregistrées." });
            setIsEditing(false);
        },
        onError: () => {
            toast({ title: "Erreur", description: "Impossible de mettre à jour le profil", variant: "destructive" });
        },
    });

    if (isLoading) {
        return <div className="p-8"><Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" /></div>;
    }

    const initials = user
        ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U"
        : "U";

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-serif tracking-tight">Mon Profil</h1>
                    <p className="text-muted-foreground text-sm">Gérez vos informations personnelles et professionnelles</p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => logout()} className="shadow-sm">
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Identity & Status */}
                <div className="space-y-6">
                    <Card className="overflow-hidden border-none shadow-sm">
                        <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 relative">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        </div>
                        <CardContent className="pt-0 relative px-6 pb-6">
                            <div className="relative px-6">
                                <div className="flex flex-col items-center -mt-12 mb-6">
                                    <div className="w-24 h-24 rounded-full border-4 border-background bg-muted flex items-center justify-center text-4xl font-bold text-primary shadow-sm mb-4">
                                        {initials}
                                    </div>

                                    <div className="text-center space-y-1">
                                        <h1 className="text-2xl font-bold">{profile?.businessName || user?.firstName || "Utilisateur"}</h1>
                                        <p className="text-muted-foreground">{user?.email}</p>
                                    </div>
                                </div>
                            </div>

                            <Separator className="my-6" />

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-sm group">
                                    <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                        <MapPin className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                    </div>
                                    <span className="truncate text-muted-foreground">{profile?.city || "Ville non renseignée"}, {profile?.country}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm group">
                                    <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                        <Phone className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                    </div>
                                    <span className="text-muted-foreground">{profile?.phone || "Sans téléphone"}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm group">
                                    <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                        <Globe className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                    </div>
                                    <span className="text-muted-foreground">{profile?.currency} (Devise)</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Wallet Summary Card */}
                    <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-900 to-emerald-800 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                            <Wallet className="w-24 h-24" />
                        </div>
                        <CardContent className="p-6 relative z-10">
                            <p className="text-emerald-100 text-sm font-medium mb-1">Solde Portefeuille</p>
                            <div className="text-3xl font-bold mb-4">
                                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: profile?.currency || 'XOF' }).format(Number(profile?.walletBalance || 0))}
                            </div>
                            <Button size="sm" variant="secondary" className="w-full bg-white/10 hover:bg-white/20 text-white border-0" onClick={() => window.location.href = '/wallet'}>
                                Recharger
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Information Form */}
                <div className="lg:col-span-2">
                    <Card className="border-none shadow-sm h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" />
                                Informations Personnelles
                            </CardTitle>
                            <CardDescription>
                                Mettez à jour les informations de votre entreprise pour vos factures et livraisons.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={form.handleSubmit((data) => updateProfile.mutate(data))} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="businessName">Nom de l'entreprise / Boutique</Label>
                                    <div className="relative">
                                        <Store className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input id="businessName" className="pl-9 shadow-sm bg-muted/20" {...form.register("businessName")} />
                                    </div>
                                    {form.formState.errors.businessName && <p className="text-xs text-red-500">{form.formState.errors.businessName.message}</p>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">Téléphone</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input id="phone" className="pl-9 shadow-sm bg-muted/20" {...form.register("phone")} />
                                        </div>
                                        {form.formState.errors.phone && <p className="text-xs text-red-500">{form.formState.errors.phone.message}</p>}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="country">Pays</Label>
                                        <Select
                                            onValueChange={(val) => form.setValue("country", val)}
                                            defaultValue={form.getValues("country")}
                                        >
                                            <SelectTrigger className="shadow-sm bg-muted/20">
                                                <SelectValue placeholder="Pays" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {COUNTRIES.map((c) => (
                                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="city">Ville</Label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input id="city" className="pl-9 shadow-sm bg-muted/20" {...form.register("city")} />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="address">Adresse</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input id="address" className="pl-9 shadow-sm bg-muted/20" {...form.register("address")} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        className="shadow-sm bg-muted/20 min-h-[100px] resize-none"
                                        placeholder="Décrivez votre activité..."
                                        {...form.register("description")}
                                    />
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={updateProfile.isPending} className="shadow-sm">
                                        {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                        Enregistrer les modifications
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
