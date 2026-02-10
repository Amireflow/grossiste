import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ClipboardList,
  Store,
  LogOut,
  Plus,
  Globe,
  Zap,
  Wallet,
  Users,
  Settings,
} from "lucide-react";
import type { UserProfile, WalletTransaction } from "@shared/schema";
import { formatPrice } from "@/lib/constants";

interface CartItemBasic {
  id: string;
  quantity: number;
}

interface WalletData {
  balance: string;
  transactions: WalletTransaction[];
}

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { setOpenMobile, isMobile } = useSidebar();

  const closeSidebar = () => {
    if (isMobile) setOpenMobile(false);
  };

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  const { data: cartItems } = useQuery<CartItemBasic[]>({
    queryKey: ["/api/cart"],
    enabled: !!user && profile?.role === "shop_owner",
  });

  const { data: walletData } = useQuery<WalletData>({
    queryKey: ["/api/wallet"],
    enabled: !!user && profile?.role === "supplier",
  });

  const isSupplier = profile?.role === "supplier";
  const isAdmin = profile?.role === "admin";
  const cartCount = cartItems?.length || 0;
  const walletBalance = parseFloat(walletData?.balance || "0");

  const shopMenuItems = [
    { title: "Tableau de bord", url: "/", icon: LayoutDashboard },
    { title: "Mon panier", url: "/cart", icon: ShoppingCart, badge: cartCount },
    { title: "Mes commandes", url: "/orders", icon: ClipboardList },
  ];

  const supplierMenuItems = [
    { title: "Tableau de bord", url: "/", icon: LayoutDashboard },
    { title: "Mes produits", url: "/products", icon: Package },
    { title: "Mes Boosts", url: "/boosts", icon: Zap },
    { title: "Portefeuille", url: "/wallet", icon: Wallet },
    { title: "Commandes recues", url: "/orders", icon: ClipboardList },
  ];

  const adminMenuItems = [
    { title: "Vue d'ensemble", url: "/admin", icon: LayoutDashboard },
    { title: "Utilisateurs", url: "/admin/users", icon: Users },
    { title: "Commandes", url: "/admin/orders", icon: ShoppingCart },
    { title: "Produits", url: "/admin/products", icon: Package },
    { title: "Paramètres", url: "/admin/settings", icon: Settings },
  ];

  const menuItems = isAdmin ? adminMenuItems : isSupplier ? supplierMenuItems : shopMenuItems;

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U"
    : "U";

  return (
    <Sidebar>
      <SidebarHeader className="p-6 pb-2">
        <Link href="/">
          <div className="flex items-center gap-2.5 cursor-pointer" data-testid="link-logo">
            <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center">
              <Store className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-serif text-lg font-bold leading-none tracking-tight">SokoB2B</span>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">Marketplace B2B</p>
            </div>
          </div>
        </Link>
      </SidebarHeader>



      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2.5">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.url === "/"
                        ? location === "/"
                        : location.startsWith(item.url)
                    }
                  >
                    <Link href={item.url} onClick={closeSidebar} data-testid={`link-nav-${item.url.replace("/", "") || "dashboard"}`}>
                      <item.icon className="w-4 h-4" />
                      <span className="flex-1">{item.title}</span>
                      {"badge" in item && (item as any).badge > 0 && (
                        <Badge variant="default" className="text-[10px]" data-testid="badge-cart-count">
                          {(item as any).badge}
                        </Badge>
                      )}
                      {item.url === "/wallet" && walletBalance > 0 && (
                        <span className="text-[10px] text-muted-foreground font-medium tabular-nums" data-testid="text-sidebar-wallet-balance">
                          {formatPrice(walletBalance)}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isSupplier && (
          <SidebarGroup>
            <SidebarGroupLabel>Actions rapides</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-2.5">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/products/new" onClick={closeSidebar} data-testid="link-add-product">
                      <Plus className="w-4 h-4" />
                      <span>Ajouter un produit</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Decouvrir</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2.5">
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/marketplace"}>
                  <Link href="/marketplace" onClick={closeSidebar} data-testid="link-nav-marketplace">
                    <Globe className="w-4 h-4" />
                    <span>Marketplace</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <p className="text-[10px] text-muted-foreground text-center">
          &copy; 2026 SokoB2B
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
