import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserPlus, ChevronLeft, Store, Package, CheckCircle2, Eye, EyeOff, Building2, ArrowRight } from "lucide-react";
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
        <div className="min-h-screen flex">
            {/* Left Side - Branding (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 bg-primary/5 dark:bg-primary/10 flex-col justify-between p-12 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 font-bold text-2xl text-primary mb-8">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
                            <Store className="w-6 h-6" />
                        </div>
                        SokoB2B
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4 leading-tight">
                        Rejoignez la communauté <br />
                        <span className="text-primary">des professionnels</span>
                    </h1>
                    <ul className="space-y-4 text-lg text-muted-foreground mt-8">
                        <li className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-primary" />
                            </div>
                            Accès direct aux fournisseurs
                        </li>
                        <li className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-primary" />
                            </div>
                            Tarifs de gros négociés
                        </li>
                        <li className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-primary" />
                            </div>
                            Gestion simplifiée des commandes
                        </li>
                    </ul>
                </div>

                {/* Decorative circles */}
                <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl opacity-50" />

                <div className="relative z-10 mt-auto pt-10">
                    <p className="text-muted-foreground text-sm">
                        © 2024 SokoB2B. Tous droits réservés.
                    </p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex flex-col bg-background">
                {/* Back Button - Static Header */}
                <div className="p-4 lg:p-8">
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

                <div className="flex-1 flex flex-col justify-center p-4 sm:p-8 lg:p-12 pt-0 -mt-16 lg:-mt-0">
                    <div className="w-full max-w-lg mx-auto space-y-8">
                        <div className="space-y-2 text-center">
                            <h2 className="text-3xl font-bold tracking-tight">{getStepTitle()}</h2>
                            <p className="text-muted-foreground">{getStepDescription()}</p>
                        </div>

                        {/* Progress Indicator */}
                        <div className="flex items-center justify-center gap-3 mb-8">
                            {[1, 2, 3].map((s) => (
                                <div
                                    key={s}
                                    className={`h-2 w-full max-w-[3rem] rounded-full transition-all duration-500 ${step >= s ? "bg-primary" : "bg-muted"}`}
                                />
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {registerError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{registerError.message}</AlertDescription>
                                </Alert>
                            )}

                            {/* STEP 1: ROLE SELECTION */}
                            <div className={step === 1 ? "block animate-fade-in" : "hidden"}>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div
                                        className={`relative cursor-pointer rounded-xl border-2 p-6 hover:border-primary transition-all duration-200 ${formData.role === "shop_owner" ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-muted bg-card hover:bg-muted/50"}`}
                                        onClick={() => handleSelectChange("role", "shop_owner")}
                                    >
                                        <div className="flex flex-col items-center text-center gap-4">
                                            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${formData.role === "shop_owner" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                                <Store className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">Commerçant</h3>
                                                <p className="text-sm text-muted-foreground mt-1">J'achète des produits en gros pour ma boutique</p>
                                            </div>
                                        </div>
                                        {formData.role === "shop_owner" && <div className="absolute top-4 right-4 text-primary"><CheckCircle2 className="w-5 h-5" /></div>}
                                    </div>

                                    <div
                                        className={`relative cursor-pointer rounded-xl border-2 p-6 hover:border-primary transition-all duration-200 ${formData.role === "supplier" ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-muted bg-card hover:bg-muted/50"}`}
                                        onClick={() => handleSelectChange("role", "supplier")}
                                    >
                                        <div className="flex flex-col items-center text-center gap-4">
                                            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${formData.role === "supplier" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                                <Building2 className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">Fournisseur</h3>
                                                <p className="text-sm text-muted-foreground mt-1">Je vends mes produits aux commerçants</p>
                                            </div>
                                        </div>
                                        {formData.role === "supplier" && <div className="absolute top-4 right-4 text-primary"><CheckCircle2 className="w-5 h-5" /></div>}
                                    </div>
                                </div>
                            </div>

                            {/* STEP 2: DETAILS */}
                            <div className={step === 2 ? "block animate-fade-in space-y-4" : "hidden"}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">Prénom</Label>
                                        <Input
                                            id="firstName"
                                            name="firstName"
                                            placeholder="Jean"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            className={fieldErrors.firstName ? "border-destructive h-11" : "h-11"}
                                        />
                                        {fieldErrors.firstName && <p className="text-xs text-destructive">{fieldErrors.firstName}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Nom</Label>
                                        <Input
                                            id="lastName"
                                            name="lastName"
                                            placeholder="Dupont"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            className={fieldErrors.lastName ? "border-destructive h-11" : "h-11"}
                                        />
                                        {fieldErrors.lastName && <p className="text-xs text-destructive">{fieldErrors.lastName}</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="businessName">{formData.role === "shop_owner" ? "Nom de la boutique" : "Nom de l'entreprise"}</Label>
                                    <Input
                                        id="businessName"
                                        name="businessName"
                                        placeholder={formData.role === "shop_owner" ? "Ex: Boutique Maman Awa" : "Ex: Import-Export SARL"}
                                        value={formData.businessName}
                                        onChange={handleChange}
                                        className={fieldErrors.businessName ? "border-destructive h-11" : "h-11"}
                                    />
                                    {fieldErrors.businessName && <p className="text-xs text-destructive">{fieldErrors.businessName}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Téléphone</Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        placeholder="+229 ..."
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className={fieldErrors.phone ? "border-destructive h-11" : "h-11"}
                                    />
                                    {fieldErrors.phone && <p className="text-xs text-destructive">{fieldErrors.phone}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="city">Ville</Label>
                                        <Input
                                            id="city"
                                            name="city"
                                            placeholder="Cotonou"
                                            value={formData.city}
                                            onChange={handleChange}
                                            className={fieldErrors.city ? "border-destructive h-11" : "h-11"}
                                        />
                                        {fieldErrors.city && <p className="text-xs text-destructive">{fieldErrors.city}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="country">Pays</Label>
                                        <Select value={formData.country} onValueChange={(val) => handleSelectChange("country", val)}>
                                            <SelectTrigger className="h-11">
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
                            <div className={step === 3 ? "block animate-fade-in space-y-4" : "hidden"}>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="votre@email.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={fieldErrors.email ? "border-destructive h-11" : "h-11"}
                                    />
                                    {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Mot de passe</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className={`pr-10 h-11 ${fieldErrors.password ? "border-destructive" : ""}`}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-11 w-11 text-muted-foreground hover:text-foreground"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className={`pr-10 h-11 ${fieldErrors.confirmPassword ? "border-destructive" : ""}`}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-11 w-11 text-muted-foreground hover:text-foreground"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    {fieldErrors.confirmPassword && <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>}
                                </div>
                            </div>

                            <div className="pt-4">
                                {step < 3 ? (
                                    <Button
                                        type="button"
                                        onClick={handleNext}
                                        className="w-full h-12 text-base"
                                    >
                                        Suivant <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        className="w-full h-12 text-base bg-emerald-600 hover:bg-emerald-700"
                                        disabled={isRegistering || isCreatingProfile}
                                    >
                                        {isRegistering || isCreatingProfile ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Création du compte...
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="mr-2 h-5 w-5" />
                                                Terminer l'inscription
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>

                            <div className="text-center text-sm">
                                Déjà membre ?{" "}
                                <button
                                    type="button"
                                    onClick={() => setLocation("/login")}
                                    className="font-medium text-primary hover:underline"
                                >
                                    Se connecter
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
