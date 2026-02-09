import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="text-center">
        <p className="text-6xl font-bold text-primary/20 mb-4">404</p>
        <h1 className="font-serif text-2xl font-bold mb-2">Page introuvable</h1>
        <p className="text-muted-foreground mb-6">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <Link href="/">
          <Button data-testid="button-go-home">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour à l'accueil
          </Button>
        </Link>
      </div>
    </div>
  );
}
