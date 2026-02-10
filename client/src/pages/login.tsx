import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, LogIn, ChevronLeft, Eye, EyeOff, Store, ArrowRight, ShieldCheck, Truck, TrendingUp } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
    const [, setLocation] = useLocation();
    const { login, isLoggingIn, loginError } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login({ email, password });
            setLocation("/");
        } catch (error) {
            // Error is handled by the mutation
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
                        La place de marché <br />
                        <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">B2B n°1 en Afrique</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-md leading-relaxed">
                        Connectez-vous pour accéder à des milliers de produits, gérer vos commandes et développer votre activité.
                    </p>

                    <div className="mt-10 grid gap-4">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <ShieldCheck className="w-4.5 h-4.5 text-primary" />
                            </div>
                            <span>Transactions sécurisées et vérifiées</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Truck className="w-4.5 h-4.5 text-primary" />
                            </div>
                            <span>Livraison rapide dans toute l'Afrique de l'Ouest</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <TrendingUp className="w-4.5 h-4.5 text-primary" />
                            </div>
                            <span>+2000 professionnels nous font confiance</span>
                        </div>
                    </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute top-20 right-20 w-[200px] h-[200px] bg-emerald-500/5 rounded-full blur-3xl" />

                <div className="relative z-10">
                    <blockquote className="border-l-2 border-primary/30 pl-4">
                        <p className="text-base italic text-muted-foreground">
                            &ldquo;SokoB2B a transformé la façon dont nous nous approvisionnons. C'est rapide, fiable et sécurisé.&rdquo;
                        </p>
                        <footer className="text-sm font-semibold text-primary mt-2">
                            Moussa D. — Commerçant à Cotonou
                        </footer>
                    </blockquote>
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
                        onClick={() => setLocation("/")}
                        className="text-xs"
                    >
                        <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
                        Accueil
                    </Button>
                </div>

                {/* Desktop Back Button */}
                <div className="hidden lg:block p-4 lg:p-8">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLocation("/")}
                        className="w-fit"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Retour à l'accueil
                    </Button>
                </div>

                <div className="flex-1 flex flex-col justify-center px-8 py-8 sm:px-10 lg:px-12">
                    <div className="w-full max-w-sm sm:max-w-md mx-auto">
                        <div className="border rounded-2xl bg-card p-5 sm:p-8 shadow-sm space-y-6 sm:space-y-8">
                            <div className="space-y-2 text-center lg:text-left">
                                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Bon retour !</h2>
                                <p className="text-muted-foreground text-sm sm:text-base">
                                    Entrez vos identifiants pour accéder à votre compte.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {loginError && (
                                    <Alert variant="destructive">
                                        <AlertDescription>
                                            {loginError.message}
                                        </AlertDescription>
                                    </Alert>
                                )}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="votre@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="h-10 sm:h-11 text-sm rounded-lg"
                                            autoComplete="email"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password">Mot de passe</Label>
                                            <button type="button" className="px-0 font-normal h-auto text-xs text-muted-foreground hover:text-primary transition-colors" tabIndex={-1}>
                                                Mot de passe oublié ?
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="h-10 sm:h-11 pr-10 text-sm rounded-lg"
                                                autoComplete="current-password"
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-10 sm:h-11 text-sm sm:text-base shadow-sm rounded-lg"
                                    disabled={isLoggingIn}
                                >
                                    {isLoggingIn ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Connexion...
                                        </>
                                    ) : (
                                        <>
                                            <LogIn className="mr-2 h-4 w-4" />
                                            Se connecter
                                        </>
                                    )}
                                </Button>
                            </form>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <Separator className="w-full" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                        Ou
                                    </span>
                                </div>
                            </div>

                            <div className="text-center text-sm">
                                Pas encore de compte ?{" "}
                                <button
                                    type="button"
                                    onClick={() => setLocation("/register")}
                                    className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
                                >
                                    Créer un compte
                                    <ArrowRight className="w-3 h-3" />
                                </button>
                            </div>
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
