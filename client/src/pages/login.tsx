import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, LogIn, ChevronLeft } from "lucide-react";

export default function LoginPage() {
    const [, setLocation] = useLocation();
    const { login, isLoggingIn, loginError } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-8">
            <Card className="w-full max-w-[400px] shadow-lg">
                <CardHeader className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation("/")}
                            className="p-0 h-auto"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Retour
                        </Button>
                    </div>
                    <CardTitle className="text-2xl font-bold text-center">
                        Connexion
                    </CardTitle>
                    <CardDescription className="text-center">
                        Connectez-vous à votre compte SokoB2B
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {loginError && (
                            <Alert variant="destructive">
                                <AlertDescription>
                                    {loginError.message}
                                </AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="votre@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Mot de passe</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button
                            type="submit"
                            className="w-full bg-green-600 hover:bg-green-700"
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
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                            Pas encore de compte ?{" "}
                            <button
                                type="button"
                                onClick={() => setLocation("/register")}
                                className="text-green-600 hover:underline font-medium"
                            >
                                Créer un compte
                            </button>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
