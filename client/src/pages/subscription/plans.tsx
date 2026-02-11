import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, Shield, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { SubscriptionPlan, UserSubscription } from "@shared/schema";
import { formatPrice } from "@/lib/constants";

export default function SubscriptionPlansPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: plans, isLoading: isLoadingPlans } = useQuery<SubscriptionPlan[]>({
        queryKey: ["/api/plans"],
    });

    const { data: subscription, isLoading: isLoadingSub } = useQuery<{ active: boolean; plan?: SubscriptionPlan; endDate?: string } & UserSubscription>({
        queryKey: ["/api/subscription"],
    });

    const subscribeMutation = useMutation({
        mutationFn: async (planId: string) => {
            const res = await apiRequest("POST", "/api/subscription", { planId });
            return res.json();
        },
        onSuccess: (data) => {
            toast({
                title: "Abonnement activé !",
                description: `Vous êtes maintenant abonné au plan ${data.subscription.plan.name}.`,
            });
            queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
            queryClient.invalidateQueries({ queryKey: ["/api/wallet"] }); // Update wallet balance
        },
        onError: (error: any) => {
            toast({
                title: "Erreur",
                description: error.message || "Impossible de souscrire à ce plan.",
                variant: "destructive",
            });
        },
    });

    if (isLoadingPlans || isLoadingSub) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const currentPlanId = subscription?.active ? subscription.planId : null;

    return (
        <div className="mx-auto space-y-8">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    Choisissez votre plan
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Plus de produits, plus de visibilité, plus de ventes.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto items-start">
                {plans?.map((plan) => {
                    const isCurrent = currentPlanId === plan.id;
                    const features = JSON.parse(plan.features as string || "[]");
                    const isPro = plan.slug === 'pro';
                    const isEnterprise = plan.slug === 'enterprise';

                    return (
                        <Card
                            key={plan.id}
                            className={`flex flex-col relative transition-all duration-300 ${isCurrent
                                ? "border-2 border-primary shadow-lg scale-105 z-10"
                                : "border border-border/60 hover:border-primary/50"
                                } ${isPro || isEnterprise
                                    ? "bg-gradient-to-b from-card to-accent/5"
                                    : "bg-card"
                                }`}
                        >
                            {isCurrent && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                                    <Badge className="px-6 py-1.5 text-sm font-bold shadow-md bg-primary text-primary-foreground animate-in fade-in zoom-in">
                                        Votre Plan Actuel
                                    </Badge>
                                </div>
                            )}

                            {(isPro || isEnterprise) && !isCurrent && (
                                <div className="absolute top-4 right-4">
                                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-0 font-medium">
                                        {isEnterprise ? "Best-Seller" : "Populaire"}
                                    </Badge>
                                </div>
                            )}

                            <CardHeader className="pb-8">
                                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                    {plan.name}
                                </CardTitle>
                                <CardDescription className="flex items-baseline gap-1 mt-4">
                                    <span className="text-4xl font-extrabold text-foreground">
                                        {formatPrice(Number(plan.price), plan.currency || "XOF")}
                                    </span>
                                    <span className="text-muted-foreground font-medium">/ mois</span>
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="flex-1 space-y-6">
                                <div className="space-y-4">
                                    {features.map((feature: string, i: number) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <div className={`mt-0.5 rounded-full p-1 ${isCurrent ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                                                }`}>
                                                <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                            </div>
                                            <span className="text-sm text-foreground/80 font-medium leading-tight">
                                                {feature}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>

                            <CardFooter className="pt-8">
                                <Button
                                    className="w-full h-12 text-base font-semibold shadow-sm transition-all"
                                    size="lg"
                                    variant={isCurrent ? "outline" : (isPro || isEnterprise ? "default" : "secondary")}
                                    disabled={isCurrent || subscribeMutation.isPending}
                                    onClick={() => subscribeMutation.mutate(plan.id)}
                                >
                                    {subscribeMutation.isPending && !isCurrent ? (
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    ) : isCurrent ? (
                                        <span className="flex items-center gap-2">
                                            <Check className="h-4 w-4" /> Actif
                                        </span>
                                    ) : (
                                        "Choisir ce plan"
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto pt-12 border-t">
                <div className="flex flex-col items-center text-center space-y-3 p-6 rounded-xl bg-muted/20">
                    <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Zap className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-lg">Boosts de Visibilité</h3>
                    <p className="text-sm text-muted-foreground text-pretty">
                        Vos produits apparaissent en tête des résultats de recherche, multipliant vos chances de vente par 3.
                    </p>
                </div>

                <div className="flex flex-col items-center text-center space-y-3 p-6 rounded-xl bg-muted/20">
                    <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                        <Shield className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-lg">Badge de Confiance</h3>
                    <p className="text-sm text-muted-foreground text-pretty">
                        Le badge "Vendeur Pro" ou "Certifié" rassure les clients et augmente instantanément votre taux de conversion.
                    </p>
                </div>

                <div className="flex flex-col items-center text-center space-y-3 p-6 rounded-xl bg-muted/20">
                    <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <Check className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-lg">Limites Étendues</h3>
                    <p className="text-sm text-muted-foreground text-pretty">
                        Ne soyez plus limité par le nombre de produits. Ajoutez tout votre catalogue et dominez votre niche.
                    </p>
                </div>
            </div>
        </div>
    );
}
