import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight, Star, Shield, Truck, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";

const SLIDES = [
    {
        id: 1,
        title: "La référence B2B",
        highlight: "en Afrique de l'Ouest",
        description: "Connectez-vous directement avec les meilleurs grossistes et fabricants. Prix négociés, paiements sécurisés.",
        image: "https://images.unsplash.com/photo-1586880244406-556ebe35f282?q=80&w=2574&auto=format&fit=crop",
        color: "from-blue-600 to-indigo-700",
        badge: "N°1 du B2B",
        badgeColor: "bg-blue-500",
        icon: <Star className="w-5 h-5 text-white" />
    },
    {
        id: 2,
        title: "Vos approvisionnements",
        highlight: "100% sécurisés",
        description: "Nous vérifions chaque fournisseur. Votre argent est protégé jusqu'à la réception conforme de votre commande.",
        image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2670&auto=format&fit=crop",
        color: "from-emerald-600 to-teal-700",
        badge: "Garantie Totale",
        badgeColor: "bg-emerald-500",
        icon: <Shield className="w-5 h-5 text-white" />
    },
    {
        id: 3,
        title: "Expédition Rapide",
        highlight: "dans toute la région",
        description: "Une chaîne logistique optimisée pour que vos produits arrivent à temps, où que vous soyez.",
        image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2670&auto=format&fit=crop",
        color: "from-amber-600 to-orange-700",
        badge: "Logistique Intégrée",
        badgeColor: "bg-amber-500",
        icon: <Truck className="w-5 h-5 text-white" />
    }
];

export function MarketplaceHero({ onSearch }: { onSearch?: (query: string) => void }) {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 45 });
    const [search, setSearch] = useState("");
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

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSearch) onSearch(search);
    };

    return (
        <div className="relative overflow-hidden bg-background">
            <div className="absolute inset-0 z-10 bg-gradient-to-r from-background/90 via-background/70 to-transparent pointer-events-none lg:via-background/40" />

            <div className="max-w-7xl mx-auto relative z-20">
                <div className="grid lg:grid-cols-2 min-h-[550px] lg:min-h-[600px] items-center">

                    {/* Content Left (Static over slide) or Dynamic? Dynamic is better */}
                    <div className="px-4 sm:px-6 lg:px-8 py-12 lg:py-0 relative z-30 flex flex-col justify-center h-full pointer-events-none">
                        <div className="pointer-events-auto max-w-2xl">
                            {/* Transitioning Content based on index? Or generic? 
                    Let's make the text static but highlighting dynamic features, 
                    OR strictly follow the slide content. 
                    Let's follow slideshow for maximum "Premium" feel.
                */}
                            <div key={selectedIndex} className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pr-4 lg:pr-8">
                                <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold text-white mb-6 ${SLIDES[selectedIndex].badgeColor} backdrop-blur-sm bg-opacity-90`}>
                                    {SLIDES[selectedIndex].icon}
                                    <span className="ml-2">{SLIDES[selectedIndex].badge}</span>
                                </div>

                                <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-foreground leading-[1.1] break-words">
                                    {SLIDES[selectedIndex].title} <br />
                                    <span className={`text-transparent bg-clip-text bg-gradient-to-r ${SLIDES[selectedIndex].color}`}>
                                        {SLIDES[selectedIndex].highlight}
                                    </span>
                                </h1>

                                <p className="text-muted-foreground text-lg sm:text-xl mb-8 leading-relaxed max-w-lg">
                                    {SLIDES[selectedIndex].description}
                                </p>
                            </div>

                            {/* Search Bar - Shop Style aligned */}
                            <form onSubmit={handleSearch} className="relative max-w-xl mt-8">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                    <Input
                                        placeholder="Rechercher des produits, fournisseurs..."
                                        className="pl-10 pr-32 h-12 text-base bg-muted/50 border-none rounded-full"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                    <div className="absolute right-1 top-1 bottom-1">
                                        <Button type="submit" size="sm" className="h-full rounded-full px-6">
                                            Rechercher
                                        </Button>
                                    </div>
                                </div>
                            </form>

                            {/* Trust Indicators */}
                            <div className="flex items-center gap-6 mt-10">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="w-9 h-9 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden">
                                            <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                    <div className="w-9 h-9 rounded-full border-2 border-background bg-primary flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                                        +2k
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1 text-sm font-bold text-foreground">
                                        <TrendingUp className="w-4 h-4 text-green-500" />
                                        <span>Croissance Rapide</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">Rejoignez le réseau leader</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Slider Right/Background */}
                    <div className="absolute inset-0 lg:relative lg:inset-auto h-full w-full lg:h-[600px] overflow-hidden lg:rounded-l-[3rem]">
                        <div className="absolute inset-0 z-0 bg-black/5 lg:hidden" /> {/* Mobile Overlay */}

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
                                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent lg:hidden" />
                                        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent lg:hidden" />
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
