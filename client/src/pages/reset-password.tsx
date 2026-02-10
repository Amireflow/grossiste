import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, Lock, CheckCircle2, Store, ChevronLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function ResetPasswordPage() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    // Check if we have a session (Supabase automatically handles the hash fragment token exchange)
    useEffect(() => {
        const checkSession = async () => {
            if (!supabase) return;
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // Ideally, we'd check for hash params error, but for simplicity:
                // If no session after redirect, simpler to ask user to login or use the link again.
                // However, the recovery link sets the session.
            }
        };
        checkSession();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }

        if (password.length < 6) {
            setError("Le mot de passe doit contenir au moins 6 caractères.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            if (!supabase) {
                setError("Service de réinitialisation non disponible.");
                setIsLoading(false);
                return;
            }
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setIsSuccess(true);
            toast({
                title: "Mot de passe mis à jour",
                description: "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.",
            });

            // Redirect after a short delay
            setTimeout(() => {
                setLocation("/login");
            }, 3000);

        } catch (err: any) {
            setError(err.message || "Impossible de mettre à jour le mot de passe.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4">
                <div className="w-full max-w-sm sm:max-w-md border rounded-2xl bg-card p-8 shadow-sm text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto animate-in zoom-in duration-300">
                        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight">Mot de passe modifié !</h2>
                        <p className="text-muted-foreground">
                            Votre mot de passe a été mis à jour avec succès. Vous allez être redirigé vers la page de connexion.
                        </p>
                    </div>
                    <Button
                        onClick={() => setLocation("/login")}
                        className="w-full rounded-lg"
                    >
                        Aller à la connexion
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] flex flex-col bg-background">
            {/* Mobile Brand Header */}
            <div className="lg:hidden flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                        <Store className="w-4 h-4" />
                    </div>
                    <span className="font-serif text-lg font-bold tracking-tight">SokoB2B</span>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-4">
                {/* Simple centered layout for Reset Password */}
                <div className="w-full max-w-sm sm:max-w-md">
                    <div className="border rounded-2xl bg-card p-5 sm:p-8 shadow-sm space-y-6">
                        <div className="space-y-2 text-center">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <Lock className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight">Nouveau mot de passe</h2>
                            <p className="text-muted-foreground text-sm">
                                Choisissez un mot de passe sécurisé pour votre compte.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">Nouveau mot de passe</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="h-10 sm:h-11 pr-10 text-sm rounded-lg"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            type={showPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className="h-10 sm:h-11 pr-10 text-sm rounded-lg"
                                            placeholder="••••••••"
                                        />
                                    </div>
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
                                        Mise à jour...
                                    </>
                                ) : (
                                    "Changer le mot de passe"
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
