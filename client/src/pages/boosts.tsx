import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Zap, Star, Clock, Package, ChevronLeft, Pause, Play, XCircle } from "lucide-react";
import { formatPrice } from "@/lib/constants";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ProductBoost } from "@shared/schema";

interface BoostWithProduct extends ProductBoost {
  productName: string;
}

const BOOST_LEVEL_LABELS: Record<string, string> = {
  standard: "Standard",
  premium: "Premium",
};

const BOOST_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "Actif", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  paused: { label: "En pause", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  expired: { label: "Terminé", color: "bg-muted text-muted-foreground" },
};

export default function BoostsPage() {
  const { toast } = useToast();

  const { data: boosts, isLoading } = useQuery<BoostWithProduct[]>({
    queryKey: ["/api/boosts"],
  });

  const updateBoost = useMutation({
    mutationFn: async ({ boostId, status }: { boostId: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/boosts/${boostId}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boosts"] });
      toast({ title: "Boost mis à jour" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de modifier le boost", variant: "destructive" });
    },
  });

  const now = new Date();
  const activeBoosts = boosts?.filter(b => b.status === "active" && new Date(b.endDate) >= now) || [];
  const pausedBoosts = boosts?.filter(b => b.status === "paused") || [];
  const expiredBoosts = boosts?.filter(b => b.status === "expired" || (b.status === "active" && new Date(b.endDate) < now)) || [];

  const getRemainingDays = (endDate: string | Date) => {
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start sm:items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/products">
              <Button variant="ghost" size="icon" data-testid="button-back-products">
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-boosts-title">Mes Boosts</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-11">
            Gérez vos annonces sponsorisées et boosts de produits
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-active-boosts-count">{activeBoosts.length}</p>
              <p className="text-xs text-muted-foreground">Boosts actifs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <Pause className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-paused-boosts-count">{pausedBoosts.length}</p>
              <p className="text-xs text-muted-foreground">En pause</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-expired-boosts-count">{expiredBoosts.length}</p>
              <p className="text-xs text-muted-foreground">Terminés</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : boosts && boosts.length > 0 ? (
        <div className="space-y-6">
          {activeBoosts.length > 0 && (
            <div>
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3" data-testid="text-section-active">
                Boosts actifs
              </h2>
              <div className="space-y-3">
                {activeBoosts.map((boost) => (
                  <BoostCard
                    key={boost.id}
                    boost={boost}
                    remainingDays={getRemainingDays(boost.endDate)}
                    onPause={() => updateBoost.mutate({ boostId: boost.id, status: "paused" })}
                    onStop={() => updateBoost.mutate({ boostId: boost.id, status: "expired" })}
                    isPending={updateBoost.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {pausedBoosts.length > 0 && (
            <div>
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3" data-testid="text-section-paused">
                En pause
              </h2>
              <div className="space-y-3">
                {pausedBoosts.map((boost) => (
                  <BoostCard
                    key={boost.id}
                    boost={boost}
                    remainingDays={getRemainingDays(boost.endDate)}
                    onResume={() => updateBoost.mutate({ boostId: boost.id, status: "active" })}
                    onStop={() => updateBoost.mutate({ boostId: boost.id, status: "expired" })}
                    isPending={updateBoost.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {expiredBoosts.length > 0 && (
            <div>
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3" data-testid="text-section-expired">
                Terminés
              </h2>
              <div className="space-y-3">
                {expiredBoosts.map((boost) => (
                  <BoostCard key={boost.id} boost={boost} remainingDays={0} isPending={false} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Zap className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <h3 className="font-medium text-lg mb-2">Aucun boost</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">
            Boostez vos produits pour les faire apparaître en tête du marketplace et attirer plus de clients.
          </p>
          <Link href="/products">
            <Button data-testid="button-go-products">
              <Package className="w-4 h-4 mr-1" />
              Voir mes produits
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function BoostCard({
  boost,
  remainingDays,
  onPause,
  onResume,
  onStop,
  isPending,
}: {
  boost: BoostWithProduct;
  remainingDays: number;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  isPending: boolean;
}) {
  const statusInfo = BOOST_STATUS_LABELS[boost.status] || BOOST_STATUS_LABELS.expired;
  const isExpired = boost.status === "expired" || remainingDays <= 0;

  return (
    <Card className={isExpired ? "opacity-60" : ""} data-testid={`card-boost-${boost.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
            {boost.boostLevel === "premium" ? (
              <Star className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            ) : (
              <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate" data-testid={`text-boost-product-${boost.id}`}>
              {boost.productName}
            </h3>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <Badge variant="secondary" className="text-[10px]">
                {BOOST_LEVEL_LABELS[boost.boostLevel] || boost.boostLevel}
              </Badge>
              <Badge variant="secondary" className={`text-[10px] ${statusInfo.color}`}>
                {statusInfo.label}
              </Badge>
              {!isExpired && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {remainingDays}j restant{remainingDays !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {boost.status === "active" && !isExpired && onPause && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPause}
                disabled={isPending}
                data-testid={`button-pause-boost-${boost.id}`}
              >
                <Pause className="w-3 h-3 mr-1" />
                Pause
              </Button>
            )}
            {boost.status === "paused" && onResume && (
              <Button
                variant="outline"
                size="sm"
                onClick={onResume}
                disabled={isPending}
                data-testid={`button-resume-boost-${boost.id}`}
              >
                <Play className="w-3 h-3 mr-1" />
                Reprendre
              </Button>
            )}
            {!isExpired && onStop && (
              <Button
                variant="outline"
                size="sm"
                onClick={onStop}
                disabled={isPending}
                data-testid={`button-stop-boost-${boost.id}`}
              >
                <XCircle className="w-3 h-3 mr-1" />
                Arrêter
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3 text-[11px] text-muted-foreground ml-14 flex-wrap">
          <span>Début: {new Date(boost.startDate).toLocaleDateString("fr-FR")}</span>
          <span>Fin: {new Date(boost.endDate).toLocaleDateString("fr-FR")}</span>
        </div>
      </CardContent>
    </Card>
  );
}
