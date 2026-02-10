import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Shield, Truck, TrendingUp, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { Link } from "wouter";

const SLIDES = [
    {
        id: 1,
        title: "Le Réseau B2B N°1",
        highlight: "en Afrique de l'Ouest",
        description: "Rejoignez plus de 2000 commerçants et fournisseurs. Simplifiez vos approvisionnements dès aujourd'hui.",
        image: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2574&auto=format&fit=crop",
        color: "from-blue-600 to-indigo-700",
        badge: "Leader du Marché",
        badgeColor: "bg-blue-500",
        icon: <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
    },
    {
        id: 2,
        title: "Vos commandes",
        highlight: "100% sécurisées",
        description: "Paiement à la livraison ou via mobile money sécurisé. Nous garantissons chaque transaction.",
        image: "https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=80&w=2670&auto=format&fit=crop",
        color: "from-emerald-600 to-teal-700",
        badge: "Sécurité Totale",
        badgeColor: "bg-emerald-500",
        icon: <Shield className="w-5 h-5 text-white" />
    },
    {
        id: 3,
        title: "Développez",
        highlight: "votre commerce",
        description: "Accédez à des milliers de produits aux meilleurs prix de gros. Augmentez vos marges maintenant.",
        image: "https://images.unsplash.com/photo-1556740758-90de374c12ad?q=80&w=2670&auto=format&fit=crop",
        color: "from-amber-600 to-orange-700",
        badge: "Croissance Garantie",
        badgeColor: "bg-amber-500",
        icon: <TrendingUp className="w-5 h-5 text-white" />
    }
];

export function LandingHero() {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 45 });
    const [selectedIndex, setSelectedIndex] = useState(0);

    const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        emblaApi.on("select", onSelect);

        // Auto-play
        const interval = setInterval(() => {
            if (emblaApi.canScrollNext()) {
                emblaApi.scrollNext();
            } else {
                emblaApi.scrollTo(0);
            }
        }, 6000);

        return () => {
            clearInterval(interval);
            emblaApi.off("select", onSelect);
        };
    }, [emblaApi, onSelect]);

    return (
        <div className="relative overflow-hidden bg-background">
            {/* Gradient Background */}
            <div className="absolute inset-0 z-10 bg-gradient-to-r from-background/95 via-background/80 to-transparent pointer-events-none lg:via-background/60" />

            <div className="max-w-7xl mx-auto relative z-20">
                <div className="grid lg:grid-cols-2 min-h-[600px] lg:min-h-[700px] items-center">

                    {/* Content Left */}
                    <div className="px-4 sm:px-6 lg:px-8 py-12 lg:py-0 relative z-30 flex flex-col justify-center h-full">
                        <div className="max-w-xl">
                            <div key={selectedIndex} className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pr-4 lg:pr-8">
                                <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold text-white mb-6 shadow-lg ${SLIDES[selectedIndex].badgeColor} backdrop-blur-sm bg-opacity-90`}>
                                    {SLIDES[selectedIndex].icon}
                                    <span className="ml-2">{SLIDES[selectedIndex].badge}</span>
                                </div>

                                <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-foreground leading-[1.1]">
                                    {SLIDES[selectedIndex].title} <br />
                                    <span className={`text-transparent bg-clip-text bg-gradient-to-r ${SLIDES[selectedIndex].color}`}>
                                        {SLIDES[selectedIndex].highlight}
                                    </span>
                                </h1>

                                <p className="text-muted-foreground text-lg sm:text-xl mb-8 leading-relaxed max-w-lg">
                                    {SLIDES[selectedIndex].description}
                                </p>
                            </div>

                            {/* CTA Buttons - Static */}
                            <div className="flex flex-col sm:flex-row gap-4 mt-2">
                                <Link href="/register">
                                    <Button size="lg" className="text-base h-12 px-8 rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                                        Commencer gratuitement
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </Link>
                                <Link href="/marketplace">
                                    <Button variant="outline" size="lg" className="text-base h-12 px-8 rounded-full border-2 hover:bg-muted/50">
                                        Voir le catalogue
                                    </Button>
                                </Link>
                            </div>

                            {/* Trust Indicators */}
                            <div className="mt-12 flex items-center gap-6 text-sm font-medium text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span>Inscription Gratuite</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-primary" />
                                    <span>Vérifié & Sécurisé</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Slider Right/Background */}
                    <div className="absolute inset-0 lg:relative lg:inset-auto h-full w-full lg:h-[700px] overflow-hidden lg:rounded-l-[3rem]">
                        <div className="absolute inset-0 z-0 bg-black/10 lg:hidden" /> {/* Mobile Overlay Base */}

                        <div className="h-full w-full" ref={emblaRef}>
                            <div className="flex h-full">
                                {SLIDES.map((slide) => (
                                    <div key={slide.id} className="relative flex-[0_0_100%] min-w-0 h-full">
                                        <img
                                            src={slide.image}
                                            alt={slide.title}
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                        {/* Mobile Text Protection Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent lg:hidden" />
                                        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent lg:hidden" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Navigation Buttons (Desktop) */}
                        <div className="hidden lg:flex absolute bottom-8 right-8 gap-2 z-30">
                            <Button variant="outline" size="icon" className="rounded-full bg-background/80 backdrop-blur border-none hover:bg-background shadow-lg" onClick={scrollPrev}>
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                            <Button variant="outline" size="icon" className="rounded-full bg-background/80 backdrop-blur border-none hover:bg-background shadow-lg" onClick={scrollNext}>
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
