import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Wallet, ChevronLeft, Plus, ArrowDownLeft, ArrowUpRight, Zap, Clock } from "lucide-react";
import { formatPrice } from "@/lib/constants";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WalletTransaction } from "@shared/schema";

interface WalletData {
  balance: string;
  transactions: WalletTransaction[];
}

const TOPUP_PRESETS = [5000, 10000, 25000, 50000, 100000];

const TX_TYPE_LABELS: Record<string, { label: string; icon: typeof ArrowDownLeft; color: string }> = {
  topup: { label: "Recharge", icon: ArrowDownLeft, color: "text-emerald-600 dark:text-emerald-400" },
  boost_charge: { label: "Boost", icon: ArrowUpRight, color: "text-red-500 dark:text-red-400" },
  refund: { label: "Remboursement", icon: ArrowDownLeft, color: "text-blue-500 dark:text-blue-400" },
};

export default function WalletPage() {
  const { toast } = useToast();
  const [customAmount, setCustomAmount] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  const { data: walletData, isLoading } = useQuery<WalletData>({
    queryKey: ["/api/wallet"],
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
        description: `${formatPrice(parseFloat(data.balance))} disponible dans votre portefeuille`,
      });
      setCustomAmount("");
      setSelectedPreset(null);
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'effectuer la recharge", variant: "destructive" });
    },
  });

  const balance = parseFloat(walletData?.balance || "0");
  const transactions = walletData?.transactions || [];

  const topUpAmount = selectedPreset || (customAmount ? parseInt(customAmount) : 0);

  return (
    <div className="p-3 sm:p-6 max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2 mb-1">
        <Link href="/products">
          <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-back-from-wallet">
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-serif text-xl sm:text-3xl font-bold tracking-tight" data-testid="text-wallet-title">Mon Portefeuille</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">Gérez votre solde et rechargez pour booster vos produits</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : (
        <>
          <Card className="rounded-2xl shadow-sm border-border/50">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-0.5">Solde disponible</p>
                  <p className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-wallet-main-balance">
                    {formatPrice(balance)}
                  </p>
                </div>
                <Badge variant="secondary" className="text-[10px] sm:text-xs rounded-full px-2">
                  XOF
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm border-border/50">
            <CardContent className="p-4 sm:p-6 space-y-4">
              <h2 className="font-semibold text-base sm:text-lg flex items-center gap-2">
                <div className="bg-primary/10 p-1.5 rounded-full">
                  <Plus className="w-3.5 h-3.5 text-primary" />
                </div>
                Recharger mon portefeuille
              </h2>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
                {TOPUP_PRESETS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => { setSelectedPreset(amount); setCustomAmount(""); }}
                    className={`
                      cursor-pointer rounded-xl border p-2 flex flex-col items-center justify-center gap-0.5 transition-all
                      ${selectedPreset === amount
                        ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                        : "bg-background hover:bg-muted/50 border-input"
                      }
                    `}
                    data-testid={`option-preset-${amount}`}
                  >
                    <span className={`font-bold text-sm sm:text-lg ${selectedPreset === amount ? "text-primary" : ""}`}>
                      {formatPrice(amount).replace(" FCFA", "")}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground font-medium">FCFA</span>
                  </button>
                ))}
              </div>

              <div className="pt-1">
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="Montant libre (Ex: 15000)"
                    value={customAmount}
                    onChange={(e) => { setCustomAmount(e.target.value); setSelectedPreset(null); }}
                    min={1000}
                    max={1000000}
                    className="pl-4 pr-16 h-10 sm:h-12 text-base sm:text-lg font-medium shadow-sm rounded-xl"
                    data-testid="input-custom-amount"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs sm:text-sm font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                    FCFA
                  </div>
                </div>
              </div>

              {topUpAmount > 0 && topUpAmount >= 1000 && (
                <div className="rounded-xl bg-muted/50 p-2.5 flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">À payer :</span>
                  <span className="font-bold text-base" data-testid="text-topup-amount">
                    {formatPrice(topUpAmount)}
                  </span>
                </div>
              )}

              <Button
                className="w-full h-10 sm:h-11 rounded-full text-sm sm:text-base font-medium shadow-sm"
                onClick={() => topUp.mutate(topUpAmount)}
                disabled={topUp.isPending || topUpAmount < 1000}
                data-testid="button-confirm-topup"
              >
                {topUp.isPending ? (
                  "Recharge en cours..."
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-1.5 fill-current" />
                    Recharger maintenant
                  </>
                )}
              </Button>

              <p className="text-[10px] text-muted-foreground text-center px-4">
                Min. 1 000 FCFA. Transactions sécurisées.
              </p>
            </CardContent>
          </Card>

          {transactions.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider px-1" data-testid="text-section-transactions">
                Historique récent
              </h2>
              <div className="space-y-2">
                {transactions.map((tx) => {
                  const typeInfo = TX_TYPE_LABELS[tx.type] || TX_TYPE_LABELS.topup;
                  const Icon = typeInfo.icon;
                  const isCredit = tx.type === "topup" || tx.type === "refund";

                  return (
                    <Card key={tx.id} data-testid={`card-transaction-${tx.id}`} className="rounded-xl shadow-none border-border/40 bg-card/50">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isCredit ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" : "bg-red-100 dark:bg-red-900/30 text-red-500"}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate leading-tight">{tx.description || typeInfo.label}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                            <Clock className="w-3 h-3" />
                            {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                          </div>
                        </div>
                        <span className={`font-bold text-sm whitespace-nowrap ${isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`} data-testid={`text-tx-amount-${tx.id}`}>
                          {isCredit ? "+" : "-"}{formatPrice(parseFloat(tx.amount))}
                        </span>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
