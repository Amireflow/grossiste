import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, LogIn, ChevronLeft, Eye, EyeOff, Store, ArrowRight } from "lucide-react";
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
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
                        La place de marché <br />
                        <span className="text-primary">B2B n°1 en Afrique</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-md">
                        Connectez-vous pour accéder à des milliers de produits, gérer vos commandes et développer votre activité.
                    </p>
                </div>

                {/* Decorative circles */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-3xl" />

                <div className="relative z-10">
                    <blockquote className="space-y-2">
                        <p className="text-lg">
                            &ldquo;SokoB2B a transformé la façon dont nous nous approvisionnons. C'est rapide, fiable et sécurisé.&rdquo;
                        </p>
                        <footer className="text-sm font-semibold text-primary">
                            Moussa D. - Commerçant à Cotonou
                        </footer>
                    </blockquote>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex flex-col bg-background">
                {/* Back Button - Static Header */}
                <div className="p-4 lg:p-8">
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

                <div className="flex-1 flex flex-col justify-center p-4 sm:p-8 lg:p-12 pt-0 -mt-16 lg:-mt-0">
                    <div className="w-full max-w-md mx-auto space-y-8">
                        <div className="space-y-2 text-center lg:text-left">
                            <h2 className="text-3xl font-bold tracking-tight">Bon retour !</h2>
                            <p className="text-muted-foreground">
                                Entrez vos identifiants pour accéder à votre compte.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
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
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password">Mot de passe</Label>
                                        <Button variant="link" className="px-0 font-normal h-auto text-xs text-muted-foreground" tabIndex={-1} type="button">
                                            Mot de passe oublié ?
                                        </Button>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="h-11 pr-10"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-11 w-11 text-muted-foreground hover:text-foreground"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 text-base"
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
                                className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                            >
                                Créer un compte
                                <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
