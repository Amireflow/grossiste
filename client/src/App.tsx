import { Switch, Route, useLocation, useRoute, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Store } from "lucide-react";
import { UserNav } from "@/components/user-nav";


import MarketplacePage from "@/pages/marketplace";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import ShopPage from "@/pages/shop";
import OrderDetailsPage from "@/pages/order-details";

import OnboardingPage from "@/pages/onboarding";
import DashboardPage from "@/pages/dashboard";
import CartPage from "@/pages/cart";
import OrdersPage from "@/pages/orders";
import ProductsPage from "@/pages/products";
import ProductFormPage from "@/pages/product-form";
import BoostsPage from "@/pages/boosts";
import WalletPage from "@/pages/wallet";
import ProfilePage from "@/pages/profile";
import NotFound from "@/pages/not-found";

import type { UserProfile } from "@shared/schema";

const PAGE_TITLES: Record<string, string> = {
  "/": "Tableau de bord",
  "/cart": "Mon panier",
  "/orders": "Commandes",
  "/products": "Mes produits",
  "/products/new": "Nouveau produit",
  "/boosts": "Mes Boosts",
  "/wallet": "Mon Portefeuille",
  "/marketplace": "Marketplace",
};

function AuthenticatedRouter() {
  const [location] = useLocation();
  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
  });

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mx-auto">
            <Store className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <Skeleton className="h-4 w-32 mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <OnboardingPage />;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const pageTitle = PAGE_TITLES[location] ||
    (location.startsWith("/products/") ? "Modifier le produit" : "");

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-4 px-6 h-20 shrink-0 sticky top-0 z-40 bg-background">
            <div className="flex items-center gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              {pageTitle && (
                <span className="text-sm font-medium text-muted-foreground hidden sm:block" data-testid="text-page-title">
                  {pageTitle}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <UserNav />
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-muted/20">
            <Switch>
              <Route path="/" component={DashboardPage} />
              <Route path="/cart" component={CartPage} />
              <Route path="/orders" component={OrdersPage} />
              <Route path="/orders/:id" component={OrderDetailsPage} />
              <Route path="/products" component={ProductsPage} />
              <Route path="/products/new" component={ProductFormPage} />
              <Route path="/products/:id/edit" component={ProductFormPage} />
              <Route path="/boosts" component={BoostsPage} />
              <Route path="/wallet" component={WalletPage} />
              <Route path="/profile" component={ProfilePage} />

              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppContent() {
  const [location] = useLocation();
  const { user, isLoading } = useAuth();

  const [isShopPage] = useRoute("/shop/:id");

  // Public routes that don't require auth check
  if (location === "/marketplace" || location === "/catalog") {
    return <MarketplacePage />;
  }

  if (isShopPage) {
    return <ShopPage />;
  }

  if (location === "/login") {
    return user ? <Redirect to="/" /> : <LoginPage />;
  }

  if (location === "/register") {
    return user ? <Redirect to="/" /> : <RegisterPage />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="space-y-4 text-center">
          <div className="w-14 h-14 rounded-md bg-primary/10 flex items-center justify-center mx-auto">
            <Store className="w-7 h-7 text-primary animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">Chargement de SokoB2B...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <MarketplacePage />;
  }

  return <AuthenticatedRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
