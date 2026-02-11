
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings, Save, Mail, Building } from "lucide-react";

export default function AdminSettings() {
    return (
        <div className="flex-1 w-full bg-muted/20 p-6 sm:p-10">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-primary/10 rounded-xl">
                    <Settings className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-serif font-bold text-foreground">Paramètres</h1>
                    <p className="text-muted-foreground">Configuration de la plateforme</p>
                </div>
            </div>

            <div className="grid gap-6 max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Building className="w-5 h-5 text-primary" />
                            Informations Générales
                        </CardTitle>
                        <CardDescription>
                            Détails visibles par les utilisateurs
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="platform-name">Nom de la plateforme</Label>
                            <Input id="platform-name" defaultValue="SokoB2B" placeholder="Ex: SokoB2B" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contact-email">Email de support</Label>
                            <div className="relative">
                                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input id="contact-email" type="email" defaultValue="support@soko.africa" className="pl-9" />
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button>
                                <Save className="w-4 h-4 mr-2" />
                                Enregistrer les modifications
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg text-primary">Commissions & Frais</CardTitle>
                        <CardDescription>Configuration des frais de transaction (Bientôt disponible)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground italic">
                            Cette fonctionnalité sera disponible prochainement dans la mise à jour des paramètres plateforme.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
