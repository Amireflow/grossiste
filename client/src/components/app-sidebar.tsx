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
  Sparkles,
  Globe,
} from "lucide-react";
import type { UserProfile } from "@shared/schema";

interface CartItemBasic {
  id: string;
  quantity: number;
}

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  const { data: cartItems } = useQuery<CartItemBasic[]>({
    queryKey: ["/api/cart"],
    enabled: !!user && profile?.role === "shop_owner",
  });

  const isSupplier = profile?.role === "supplier";
  const cartCount = cartItems?.length || 0;

  const shopMenuItems = [
    { title: "Tableau de bord", url: "/", icon: LayoutDashboard },
    { title: "Mon panier", url: "/cart", icon: ShoppingCart, badge: cartCount },
    { title: "Mes commandes", url: "/orders", icon: ClipboardList },
  ];

  const supplierMenuItems = [
    { title: "Tableau de bord", url: "/", icon: LayoutDashboard },
    { title: "Mes produits", url: "/products", icon: Package },
    { title: "Commandes reçues", url: "/orders", icon: ClipboardList },
  ];

  const menuItems = isSupplier ? supplierMenuItems : shopMenuItems;

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U"
    : "U";

  return (
    <Sidebar>
      <SidebarHeader className="p-4 pb-2">
        <Link href="/">
          <div className="flex items-center gap-2.5 cursor-pointer" data-testid="link-logo">
            <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center">
              <Store className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-serif text-lg font-bold leading-none">SokoB2B</span>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">Marketplace B2B</p>
            </div>
          </div>
        </Link>
      </SidebarHeader>

      {profile && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary/5">
            <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-xs font-medium text-primary">
              {isSupplier ? "Espace Fournisseur" : "Espace Commerçant"}
            </span>
          </div>
        </div>
      )}

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
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
                    <Link href={item.url} data-testid={`link-nav-${item.url.replace("/", "") || "dashboard"}`}>
                      <item.icon className="w-4 h-4" />
                      <span className="flex-1">{item.title}</span>
                      {"badge" in item && (item as any).badge > 0 && (
                        <Badge variant="default" className="text-[10px]" data-testid="badge-cart-count">
                          {(item as any).badge}
                        </Badge>
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
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/products/new" data-testid="link-add-product">
                      <Plus className="w-4 h-4" />
                      <span>Ajouter un produit</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        <SidebarGroup>
          <SidebarGroupLabel>Découvrir</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/marketplace"}>
                  <Link href="/marketplace" data-testid="link-nav-marketplace">
                    <Globe className="w-4 h-4" />
                    <span>Marketplace</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-9 h-9">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" data-testid="text-user-name">
              {user?.firstName || user?.email || "Utilisateur"}
            </p>
            <p className="text-xs text-muted-foreground truncate" data-testid="text-business-name">
              {profile?.businessName || ""}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => logout()}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Déconnexion
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
