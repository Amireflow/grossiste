import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
    Wallet, Plus, ArrowDownLeft, ArrowUpRight, Clock, Shield,
    Check, ChevronRight, Loader2, Crown, Sparkles, Gift,
} from "lucide-react";
import { formatPrice } from "@/lib/constants";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { WalletTransaction } from "@shared/schema";

interface WalletData {
    balance: string;
    transactions: WalletTransaction[];
}

interface SubscriptionPlan {
    id: string;
    name: string;
    slug: string;
    price: string;
    currency: string;
    features: string;
    maxProducts: number;
    boostCredits: number;
}

interface UserSubscription {
    planId: string;
    active: boolean;
    currentPeriodEnd: string | null;
}

const TOPUP_PRESETS = [
    { amount: 5000, bonus: 0 },
    { amount: 10000, bonus: 0 },
    { amount: 25000, bonus: 5 },
    { amount: 50000, bonus: 10 },
    { amount: 100000, bonus: 15 },
];

function getBonusPercent(amount: number): number {
    if (amount >= 100000) return 15;
    if (amount >= 50000) return 10;
    if (amount >= 25000) return 5;
    return 0;
}

const TX_TYPE_LABELS: Record<string, { label: string; icon: typeof ArrowDownLeft; color: string }> = {
    topup: { label: "Recharge", icon: ArrowDownLeft, color: "text-emerald-600" },
    boost_charge: { label: "Boost", icon: ArrowUpRight, color: "text-red-500" },
    subscription_charge: { label: "Abonnement", icon: ArrowUpRight, color: "text-red-500" },
    refund: { label: "Remboursement", icon: ArrowDownLeft, color: "text-blue-500" },
};

export default function AccountProPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [customAmount, setCustomAmount] = useState("");
    const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

    // Wallet
    const { data: walletData, isLoading: walletLoading } = useQuery<WalletData>({
        queryKey: ["/api/wallet"],
    });

    // Subscription
    const { data: plans } = useQuery<SubscriptionPlan[]>({
        queryKey: ["/api/plans"],
    });

    const { data: subscription } = useQuery<UserSubscription>({
        queryKey: ["/api/subscription"],
        enabled: !!user,
    });

    const topUp = useMutation({
        mutationFn: async (amount: number) => {
            const res = await apiRequest("POST", "/api/wallet/topup", { amount });
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
            queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
            toast({
                title: "Recharge effectuée",
                description: `${formatPrice(parseFloat(data.balance))} disponible`,
            });
            setCustomAmount("");
            setSelectedPreset(null);
        },
        onError: () => {
            toast({ title: "Erreur", description: "Impossible d'effectuer la recharge", variant: "destructive" });
        },
    });

    const subscribeMutation = useMutation({
        mutationFn: async (planId: string) => {
            const res = await apiRequest("POST", "/api/subscription", { planId });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
            queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
            queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
            toast({ title: "Abonnement activé !" });
        },
        onError: (err: Error) => {
            toast({ title: "Erreur", description: err.message, variant: "destructive" });
        },
    });

    const balance = parseFloat(walletData?.balance || "0");
    const transactions = walletData?.transactions || [];
    const topUpAmount = selectedPreset || (customAmount ? parseInt(customAmount) : 0);
    const bonusPercent = getBonusPercent(topUpAmount);
    const bonusAmount = Math.floor(topUpAmount * bonusPercent / 100);
    const totalCredited = topUpAmount + bonusAmount;
    const currentPlanId = subscription?.active ? subscription.planId : null;
    const currentPlan = plans?.find(p => p.id === currentPlanId);

    return (
        <div className="p-3 sm:p-6 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2">
                    <Crown className="w-6 h-6 text-primary" />
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
                        Mon Compte Pro
                    </h1>
                </div>
                <p className="text-muted-foreground text-sm mt-1 ml-8">
                    Gérez votre abonnement et votre portefeuille.
                </p>
            </div>

            {/* Top overview cards */}
            <div className="grid sm:grid-cols-2 gap-4">
                {/* Wallet summary card */}
                <Card className="border border-border/60">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Wallet className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-muted-foreground">Solde disponible</p>
                                <p className="text-2xl font-bold tracking-tight">
                                    {walletLoading ? <Skeleton className="h-7 w-28" /> : formatPrice(balance)}
                                </p>
                            </div>
                            <Badge variant="secondary" className="text-[10px] rounded-full px-2 shrink-0">XOF</Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Plan summary card */}
                <Card className="border border-border/60">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Shield className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-muted-foreground">Plan actif</p>
                                <p className="text-2xl font-bold tracking-tight">
                                    {currentPlan ? currentPlan.name : "Gratuit"}
                                </p>
                            </div>
                            {currentPlan && (
                                <Badge className="bg-primary/10 text-primary border-0 text-[10px] shrink-0">Actif</Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recharge section */}
            <div className="space-y-3">
                <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                    <Plus className="w-4 h-4 text-primary" />
                    Recharger
                </h2>

                <Card className="border-border/40 shadow-sm">
                    <CardContent className="p-4 sm:p-5 space-y-4">
                        {/* Preset chips */}
                        <div className="flex flex-wrap gap-2">
                            {TOPUP_PRESETS.map(({ amount, bonus }) => {
                                const isSelected = selectedPreset === amount;
                                return (
                                    <button
                                        key={amount}
                                        onClick={() => { setSelectedPreset(amount); setCustomAmount(""); }}
                                        className={`
                                            relative cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-all duration-150
                                            ${isSelected
                                                ? "bg-primary text-primary-foreground shadow-md scale-105"
                                                : "bg-muted/60 text-foreground hover:bg-muted border border-transparent hover:border-border/60"
                                            }
                                        `}
                                    >
                                        {formatPrice(amount).replace(" FCFA", "")}
                                        <span className="text-[10px] font-medium opacity-70 ml-0.5">F</span>
                                        {bonus > 0 && (
                                            <span className={`absolute -top-2 -right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isSelected
                                                    ? "bg-yellow-400 text-yellow-900"
                                                    : "bg-primary/15 text-primary"
                                                }`}>
                                                +{bonus}%
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Custom amount */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Input
                                    type="number"
                                    placeholder="Autre montant..."
                                    value={customAmount}
                                    onChange={(e) => { setCustomAmount(e.target.value); setSelectedPreset(null); }}
                                    min={1000}
                                    max={1000000}
                                    className="h-11 pl-4 pr-16 text-base font-medium rounded-xl"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                                    FCFA
                                </span>
                            </div>
                        </div>

                        {/* Summary + CTA */}
                        {topUpAmount >= 1000 && (
                            <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 sm:p-4 space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Solde actuel</span>
                                    <span className="font-medium">{formatPrice(balance)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Recharge</span>
                                    <span className="font-semibold text-primary">+ {formatPrice(topUpAmount)}</span>
                                </div>
                                {bonusPercent > 0 && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-1.5">
                                            <Gift className="w-3.5 h-3.5 text-yellow-500" />
                                            Bonus +{bonusPercent}%
                                        </span>
                                        <span className="font-semibold text-yellow-600 dark:text-yellow-400">+ {formatPrice(bonusAmount)}</span>
                                    </div>
                                )}
                                <Separator className="my-1" />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Total crédité</span>
                                    <span className="text-lg font-bold text-primary">{formatPrice(balance + totalCredited)}</span>
                                </div>
                            </div>
                        )}

                        <Button
                            className="w-full h-11 rounded-xl text-sm sm:text-base font-semibold"
                            onClick={() => topUp.mutate(topUpAmount)}
                            disabled={topUp.isPending || topUpAmount < 1000}
                        >
                            {topUp.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Sparkles className="w-4 h-4 mr-1.5" />
                            )}
                            {topUp.isPending ? "Recharge en cours..." : topUpAmount >= 1000 ? `Recharger ${formatPrice(topUpAmount)}${bonusPercent > 0 ? ` (+${bonusPercent}% bonus)` : ""}` : "Sélectionnez un montant"}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Transaction History */}
            <div className="space-y-3">
                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    Historique
                    {transactions.length > 0 && (
                        <Badge variant="secondary" className="text-[10px] ml-1 rounded-full">{transactions.length}</Badge>
                    )}
                </h3>

                {transactions.length === 0 ? (
                    <Card className="border-dashed border-border/50">
                        <CardContent className="p-8 text-center">
                            <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto mb-3">
                                <Clock className="w-5 h-5 text-muted-foreground/50" />
                            </div>
                            <p className="text-sm text-muted-foreground">Aucune transaction pour le moment</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">Vos transactions apparaîtront ici.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-border/40 overflow-hidden">
                        <CardContent className="p-0 divide-y divide-border/30">
                            {transactions.slice(0, 10).map((tx) => {
                                const typeInfo = TX_TYPE_LABELS[tx.type] || TX_TYPE_LABELS.topup;
                                const Icon = typeInfo.icon;
                                const isCredit = tx.type === "topup" || tx.type === "refund";
                                return (
                                    <div key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isCredit ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                                            <Icon className={`w-4 h-4 ${isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate leading-tight">
                                                {tx.description || typeInfo.label}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                                {tx.createdAt
                                                    ? new Date(tx.createdAt).toLocaleDateString("fr-FR", {
                                                        day: "numeric", month: "long", year: "numeric",
                                                        hour: "2-digit", minute: "2-digit"
                                                    })
                                                    : ""}
                                            </p>
                                        </div>
                                        <span className={`text-sm font-bold tabular-nums whitespace-nowrap ${isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                                            {isCredit ? "+" : "−"}{formatPrice(parseFloat(tx.amount))}
                                        </span>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                )}
            </div>

            <Separator />

            {/* Subscription Plans Section */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    Mon Abonnement
                </h2>
                <p className="text-sm text-muted-foreground">
                    Plus de produits, plus de visibilité, plus de ventes.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plans?.map((plan) => {
                        const isCurrent = currentPlanId === plan.id;
                        const features = JSON.parse(plan.features as string || "[]");

                        return (
                            <Card
                                key={plan.id}
                                className={`flex flex-col relative transition-colors duration-200 ${isCurrent
                                    ? "border-2 border-primary"
                                    : "border border-border/60 hover:border-primary/40"
                                    }`}
                            >
                                {isCurrent && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                                        <Badge className="px-4 py-1 text-xs font-bold shadow-sm bg-primary text-primary-foreground">
                                            Actuel
                                        </Badge>
                                    </div>
                                )}

                                <CardContent className="p-5 flex flex-col flex-1">
                                    <h3 className="text-lg font-bold">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1 mt-2 mb-4">
                                        <span className="text-3xl font-extrabold text-foreground">
                                            {formatPrice(Number(plan.price), plan.currency || "XOF")}
                                        </span>
                                        <span className="text-muted-foreground text-sm">/ mois</span>
                                    </div>

                                    <div className="space-y-2.5 flex-1 mb-4">
                                        {features.map((feature: string, i: number) => (
                                            <div key={i} className="flex items-start gap-2">
                                                <div className={`mt-0.5 rounded-full p-0.5 ${isCurrent ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                                                    }`}>
                                                    <Check className="h-3 w-3" strokeWidth={3} />
                                                </div>
                                                <span className="text-sm text-foreground/80 leading-tight">{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <Button
                                        className="w-full"
                                        variant={isCurrent ? "outline" : "default"}
                                        disabled={isCurrent || subscribeMutation.isPending}
                                        onClick={() => subscribeMutation.mutate(plan.id)}
                                    >
                                        {subscribeMutation.isPending && !isCurrent ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : isCurrent ? (
                                            "Plan actuel"
                                        ) : (
                                            <>
                                                <ChevronRight className="w-4 h-4 mr-1" />
                                                Choisir ce plan
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
