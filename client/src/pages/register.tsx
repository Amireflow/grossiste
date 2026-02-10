import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserPlus, ChevronLeft, Store, CheckCircle2, Eye, EyeOff, Building2, ArrowRight, ShieldCheck, Truck, TrendingUp } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { COUNTRIES } from "@/lib/constants";

export default function RegisterPage() {
    const [, setLocation] = useLocation();
    const { register, isRegistering, registerError } = useAuth();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        // Auth
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        // Profile
        role: "shop_owner", // 'shop_owner' | 'supplier'
        businessName: "",
        phone: "",
        city: "",
        country: "Bénin",
        address: "",
    });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [isCreatingProfile, setIsCreatingProfile] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (fieldErrors[e.target.name]) {
            setFieldErrors({ ...fieldErrors, [e.target.name]: "" });
        }
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData({ ...formData, [name]: value });
        if (fieldErrors[name]) {
            setFieldErrors({ ...fieldErrors, [name]: "" });
        }
    };

    const validateStep1 = () => true;

    const validateStep2 = () => {
        const errors: Record<string, string> = {};
        if (!formData.firstName.trim()) errors.firstName = "Le prénom est requis";
        if (!formData.lastName.trim()) errors.lastName = "Le nom est requis";
        if (!formData.businessName.trim()) errors.businessName = "Le nom de l'activité est requis";
        if (!formData.phone.trim()) errors.phone = "Le téléphone est requis";
        if (!formData.city.trim()) errors.city = "La ville est requise";
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateStep3 = () => {
        const errors: Record<string, string> = {};
        if (!formData.email.trim()) errors.email = "L'email est requis";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Email invalide";

        if (!formData.password) errors.password = "Le mot de passe est requis";
        else if (formData.password.length < 6) errors.password = "Au moins 6 caractères";

        if (formData.password !== formData.confirmPassword) errors.confirmPassword = "Les mots de passe ne correspondent pas";
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleNext = () => {
        if (step === 1 && validateStep1()) setStep(2);
        else if (step === 2 && validateStep2()) setStep(3);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep3()) return;

        try {
            await register({
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
            });

            setIsCreatingProfile(true);
            await apiRequest("POST", "/api/profile", {
                role: formData.role,
                businessName: formData.businessName,
                phone: formData.phone,
                city: formData.city,
                country: formData.country,
                address: formData.address,
                currency: "XOF",
            });

            await queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
            setLocation("/");

        } catch (error) {
            setIsCreatingProfile(false);
            console.error("Registration flow error:", error);
        }
    };

    const getStepTitle = () => {
        switch (step) {
            case 1: return "Type de compte";
            case 2: return "Vos informations";
            case 3: return "Sécurité";
            default: return "";
        }
    };

    const getStepDescription = () => {
        switch (step) {
            case 1: return "Comment souhaitez-vous utiliser SokoB2B ?";
            case 2: return "Dites-nous en plus sur vous et votre activité";
            case 3: return "Dernière étape pour sécuriser votre accès";
            default: return "";
        }
    };

    return (
        <div className="min-h-[100dvh] flex flex-col lg:flex-row">
            {/* Left Side - Branding (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-primary/5 to-background flex-col justify-between p-12 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-2.5 font-bold text-2xl text-primary mb-10">
                        <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25">
                            <Store className="w-6 h-6" />
                        </div>
                        SokoB2B
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4 leading-[1.1]">
                        Rejoignez la communauté <br />
                        <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">des professionnels</span>
                    </h1>

                    <div className="mt-10 space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <ShieldCheck className="w-4.5 h-4.5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Accès direct aux fournisseurs</p>
                                <p className="text-xs text-muted-foreground">Des milliers de produits disponibles</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Truck className="w-4.5 h-4.5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Tarifs de gros négociés</p>
                                <p className="text-xs text-muted-foreground">Les meilleurs prix pour votre activité</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <TrendingUp className="w-4.5 h-4.5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Gestion simplifiée</p>
                                <p className="text-xs text-muted-foreground">Commandes, livraisons et paiements en un clic</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl opacity-50" />
                <div className="absolute top-20 right-20 w-[200px] h-[200px] bg-emerald-500/5 rounded-full blur-3xl" />

                <div className="relative z-10 mt-auto pt-10">
                    <p className="text-muted-foreground text-sm">
                        © 2026 SokoB2B. Tous droits réservés.
                    </p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex flex-col bg-background">
                {/* Mobile Brand Header */}
                <div className="lg:hidden flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                            <Store className="w-4 h-4" />
                        </div>
                        <span className="font-serif text-lg font-bold tracking-tight">SokoB2B</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => step === 1 ? setLocation("/") : setStep(step - 1)}
                        className="text-xs"
                    >
                        <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
                        {step === 1 ? "Accueil" : "Précédent"}
                    </Button>
                </div>

                {/* Desktop Back Button */}
                <div className="hidden lg:block p-4 lg:p-8">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => step === 1 ? setLocation("/") : setStep(step - 1)}
                        className="w-fit"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        {step === 1 ? "Retour" : "Précédent"}
                    </Button>
                </div>

                <div className="flex-1 flex flex-col justify-center px-8 py-6 sm:px-10 lg:px-12">
                    <div className="w-full max-w-sm sm:max-w-lg mx-auto">
                        <div className="border rounded-2xl bg-card p-5 sm:p-8 shadow-sm space-y-6">
                            <div className="space-y-2 text-center">
                                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{getStepTitle()}</h2>
                                <p className="text-muted-foreground text-sm sm:text-base">{getStepDescription()}</p>
                            </div>

                            {/* Progress Indicator */}
                            <div className="flex items-center justify-center gap-2 sm:gap-3">
                                {[1, 2, 3].map((s) => (
                                    <div key={s} className="flex items-center gap-2 sm:gap-3">
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step > s
                                                ? "bg-primary text-primary-foreground"
                                                : step === s
                                                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                                                    : "bg-muted text-muted-foreground"
                                                }`}
                                        >
                                            {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                                        </div>
                                        {s < 3 && (
                                            <div className={`w-8 sm:w-12 h-0.5 rounded-full transition-all duration-500 ${step > s ? "bg-primary" : "bg-muted"}`} />
                                        )}
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {registerError && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{registerError.message}</AlertDescription>
                                    </Alert>
                                )}

                                {/* STEP 1: ROLE SELECTION */}
                                <div className={step === 1 ? "block" : "hidden"}>
                                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                                        <div
                                            className={`relative cursor-pointer rounded-xl border-2 p-5 sm:p-6 hover:border-primary transition-all duration-200 ${formData.role === "shop_owner" ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm" : "border-muted bg-card hover:bg-muted/50"}`}
                                            onClick={() => handleSelectChange("role", "shop_owner")}
                                        >
                                            <div className="flex sm:flex-col items-center sm:text-center gap-4">
                                                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-colors shrink-0 ${formData.role === "shop_owner" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                                    <Store className="w-6 h-6 sm:w-7 sm:h-7" />
                                                </div>
                                                <div className="text-left sm:text-center">
                                                    <h3 className="font-bold text-base sm:text-lg">Commerçant</h3>
                                                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">J'achète des produits en gros pour ma boutique</p>
                                                </div>
                                            </div>
                                            {formData.role === "shop_owner" && <div className="absolute top-3 right-3 sm:top-4 sm:right-4 text-primary"><CheckCircle2 className="w-5 h-5" /></div>}
                                        </div>

                                        <div
                                            className={`relative cursor-pointer rounded-xl border-2 p-5 sm:p-6 hover:border-primary transition-all duration-200 ${formData.role === "supplier" ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm" : "border-muted bg-card hover:bg-muted/50"}`}
                                            onClick={() => handleSelectChange("role", "supplier")}
                                        >
                                            <div className="flex sm:flex-col items-center sm:text-center gap-4">
                                                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-colors shrink-0 ${formData.role === "supplier" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                                    <Building2 className="w-6 h-6 sm:w-7 sm:h-7" />
                                                </div>
                                                <div className="text-left sm:text-center">
                                                    <h3 className="font-bold text-base sm:text-lg">Fournisseur</h3>
                                                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">Je vends mes produits aux commerçants</p>
                                                </div>
                                            </div>
                                            {formData.role === "supplier" && <div className="absolute top-3 right-3 sm:top-4 sm:right-4 text-primary"><CheckCircle2 className="w-5 h-5" /></div>}
                                        </div>
                                    </div>
                                </div>

                                {/* STEP 2: DETAILS */}
                                <div className={step === 2 ? "block space-y-4" : "hidden"}>
                                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                        <div className="space-y-1.5 sm:space-y-2">
                                            <Label htmlFor="firstName" className="text-xs sm:text-sm">Prénom</Label>
                                            <Input
                                                id="firstName"
                                                name="firstName"
                                                placeholder="Jean"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                className={`h-10 sm:h-11 text-sm rounded-lg ${fieldErrors.firstName ? "border-destructive" : ""}`}
                                            />
                                            {fieldErrors.firstName && <p className="text-[11px] sm:text-xs text-destructive">{fieldErrors.firstName}</p>}
                                        </div>
                                        <div className="space-y-1.5 sm:space-y-2">
                                            <Label htmlFor="lastName" className="text-xs sm:text-sm">Nom</Label>
                                            <Input
                                                id="lastName"
                                                name="lastName"
                                                placeholder="Dupont"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                className={`h-10 sm:h-11 text-sm rounded-lg ${fieldErrors.lastName ? "border-destructive" : ""}`}
                                            />
                                            {fieldErrors.lastName && <p className="text-[11px] sm:text-xs text-destructive">{fieldErrors.lastName}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 sm:space-y-2">
                                        <Label htmlFor="businessName" className="text-xs sm:text-sm">{formData.role === "shop_owner" ? "Nom de la boutique" : "Nom de l'entreprise"}</Label>
                                        <Input
                                            id="businessName"
                                            name="businessName"
                                            placeholder={formData.role === "shop_owner" ? "Ex: Boutique Maman Awa" : "Ex: Import-Export SARL"}
                                            value={formData.businessName}
                                            onChange={handleChange}
                                            className={`h-10 sm:h-11 text-sm rounded-lg ${fieldErrors.businessName ? "border-destructive" : ""}`}
                                        />
                                        {fieldErrors.businessName && <p className="text-[11px] sm:text-xs text-destructive">{fieldErrors.businessName}</p>}
                                    </div>

                                    <div className="space-y-1.5 sm:space-y-2">
                                        <Label htmlFor="phone" className="text-xs sm:text-sm">Téléphone</Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            placeholder="+229 ..."
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className={`h-10 sm:h-11 text-sm rounded-lg ${fieldErrors.phone ? "border-destructive" : ""}`}
                                        />
                                        {fieldErrors.phone && <p className="text-[11px] sm:text-xs text-destructive">{fieldErrors.phone}</p>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                        <div className="space-y-1.5 sm:space-y-2">
                                            <Label htmlFor="city" className="text-xs sm:text-sm">Ville</Label>
                                            <Input
                                                id="city"
                                                name="city"
                                                placeholder="Cotonou"
                                                value={formData.city}
                                                onChange={handleChange}
                                                className={`h-10 sm:h-11 text-sm ${fieldErrors.city ? "border-destructive" : ""}`}
                                            />
                                            {fieldErrors.city && <p className="text-[11px] sm:text-xs text-destructive">{fieldErrors.city}</p>}
                                        </div>
                                        <div className="space-y-1.5 sm:space-y-2">
                                            <Label htmlFor="country" className="text-xs sm:text-sm">Pays</Label>
                                            <Select value={formData.country} onValueChange={(val) => handleSelectChange("country", val)}>
                                                <SelectTrigger className="h-10 sm:h-11 text-sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {COUNTRIES.map((c) => (
                                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* STEP 3: SECURITY */}
                                <div className={step === 3 ? "block space-y-4" : "hidden"}>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="votre@email.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className={`h-10 sm:h-11 text-sm ${fieldErrors.email ? "border-destructive" : ""}`}
                                            autoComplete="email"
                                        />
                                        {fieldErrors.email && <p className="text-[11px] sm:text-xs text-destructive">{fieldErrors.email}</p>}
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <Label htmlFor="password" className="text-xs sm:text-sm">Mot de passe</Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={handleChange}
                                                className={`pr-10 h-10 sm:h-11 text-sm ${fieldErrors.password ? "border-destructive" : ""}`}
                                                autoComplete="new-password"
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {fieldErrors.password && <p className="text-[11px] sm:text-xs text-destructive">{fieldErrors.password}</p>}
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <Label htmlFor="confirmPassword" className="text-xs sm:text-sm">Confirmer le mot de passe</Label>
                                        <div className="relative">
                                            <Input
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                className={`pr-10 h-10 sm:h-11 text-sm ${fieldErrors.confirmPassword ? "border-destructive" : ""}`}
                                                autoComplete="new-password"
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {fieldErrors.confirmPassword && <p className="text-[11px] sm:text-xs text-destructive">{fieldErrors.confirmPassword}</p>}
                                    </div>
                                </div>

                                <div className="pt-2">
                                    {step < 3 ? (
                                        <Button
                                            type="button"
                                            onClick={handleNext}
                                            className="w-full h-10 sm:h-12 text-sm sm:text-base shadow-sm rounded-lg"
                                        >
                                            Suivant <ArrowRight className="ml-2 w-4 h-4" />
                                        </Button>
                                    ) : (
                                        <Button
                                            type="submit"
                                            className="w-full h-10 sm:h-12 text-sm sm:text-base bg-emerald-600 hover:bg-emerald-700 shadow-sm rounded-lg"
                                            disabled={isRegistering || isCreatingProfile}
                                        >
                                            {isRegistering || isCreatingProfile ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                                                    Création du compte...
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                                    Terminer l'inscription
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>

                                <div className="text-center text-xs sm:text-sm">
                                    Déjà membre ?{" "}
                                    <button
                                        type="button"
                                        onClick={() => setLocation("/login")}
                                        className="font-semibold text-primary hover:underline"
                                    >
                                        Se connecter
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Mobile Footer */}
                <div className="lg:hidden text-center py-4 text-xs text-muted-foreground">
                    © 2026 SokoB2B — Marketplace B2B
                </div>
            </div>
        </div>
    );
}
