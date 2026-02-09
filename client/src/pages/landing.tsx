import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Store, Truck, Shield, ArrowRight, ShoppingCart, Users, TrendingUp, Package } from "lucide-react";
import { Link } from "wouter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <Store className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-serif text-xl font-bold">SokoB2B</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/marketplace" className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1.5" data-testid="link-marketplace">
                <Package className="w-3.5 h-3.5" />
                Marketplace
              </Link>
              <Link href="/suppliers" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5" data-testid="link-suppliers">
                <Users className="w-3.5 h-3.5" />
                Fournisseurs
              </Link>
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-features">
                Fonctionnalités
              </a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-how-it-works">
                Comment ça marche
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
              <a href="/api/login">
                <Button data-testid="button-get-started">
                  Commencer
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-marketplace.png"
            alt="Marché africain"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-6">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Plateforme B2B #1 en Afrique de l'Ouest</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Approvisionnez votre commerce en quelques clics
            </h1>
            <p className="text-lg text-white/80 mb-8 max-w-xl leading-relaxed">
              Connectez votre boutique de quartier aux meilleurs fournisseurs. Commandez vos produits,
              payez par mobile money, et recevez vos livraisons rapidement.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a href="/api/login">
                <Button size="lg" className="text-base" data-testid="button-hero-start">
                  Créer mon compte gratuitement
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </a>
              <a href="#how-it-works">
                <Button size="lg" variant="outline" className="text-base backdrop-blur-sm bg-white/10 border-white/30 text-white" data-testid="button-hero-demo">
                  Voir comment ça marche
                </Button>
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-6 mt-8 text-sm text-white/70">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                Paiement sécurisé
              </span>
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4" />
                Livraison rapide
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                +500 fournisseurs
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4">
              Tout ce dont votre commerce a besoin
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Une plateforme pensée pour les réalités des commerces de proximité en Afrique de l'Ouest
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<ShoppingCart className="w-5 h-5" />}
              title="Commande simplifiée"
              description="Parcourez le catalogue, ajoutez au panier et passez commande en quelques clics. Fini les déplacements inutiles chez les grossistes."
            />
            <FeatureCard
              icon={<Shield className="w-5 h-5" />}
              title="Mobile Money intégré"
              description="Payez avec Orange Money, MTN MoMo, Flooz ou à la livraison. Transactions 100% sécurisées et adaptées à vos habitudes."
            />
            <FeatureCard
              icon={<Truck className="w-5 h-5" />}
              title="Livraison locale rapide"
              description="Réseau de livreurs partenaires (motos, tricycles) pour une livraison rapide directement à votre boutique."
            />
            <FeatureCard
              icon={<Store className="w-5 h-5" />}
              title="Gestion de stock"
              description="Suivez vos stocks automatiquement. Recevez des alertes quand il est temps de réapprovisionner."
            />
            <FeatureCard
              icon={<TrendingUp className="w-5 h-5" />}
              title="Meilleurs prix"
              description="Accédez aux prix de gros et comparez les offres de plusieurs fournisseurs pour maximiser vos marges."
            />
            <FeatureCard
              icon={<Users className="w-5 h-5" />}
              title="Fournisseurs vérifiés"
              description="Tous nos fournisseurs sont vérifiés. Consultez les avis et choisissez en toute confiance."
            />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 lg:py-28 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Trois étapes simples pour digitaliser vos approvisionnements
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Créez votre compte"
              description="Inscrivez-vous gratuitement en tant que commerçant ou fournisseur. Renseignez votre boutique et vos produits."
            />
            <StepCard
              number="2"
              title="Parcourez & Commandez"
              description="Explorez le catalogue de produits, comparez les prix et ajoutez à votre panier. Passez commande en un clic."
            />
            <StepCard
              number="3"
              title="Recevez & Payez"
              description="Recevez vos produits directement à votre boutique. Payez par mobile money ou à la livraison."
            />
          </div>
        </div>
      </section>

      <section id="stats" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4">
              Un marché en pleine croissance
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              L'e-commerce en Afrique de l'Ouest connaît une expansion rapide
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard value="75 Mrd $" label="CA e-commerce africain projeté en 2025" />
            <StatCard value="615 M" label="Smartphones actifs sur le continent" />
            <StatCard value="+24%" label="Croissance annuelle du secteur" />
            <StatCard value="600 M" label="Comptes mobile money en Afrique" />
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-primary-foreground mb-6">
            Prêt à transformer votre commerce ?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers de commerçants qui digitalisent leurs approvisionnements avec SokoB2B.
            Inscription gratuite, sans engagement.
          </p>
          <a href="/api/login">
            <Button size="lg" variant="secondary" className="text-base" data-testid="button-cta-start">
              Commencer maintenant
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </a>
        </div>
      </section>

      <footer className="py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <Store className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="font-serif text-lg font-bold">SokoB2B</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; 2026 SokoB2B. Tous droits réservés. Fait avec passion pour l'Afrique de l'Ouest.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="hover-elevate">
      <CardContent className="p-6">
        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary mb-4">
          {icon}
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <div className="text-3xl font-bold text-primary mb-2">{value}</div>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
