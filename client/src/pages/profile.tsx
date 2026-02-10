import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
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
import { Loader2, Save, User, MapPin, Phone, Store, Building2, Globe, Wallet, LogOut, Camera } from "lucide-react";
import { COUNTRIES } from "@/lib/constants";
import type { UserProfile } from "@shared/schema";

const profileSchema = z.object({
    businessName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    phone: z.string().min(8, "Numéro de téléphone invalide"),
    address: z.string().optional(),
    city: z.string().min(2, "Ville requise"),
    country: z.string().min(2, "Pays requis"),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            imageUrl: user?.profileImageUrl || "",
        },
    });

    const updateProfile = useMutation({
        mutationFn: async (data: ProfileValues) => {
            console.log("Sending profile update:", data);
            const res = await apiRequest("PATCH", "/api/profile", data);
            if (!res.ok) {
                const text = await res.text();
                console.error("Profile update failed:", res.status, text);
                throw new Error(text);
            }
            const json = await res.json();
            console.log("Profile update success:", json);
            return json;
        },
        onSuccess: () => {
            console.log("updateProfile onSuccess triggered");
            queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
            queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            toast({ title: "Profil mis à jour", description: "Vos informations ont été enregistrées." });
            setIsEditing(false);
        },
        onError: (error) => {
            console.error("updateProfile onError triggered:", error);
            toast({ title: "Erreur", description: "Impossible de mettre à jour le profil", variant: "destructive" });
        },
    });

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("image", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
                credentials: "include",
            });

            if (!res.ok) throw new Error("Upload failed");

            const data = await res.json();
            // Update profile with new image URL immediately
            updateProfile.mutate({ ...form.getValues(), imageUrl: data.url });
        } catch (error) {
            toast({ title: "Erreur", description: "Échec du téléchargement de l'image", variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    if (isLoading) {
        return <div className="p-8"><Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" /></div>;
    }

    const initials = user
        ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U"
        : "U";

    return (
        <div className="max-w-5xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold font-serif tracking-tight">Mon Profil</h1>
                    <p className="text-muted-foreground text-xs sm:text-sm">Gérez vos informations personnelles</p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => logout()} className="h-8 text-xs shadow-sm rounded-full px-3">
                    <LogOut className="w-3.5 h-3.5 mr-1.5" />
                    Déconnexion
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Left Column: Identity & Status */}
                <div className="space-y-4 sm:space-y-6">
                    <Card className="overflow-hidden border-border/50 shadow-sm rounded-2xl">
                        <div className="h-24 sm:h-32 bg-gradient-to-br from-primary/20 to-primary/5 relative">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        </div>
                        <CardContent className="pt-0 relative px-4 pb-4 sm:px-6 sm:pb-6">
                            <div className="relative px-2">
                                <div className="flex flex-col items-center -mt-10 sm:-mt-12 mb-4 sm:mb-6">
                                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                        <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-background shadow-sm">
                                            <AvatarImage src={user?.profileImageUrl || ""} alt="Profile" className="object-cover" />
                                            <AvatarFallback className="text-3xl sm:text-4xl font-bold text-primary bg-muted">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            {isUploading ? (
                                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                                            ) : (
                                                <Camera className="w-6 h-6 text-white" />
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={isUploading}
                                        />
                                    </div>

                                    <div className="text-center space-y-0.5 mt-3">
                                        <h1 className="text-xl sm:text-2xl font-bold">{profile?.businessName || user?.firstName || "Utilisateur"}</h1>
                                        <p className="text-xs sm:text-sm text-muted-foreground">{user?.email}</p>
                                    </div>
                                </div>
                            </div>

                            <Separator className="my-4 sm:my-6" />

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm group">
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-primary" />
                                    </div>
                                    <span className="truncate text-muted-foreground text-xs sm:text-sm">{profile?.city || "Ville non renseignée"}, {profile?.country}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm group">
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                        <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-primary" />
                                    </div>
                                    <span className="text-muted-foreground text-xs sm:text-sm">{profile?.phone || "Sans téléphone"}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm group">
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                        <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-primary" />
                                    </div>
                                    <span className="text-muted-foreground text-xs sm:text-sm">{profile?.currency} (Devise)</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Wallet Summary Card */}
                    <Card className="border-none shadow-sm rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-800 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                            <Wallet className="w-20 h-20 sm:w-24 sm:h-24" />
                        </div>
                        <CardContent className="p-4 sm:p-6 relative z-10">
                            <p className="text-emerald-100 text-xs sm:text-sm font-medium mb-1">Solde Portefeuille</p>
                            <div className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
                                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: profile?.currency || 'XOF' }).format(Number(profile?.walletBalance || 0))}
                            </div>
                            <Button size="sm" variant="secondary" className="w-full h-8 sm:h-9 text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white border-0 rounded-full" onClick={() => window.location.href = '/wallet'}>
                                Recharger
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Information Form */}
                <div className="lg:col-span-2">
                    <Card className="border-border/50 shadow-sm h-full rounded-2xl">
                        <CardHeader className="p-4 sm:p-6 pb-2">
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                                Informations Personnelles
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                Mettez à jour les informations de votre entreprise pour vos factures et livraisons.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 pt-2">
                            <form onSubmit={form.handleSubmit((data) => updateProfile.mutate(data))} className="space-y-3 sm:space-y-4">
                                <div className="grid gap-1.5 sm:gap-2">
                                    <Label htmlFor="businessName" className="text-xs sm:text-sm">Nom de l'entreprise / Boutique</Label>
                                    <div className="relative">
                                        <Store className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input id="businessName" className="pl-9 h-9 sm:h-10 text-sm shadow-sm bg-muted/20 border-border/60 rounded-xl" {...form.register("businessName")} />
                                    </div>
                                    {form.formState.errors.businessName && <p className="text-xs text-red-500">{form.formState.errors.businessName.message}</p>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div className="grid gap-1.5 sm:gap-2">
                                        <Label htmlFor="phone" className="text-xs sm:text-sm">Téléphone</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input id="phone" className="pl-9 h-9 sm:h-10 text-sm shadow-sm bg-muted/20 border-border/60 rounded-xl" {...form.register("phone")} />
                                        </div>
                                        {form.formState.errors.phone && <p className="text-xs text-red-500">{form.formState.errors.phone.message}</p>}
                                    </div>
                                    <div className="grid gap-1.5 sm:gap-2">
                                        <Label htmlFor="country" className="text-xs sm:text-sm">Pays</Label>
                                        <Select
                                            onValueChange={(val) => form.setValue("country", val)}
                                            defaultValue={form.getValues("country")}
                                        >
                                            <SelectTrigger className="shadow-sm h-9 sm:h-10 text-sm bg-muted/20 border-border/60 rounded-xl">
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

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div className="grid gap-1.5 sm:gap-2">
                                        <Label htmlFor="city" className="text-xs sm:text-sm">Ville</Label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input id="city" className="pl-9 h-9 sm:h-10 text-sm shadow-sm bg-muted/20 border-border/60 rounded-xl" {...form.register("city")} />
                                        </div>
                                    </div>
                                    <div className="grid gap-1.5 sm:gap-2">
                                        <Label htmlFor="address" className="text-xs sm:text-sm">Adresse</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input id="address" className="pl-9 h-9 sm:h-10 text-sm shadow-sm bg-muted/20 border-border/60 rounded-xl" {...form.register("address")} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-1.5 sm:gap-2">
                                    <Label htmlFor="description" className="text-xs sm:text-sm">Description</Label>
                                    <Textarea
                                        id="description"
                                        className="shadow-sm bg-muted/20 border-border/60 min-h-[80px] sm:min-h-[100px] resize-none text-sm rounded-xl"
                                        placeholder="Décrivez votre activité..."
                                        {...form.register("description")}
                                    />
                                </div>

                                <div className="flex justify-end pt-2 sm:pt-4">
                                    <Button type="submit" disabled={updateProfile.isPending} className="shadow-sm h-9 sm:h-10 text-xs sm:text-sm rounded-full px-6">
                                        {updateProfile.isPending ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin mr-2" /> : <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />}
                                        Enregistrer
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
