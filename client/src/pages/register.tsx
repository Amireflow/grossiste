import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserPlus, ChevronLeft, Store, Package, CheckCircle2 } from "lucide-react";
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

    const validateStep1 = () => {
        // Step 1: Role Selection (Always valid as it has a default)
        return true;
    };

    const validateStep2 = () => {
        // Step 2: Personal & Business Info
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
        // Step 3: Security
        const errors: Record<string, string> = {};
        if (!formData.email.trim()) errors.email = "L'email est requis";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Email invalide";

        if (!formData.password) errors.password = "Le mot de passe est requis";
        else if (formData.password.length < 6) errors.password = "Au moins 6 caractères";

        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = "Les mots de passe ne correspondent pas";
        }
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
            // 1. Register User (Auth)
            await register({
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
            });

            // 2. Create Profile (Business Info)
            setIsCreatingProfile(true);
            await apiRequest("POST", "/api/profile", {
                role: formData.role,
                businessName: formData.businessName,
                phone: formData.phone,
                city: formData.city,
                country: formData.country,
                address: formData.address,
                currency: "XOF", // Default
            });

            // 3. Refresh & Redirect
            await queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
            setLocation("/");

        } catch (error) {
            setIsCreatingProfile(false);
            // registerError is handled by useAuth, but if profile creation fails:
            console.error("Registration flow error:", error);
        }
    };

    // Helper to get step title
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <Card className="w-full max-w-lg border-none shadow-xl animate-fade-in">
                <CardHeader className="space-y-1 pb-2">
                    <div className="flex items-center gap-2 mb-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => step === 1 ? setLocation("/") : setStep(step - 1)}
                            className="p-0 h-auto text-muted-foreground hover:text-foreground"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            {step === 1 ? "Retour à l'accueil" : "Précédent"}
                        </Button>
                    </div>

                    {/* Progress Indicator */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`h-2.5 w-full max-w-[4rem] rounded-full transition-all duration-500 ${step >= s ? "bg-primary" : "bg-muted"}`}
                            />
                        ))}
                    </div>

                    <CardTitle className="text-2xl font-bold text-center">
                        {getStepTitle()}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {getStepDescription()}
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4 pt-4">
                        {(registerError) && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertDescription>
                                    {registerError?.message}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* STEP 1: ROLE SELECTION */}
                        <div className={`space-y-4 ${step === 1 ? "block animate-fade-in" : "hidden"}`}>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Card
                                    className={`relative cursor-pointer hover:border-primary transition-all ${formData.role === "shop_owner" ? "ring-2 ring-primary border-primary bg-primary/5" : ""}`}
                                    onClick={() => handleSelectChange("role", "shop_owner")}
                                >
                                    <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                                            <Store className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">Commerçant</h3>
                                            <p className="text-xs text-muted-foreground mt-1">J'achète des produits pour ma boutique</p>
                                        </div>
                                        {formData.role === "shop_owner" && <CheckCircle2 className="w-5 h-5 text-primary absolute top-3 right-3" />}
                                    </CardContent>
                                </Card>

                                <Card
                                    className={`relative cursor-pointer hover:border-primary transition-all ${formData.role === "supplier" ? "ring-2 ring-primary border-primary bg-primary/5" : ""}`}
                                    onClick={() => handleSelectChange("role", "supplier")}
                                >
                                    <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                            <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">Fournisseur</h3>
                                            <p className="text-xs text-muted-foreground mt-1">Je vends mes produits aux commerçants</p>
                                        </div>
                                        {formData.role === "supplier" && <CheckCircle2 className="w-5 h-5 text-primary absolute top-3 right-3" />}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* STEP 2: DETAILS */}
                        <div className={`space-y-4 ${step === 2 ? "block animate-fade-in" : "hidden"}`}>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">Prénom</Label>
                                    <Input
                                        id="firstName"
                                        name="firstName"
                                        placeholder="Jean"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className={fieldErrors.firstName ? "border-destructive" : ""}
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
                                        className={fieldErrors.lastName ? "border-destructive" : ""}
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
                                    className={fieldErrors.businessName ? "border-destructive" : ""}
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
                                    className={fieldErrors.phone ? "border-destructive" : ""}
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
                                        className={fieldErrors.city ? "border-destructive" : ""}
                                    />
                                    {fieldErrors.city && <p className="text-xs text-destructive">{fieldErrors.city}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="country">Pays</Label>
                                    <Select value={formData.country} onValueChange={(val) => handleSelectChange("country", val)}>
                                        <SelectTrigger>
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
                        <div className={`space-y-4 ${step === 3 ? "block animate-fade-in" : "hidden"}`}>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="votre@email.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={fieldErrors.email ? "border-destructive" : ""}
                                />
                                {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Mot de passe</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={fieldErrors.password ? "border-destructive" : ""}
                                />
                                {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={fieldErrors.confirmPassword ? "border-destructive" : ""}
                                />
                                {fieldErrors.confirmPassword && <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>}
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4 pt-2">
                        {step < 3 ? (
                            <Button
                                type="button"
                                onClick={handleNext}
                                className="w-full bg-primary hover:bg-primary/90 text-lg h-12"
                            >
                                Suivant
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/90 text-lg h-12"
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

                        <p className="text-sm text-muted-foreground text-center mt-2">
                            Déjà membre ?{" "}
                            <button
                                type="button"
                                onClick={() => setLocation("/login")}
                                className="text-primary hover:underline font-medium"
                            >
                                Se connecter
                            </button>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
