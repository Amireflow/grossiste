import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Store, Truck, Shield, ArrowRight, ShoppingCart, Users, TrendingUp, Package, Smartphone, CreditCard, BarChart3, ChevronRight } from "lucide-react";
import { Link } from "wouter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <Store className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-serif text-xl font-bold tracking-tight">SokoB2B</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/marketplace" className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1.5" data-testid="link-marketplace">
                <Package className="w-3.5 h-3.5" />
                Marketplace
              </Link>
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-features">
                Fonctionnalites
              </a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-how-it-works">
                Comment ca marche
              </a>
              <a href="#stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-stats">
                Chiffres
              </a>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <a href="/api/login">
                <Button variant="outline" data-testid="button-login">
                  Connexion
                </Button>
              </a>
              <a href="/api/login" className="hidden sm:block">
                <Button data-testid="button-get-started">
                  Commencer
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-24 lg:pt-44 lg:pb-36 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-marketplace.png"
            alt="Marche africain"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/70 to-black/30" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="animate-fade-in-up inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm mb-8">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Plateforme B2B #1 en Afrique de l'Ouest</span>
            </div>
            <h1 className="animate-fade-in-up stagger-1 font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6">
              Approvisionnez votre commerce en quelques clics
            </h1>
            <p className="animate-fade-in-up stagger-2 text-lg text-white/80 mb-10 max-w-xl leading-relaxed">
              Connectez votre boutique de quartier aux meilleurs fournisseurs. Commandez vos produits,
              payez par mobile money, et recevez vos livraisons rapidement.
            </p>
            <div className="animate-fade-in-up stagger-3 flex flex-wrap items-center gap-3">
              <a href="/api/login">
                <Button size="lg" className="text-base" data-testid="button-hero-start">
                  Creer mon compte gratuitement
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </a>
              <Link href="/marketplace">
                <Button size="lg" variant="outline" className="text-base bg-white/10 border-white/20 text-white" data-testid="button-hero-marketplace">
                  Explorer le marketplace
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="animate-fade-in-up stagger-4 flex flex-wrap items-center gap-6 mt-10 text-sm text-white/70">
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Paiement securise
              </span>
              <span className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Livraison rapide
              </span>
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                +500 fournisseurs
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-primary text-sm font-medium tracking-wide uppercase mb-3" data-testid="text-features-label">
              Fonctionnalites
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4">
              Tout ce dont votre commerce a besoin
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Une plateforme pensee pour les realites des commerces de proximite en Afrique de l'Ouest
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            <FeatureCard
              icon={<ShoppingCart className="w-5 h-5" />}
              title="Commande simplifiee"
              description="Parcourez le catalogue, ajoutez au panier et passez commande en quelques clics. Fini les deplacements inutiles chez les grossistes."
              accent="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
            />
            <FeatureCard
              icon={<CreditCard className="w-5 h-5" />}
              title="Mobile Money integre"
              description="Payez avec Orange Money, MTN MoMo, Flooz ou a la livraison. Transactions 100% securisees et adaptees a vos habitudes."
              accent="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
            />
            <FeatureCard
              icon={<Truck className="w-5 h-5" />}
              title="Livraison locale rapide"
              description="Reseau de livreurs partenaires (motos, tricycles) pour une livraison rapide directement a votre boutique."
              accent="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
            />
            <FeatureCard
              icon={<BarChart3 className="w-5 h-5" />}
              title="Gestion de stock"
              description="Suivez vos stocks automatiquement. Recevez des alertes quand il est temps de reapprovisionner."
              accent="bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400"
            />
            <FeatureCard
              icon={<TrendingUp className="w-5 h-5" />}
              title="Meilleurs prix"
              description="Accedez aux prix de gros et comparez les offres de plusieurs fournisseurs pour maximiser vos marges."
              accent="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
            />
            <FeatureCard
              icon={<Shield className="w-5 h-5" />}
              title="Fournisseurs verifies"
              description="Tous nos fournisseurs sont verifies. Consultez les avis et choisissez en toute confiance."
              accent="bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400"
            />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 lg:py-28 bg-card border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-primary text-sm font-medium tracking-wide uppercase mb-3">
              3 etapes simples
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4">
              Comment ca marche ?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Trois etapes simples pour digitaliser vos approvisionnements
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-10 lg:gap-16">
            <StepCard
              number="1"
              title="Creez votre compte"
              description="Inscrivez-vous gratuitement en tant que commercant ou fournisseur. Renseignez votre boutique et vos produits."
              icon={<Users className="w-5 h-5" />}
            />
            <StepCard
              number="2"
              title="Parcourez & Commandez"
              description="Explorez le catalogue de produits, comparez les prix et ajoutez a votre panier. Passez commande en un clic."
              icon={<ShoppingCart className="w-5 h-5" />}
            />
            <StepCard
              number="3"
              title="Recevez & Payez"
              description="Recevez vos produits directement a votre boutique. Payez par mobile money ou a la livraison."
              icon={<Smartphone className="w-5 h-5" />}
            />
          </div>
        </div>
      </section>

      <section id="stats" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-primary text-sm font-medium tracking-wide uppercase mb-3">
              Chiffres cles
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4">
              Un marche en pleine croissance
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              L'e-commerce en Afrique de l'Ouest connait une expansion rapide
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <StatCard value="75 Mrd $" label="CA e-commerce africain projete en 2025" icon={<TrendingUp className="w-5 h-5" />} />
            <StatCard value="615 M" label="Smartphones actifs sur le continent" icon={<Smartphone className="w-5 h-5" />} />
            <StatCard value="+24%" label="Croissance annuelle du secteur" icon={<BarChart3 className="w-5 h-5" />} />
            <StatCard value="600 M" label="Comptes mobile money en Afrique" icon={<CreditCard className="w-5 h-5" />} />
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-primary-foreground mb-6">
            Pret a transformer votre commerce ?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Rejoignez des milliers de commercants qui digitalisent leurs approvisionnements avec SokoB2B.
            Inscription gratuite, sans engagement.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a href="/api/login">
              <Button size="lg" variant="secondary" className="text-base" data-testid="button-cta-start">
                Commencer maintenant
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </a>
            <Link href="/marketplace">
              <Button size="lg" variant="outline" className="text-base bg-white/10 border-white/20 text-primary-foreground" data-testid="button-cta-explore">
                Voir le marketplace
              </Button>
            </Link>
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
