import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, Mail, CheckCircle2, Store, ChevronLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPasswordPage() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Get the current URL origin to construct the redirect URL
            const redirectUrl = `${window.location.origin}/reset-password`;

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: redirectUrl,
            });

            if (error) throw error;

            setIsSubmitted(true);
            toast({
                title: "Email envoyé",
                description: "Vérifiez votre boîte mail pour réinitialiser votre mot de passe.",
            });
        } catch (err: any) {
            setError(err.message || "Une erreur est survenue.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-background">
            {/* Left Panel - Branding (Hidden on Mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-900 text-white flex-col justify-between p-12 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/90 to-zinc-900/50" />

                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-lg font-bold">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                            <span className="text-emerald-400">S</span>
                        </div>
                        SokoB2B
                    </div>
                </div>

                <div className="relative z-10 space-y-6 max-w-lg">
                    <h1 className="text-4xl font-bold tracking-tight">
                        Récupérez l'accès à votre compte business.
                    </h1>
                    <p className="text-zinc-400 text-lg">
                        Nous comprenons l'importance de votre activité. Suivez les étapes simples pour sécuriser et retrouver votre espace.
                    </p>
                </div>

                <div className="relative z-10 text-sm text-zinc-500">
                    © 2026 SokoB2B — Plateforme Marketplace B2B
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex flex-col bg-background">
                {/* Mobile Header */}
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
                        onClick={() => setLocation("/login")}
                        className="text-xs"
                    >
                        <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
                        Retour
                    </Button>
                </div>

                <div className="p-4 lg:p-8">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLocation("/login")}
                        className="w-fit"
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Retour à la connexion
                    </Button>
                </div>

                <div className="flex-1 flex flex-col justify-center px-8 py-8 sm:px-10 lg:px-12">
                    <div className="w-full max-w-sm sm:max-w-md mx-auto">
                        <div className="border rounded-2xl bg-card p-5 sm:p-8 shadow-sm space-y-6">
                            <div className="space-y-2 text-center">
                                <h2 className="text-2xl font-bold tracking-tight">Mot de passe oublié ?</h2>
                                <p className="text-muted-foreground text-sm">
                                    Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                                </p>
                            </div>

                            {isSubmitted ? (
                                <div className="flex flex-col items-center justify-center space-y-4 py-6 text-center animate-in fade-in zoom-in duration-500">
                                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                                        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-lg">Email envoyé !</h3>
                                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                            Si un compte existe avec l'adresse <span className="font-medium text-foreground">{email}</span>, vous recevrez les instructions sous peu.
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="mt-4"
                                        onClick={() => setIsSubmitted(false)}
                                    >
                                        Renvoyer l'email
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {error && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    )}

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <div className="relative">
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="votre@email.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className="pl-10 h-10 sm:h-11 text-sm rounded-lg"
                                            />
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-10 sm:h-11 text-sm sm:text-base shadow-sm rounded-lg"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Envoi en cours...
                                            </>
                                        ) : (
                                            "Envoyer le lien"
                                        )}
                                    </Button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
