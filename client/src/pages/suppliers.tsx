import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Store, MapPin, Package, ArrowRight, Users, ShoppingCart, Shield,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import type { UserProfile } from "@shared/schema";

interface Supplier {
  id: string;
  businessName: string;
  city: string | null;
  country: string | null;
  description: string | null;
  productCount: number;
}

export default function SuppliersPage() {
  const { user } = useAuth();

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  const { data: suppliers, isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const isShopOwner = !!user && profile?.role === "shop_owner";
  const totalProducts = suppliers?.reduce((sum, s) => sum + s.productCount, 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-14">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer" data-testid="link-suppliers-logo">
                <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                  <Store className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-serif text-xl font-bold">SokoB2B</span>
                <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">Fournisseurs</Badge>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/marketplace">
                <Button variant="ghost" size="sm" data-testid="link-to-marketplace">
                  Marketplace
                </Button>
              </Link>
              <ThemeToggle />
              {user ? (
                <div className="flex items-center gap-2">
                  {isShopOwner && (
                    <Link href="/cart">
                      <Button variant="outline" size="icon" data-testid="button-suppliers-cart">
                        <ShoppingCart className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                  <Link href="/">
                    <Button variant="outline" size="sm" data-testid="button-back-dashboard">
                      Mon espace
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <a href="/api/login">
                    <Button variant="outline" size="sm" data-testid="button-suppliers-login">
                      Connexion
                    </Button>
                  </a>
                  <a href="/api/login" className="hidden sm:block">
                    <Button size="sm" data-testid="button-suppliers-signup">
                      Commencer
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-14">
        <div className="relative bg-primary/5 border-b overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div className="flex-1">
                <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold mb-2" data-testid="text-suppliers-title">
                  Nos Fournisseurs
                </h1>
                <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
                  Découvrez les grossistes et importateurs vérifiés qui approvisionnent les commerces d'Afrique de l'Ouest.
                </p>
              </div>
              <div className="flex items-center gap-4 sm:gap-6 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1.5" data-testid="text-stat-supplier-count">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">{suppliers?.length || 0}</span> fournisseurs
                </span>
                <span className="flex items-center gap-1.5" data-testid="text-stat-total-products">
                  <Package className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">{totalProducts}</span> produits
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardContent className="p-5">
                    <Skeleton className="w-12 h-12 rounded-full mb-4" />
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2 mb-3" />
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-9 w-full mt-4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : suppliers && suppliers.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.map((supplier) => (
                <SupplierCard key={supplier.id} supplier={supplier} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-muted-foreground/40" />
              </div>
              <h3 className="font-medium text-lg mb-2">Aucun fournisseur</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Les fournisseurs vérifiés apparaîtront ici bientôt.
              </p>
            </div>
          )}

          <div className="mt-16 grid sm:grid-cols-3 gap-6 py-10 border-t">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-medium text-sm mb-1" data-testid="text-suppliers-trust-verified">Fournisseurs vérifiés</h4>
              <p className="text-xs text-muted-foreground">Chaque fournisseur est vérifié avant son inscription</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-medium text-sm mb-1" data-testid="text-suppliers-trust-catalog">Catalogues complets</h4>
              <p className="text-xs text-muted-foreground">Des milliers de produits disponibles à prix de gros</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-medium text-sm mb-1" data-testid="text-suppliers-trust-local">Partenaires locaux</h4>
              <p className="text-xs text-muted-foreground">Présents dans toute l'Afrique de l'Ouest</p>
            </div>
          </div>

          {!user && (
            <div className="mt-6 rounded-md bg-primary/5 border border-primary/10 p-8 sm:p-10 text-center">
              <h3 className="font-serif text-xl sm:text-2xl font-bold mb-3" data-testid="text-suppliers-cta-title">
                Rejoignez notre réseau
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
                Créez votre compte pour commander directement auprès des fournisseurs ou inscrivez-vous en tant que fournisseur.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <a href="/api/login">
                  <Button size="lg" data-testid="button-suppliers-cta">
                    Créer mon compte
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <Store className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="font-serif text-lg font-bold">SokoB2B</span>
            </div>
            <p className="text-xs text-muted-foreground" data-testid="text-suppliers-footer">
              &copy; 2026 SokoB2B. Marketplace B2B pour l'Afrique de l'Ouest.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SupplierCard({ supplier }: { supplier: Supplier }) {
  const initials = supplier.businessName
    .split(" ")
    .map(w => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Card className="overflow-visible hover-elevate" data-testid={`card-supplier-${supplier.id}`}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-primary">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base truncate" data-testid={`text-supplier-name-${supplier.id}`}>
              {supplier.businessName}
            </h3>
            {(supplier.city || supplier.country) && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5" data-testid={`text-supplier-location-${supplier.id}`}>
                <MapPin className="w-3 h-3 shrink-0" />
                {[supplier.city, supplier.country].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
        </div>

        {supplier.description && (
          <p className="text-xs text-muted-foreground mb-4 line-clamp-2" data-testid={`text-supplier-desc-${supplier.id}`}>
            {supplier.description}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <Badge variant="secondary" className="text-xs gap-1" data-testid={`badge-supplier-products-${supplier.id}`}>
            <Package className="w-3 h-3" />
            {supplier.productCount} produit{supplier.productCount !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="outline" className="text-xs gap-1">
            <Shield className="w-3 h-3" />
            Vérifié
          </Badge>
        </div>

        <Link href={`/marketplace?supplier=${supplier.id}`}>
          <Button variant="outline" className="w-full" data-testid={`button-view-supplier-${supplier.id}`}>
            Voir les produits
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
