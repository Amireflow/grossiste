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
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ClipboardList,
  Store,
  LogOut,
  Plus,
} from "lucide-react";
import type { UserProfile } from "@shared/schema";

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  const isSupplier = profile?.role === "supplier";

  const shopMenuItems = [
    { title: "Tableau de bord", url: "/", icon: LayoutDashboard },
    { title: "Catalogue", url: "/catalog", icon: Package },
    { title: "Mon panier", url: "/cart", icon: ShoppingCart },
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
      <SidebarHeader className="p-4">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer" data-testid="link-logo">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Store className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-serif text-lg font-bold">SokoB2B</span>
          </div>
        </Link>
        {profile && (
          <div className="mt-3 text-xs text-muted-foreground">
            {isSupplier ? "Espace Fournisseur" : "Espace Commerçant"}
          </div>
        )}
      </SidebarHeader>
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
                      <span>{item.title}</span>
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
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-9 h-9">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
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
