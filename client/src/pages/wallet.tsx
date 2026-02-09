import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Wallet, ArrowLeft, Plus, ArrowDownLeft, ArrowUpRight, Zap, Clock } from "lucide-react";
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
        title: "Recharge effectu\u00e9e",
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
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-1">
        <Link href="/products">
          <Button variant="ghost" size="icon" data-testid="button-back-from-wallet">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-wallet-title">Mon Portefeuille</h1>
          <p className="text-muted-foreground text-sm mt-0.5">G\u00e9rez votre solde et rechargez pour booster vos produits</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Wallet className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-0.5">Solde disponible</p>
                  <p className="text-3xl font-bold" data-testid="text-wallet-main-balance">
                    {formatPrice(balance)}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  XOF
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Recharger mon portefeuille
              </h2>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {TOPUP_PRESETS.map((amount) => (
                  <Button
                    key={amount}
                    variant={selectedPreset === amount ? "default" : "outline"}
                    size="sm"
                    onClick={() => { setSelectedPreset(amount); setCustomAmount(""); }}
                    data-testid={`button-preset-${amount}`}
                  >
                    {amount >= 1000 ? `${(amount / 1000).toFixed(0)}k` : amount}
                  </Button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Ou montant libre :</span>
                <Input
                  type="number"
                  placeholder="Ex: 15000"
                  value={customAmount}
                  onChange={(e) => { setCustomAmount(e.target.value); setSelectedPreset(null); }}
                  min={1000}
                  max={1000000}
                  data-testid="input-custom-amount"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">FCFA</span>
              </div>

              {topUpAmount > 0 && topUpAmount >= 1000 && (
                <div className="rounded-md bg-muted/50 p-3 flex items-center justify-between gap-3">
                  <span className="text-sm">Montant \u00e0 recharger</span>
                  <span className="font-bold" data-testid="text-topup-amount">
                    {formatPrice(topUpAmount)}
                  </span>
                </div>
              )}

              <Button
                className="w-full"
                onClick={() => topUp.mutate(topUpAmount)}
                disabled={topUp.isPending || topUpAmount < 1000}
                data-testid="button-confirm-topup"
              >
                <Plus className="w-4 h-4 mr-1" />
                {topUp.isPending ? "Recharge en cours..." : `Recharger ${topUpAmount >= 1000 ? formatPrice(topUpAmount) : ""}`}
              </Button>

              <p className="text-[11px] text-muted-foreground text-center">
                Montant minimum : 1 000 FCFA. Le solde est utilis\u00e9 pour payer les boosts de produits.
              </p>
            </CardContent>
          </Card>

          {transactions.length > 0 && (
            <div>
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3" data-testid="text-section-transactions">
                Historique des transactions
              </h2>
              <div className="space-y-2">
                {transactions.map((tx) => {
                  const typeInfo = TX_TYPE_LABELS[tx.type] || TX_TYPE_LABELS.topup;
                  const Icon = typeInfo.icon;
                  const isCredit = tx.type === "topup" || tx.type === "refund";

                  return (
                    <Card key={tx.id} data-testid={`card-transaction-${tx.id}`}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isCredit ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                          <Icon className={`w-4 h-4 ${typeInfo.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{tx.description || typeInfo.label}</p>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                            <Clock className="w-3 h-3" />
                            {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
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
