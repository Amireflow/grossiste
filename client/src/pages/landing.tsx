import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Store, Truck, Shield, ChevronRight, ShoppingCart, Users, TrendingUp, Package, Smartphone, CreditCard, BarChart3, CheckCircle2, Globe, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { LandingHero } from "@/components/landing-hero";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-20">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                <Store className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-foreground">SokoB2B</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/marketplace" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors flex items-center gap-1.5" data-testid="link-marketplace">
                <Package className="w-4 h-4" />
                Marketplace
              </Link>
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Avantages
              </a>
              <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Comment ça marche
              </a>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link href="/login">
                <Button variant="ghost" className="font-medium hover:bg-muted" data-testid="button-login">
                  Connexion
                </Button>
              </Link>
              <Link href="/register" className="hidden sm:block">
                <Button className="rounded-full px-6 shadow-md hover:shadow-lg transition-all" data-testid="button-get-started">
                  Commencer
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <LandingHero />

      {/* Stats Section with ID */}
      <section id="stats" className="py-12 border-y bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="flex flex-col items-center">
              <span className="text-3xl lg:text-4xl font-bold text-primary mb-1">+2000</span>
              <span className="text-sm font-medium text-muted-foreground">Commerçants actifs</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl lg:text-4xl font-bold text-primary mb-1">500+</span>
              <span className="text-sm font-medium text-muted-foreground">Fournisseurs vérifiés</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl lg:text-4xl font-bold text-primary mb-1">24h</span>
              <span className="text-sm font-medium text-muted-foreground">Livraison moyenne</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl lg:text-4xl font-bold text-primary mb-1">100%</span>
              <span className="text-sm font-medium text-muted-foreground">Transactions sécurisées</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-background relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-primary font-semibold tracking-wide uppercase text-sm mb-3">Pourquoi nous choisir ?</h2>
            <h3 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-4">La plateforme tout-en-un pour votre commerce</h3>
            <p className="text-lg text-muted-foreground">
              Gérez vos approvisionnements, suivez vos commandes et développez votre activité avec des outils conçus pour vous.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="w-8 h-8 text-emerald-500" />,
                title: "Paiements Sécurisés",
                desc: "Payez à la livraison ou via mobile money. Votre argent est bloqué jusqu'à satisfaction."
              },
              {
                icon: <Truck className="w-8 h-8 text-blue-500" />,
                title: "Logistique Intégrée",
                desc: "Suivez vos commandes en temps réel. Nos partenaires livrent partout, même en zone reculée."
              },
              {
                icon: <Store className="w-8 h-8 text-purple-500" />,
                title: "Prix de Gros Directs",
                desc: "Accédez aux tarifs usine sans intermédiaire. Augmentez vos marges sur chaque vente."
              },
              {
                icon: <Smartphone className="w-8 h-8 text-orange-500" />,
                title: "Application Mobile",
                desc: "Gérez votre boutique depuis votre téléphone. Commandez, payez et vendez où que vous soyez."
              },
              {
                icon: <TrendingUp className="w-8 h-8 text-pink-500" />,
                title: "Financement",
                desc: "Obtenez du crédit pour vos stocks basés sur votre historique d'achats. Développez-vous plus vite."
              },
              {
                icon: <Users className="w-8 h-8 text-cyan-500" />,
                title: "Communauté",
                desc: "Rejoignez un réseau de milliers de commerçants. Échangez, apprenez et grandissez ensemble."
              }
            ].map((feature, i) => (
              <div key={i} className="group p-8 rounded-2xl bg-muted/20 border hover:border-primary/20 hover:bg-background hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 rounded-xl bg-background border shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h4 className="text-xl font-bold mb-3 text-foreground">{feature.title}</h4>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-muted/30 border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-primary font-semibold tracking-wide uppercase text-sm mb-3">Comment ça marche ?</h2>
              <h3 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-6">Simplifiez vos opérations quotidiennes</h3>

              <div className="space-y-8 mt-10">
                <div className="flex gap-5">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0 shadow-lg shadow-primary/20">
                    1
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Inscrivez-vous gratuitement</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Créez votre compte en quelques minutes avec votre numéro de téléphone. Aucune carte bancaire requise.
                    </p>
                  </div>
                </div>
                <div className="flex gap-5">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0 shadow-lg shadow-primary/20">
                    2
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Trouvez vos produits</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Parcourez le catalogue et comparez les prix des fournisseurs. Ajoutez au panier en un clic.
                    </p>
                  </div>
                </div>
                <div className="flex gap-5">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0 shadow-lg shadow-primary/20">
                    3
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Recevez et vendez</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Validez votre commande et recevez la marchandise directement à votre boutique. Payez à la livraison.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <Link href="/register">
                  <Button size="lg" className="h-12 px-8 rounded-full shadow-lg">
                    Commencer maintenant
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative order-first lg:order-last">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/10 absolute -inset-4 -z-10 blur-xl" />
              <Card className="border-none shadow-2xl overflow-hidden rounded-3xl rotate-1 hover:rotate-0 transition-transform duration-500">
                <img
                  src="https://images.unsplash.com/photo-1556740758-90de374c12ad?q=80&w=2670&auto=format&fit=crop"
                  alt="App Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                  <div className="text-white">
                    <p className="font-bold text-lg mb-1">Application Mobile</p>
                    <p className="text-white/80 text-sm">Gérez tout depuis votre poche, 24/7.</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-10 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <Store className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="font-serif text-lg font-bold tracking-tight">SokoB2B</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; 2026 SokoB2B. Tous droits reserves. Fait avec passion pour l'Afrique de l'Ouest.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, accent }: { icon: React.ReactNode; title: string; description: string; accent: string }) {
  return (
    <Card className="hover-elevate overflow-visible">
      <CardContent className="p-5 sm:p-6">
        <div className={`w-10 h-10 rounded-md flex items-center justify-center ${accent} mb-4`}>
          {icon}
        </div>
        <h3 className="font-semibold text-[15px] mb-1.5">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

function StepCard({ number, title, description, icon }: { number: string; title: string; description: string; icon: React.ReactNode }) {
  return (
    <div className="text-center">
      <div className="relative w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
        <div className="text-primary">{icon}</div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-bold">
          {number}
        </div>
      </div>
      <h3 className="font-semibold text-base mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">{description}</p>
    </div>
  );
}

function StatCard({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <Card className="overflow-visible">
      <CardContent className="p-5 sm:p-6 text-center">
        <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
          {icon}
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-primary mb-1.5 tabular-nums">{value}</div>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
