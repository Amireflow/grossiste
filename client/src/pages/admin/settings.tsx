
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Save } from "lucide-react";

export default function AdminSettings() {
    const { toast } = useToast();
    const [settings, setSettings] = useState({
        siteName: "SokoB2B",
        contactEmail: "contact@sokob2b.com",
        maintenanceMode: false,
        commissionRate: "5"
    });

    const saveSettingsMutation = useMutation({
        mutationFn: async () => {
            await apiRequest("POST", "/api/admin/settings", settings);
        },
        onSuccess: () => {
            toast({
                title: "Succès",
                description: "Les paramètres ont été enregistrés.",
            });
        },
        onError: () => {
            toast({
                title: "Erreur",
                description: "Impossible d'enregistrer les paramètres.",
                variant: "destructive",
            });
        },
    });

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

            <div className="max-w-2xl space-y-8">
                <div className="bg-background rounded-lg border p-6">
                    <h2 className="text-xl font-semibold mb-4">Général</h2>
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="site-name">Nom de la plateforme</Label>
                            <Input
                                id="site-name"
                                value={settings.siteName}
                                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="contact-email">Email de contact</Label>
                            <Input
                                id="contact-email"
                                value={settings.contactEmail}
                                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-background rounded-lg border p-6">
                    <h2 className="text-xl font-semibold mb-4">Maintenance</h2>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Mode maintenance</Label>
                            <p className="text-sm text-muted-foreground">
                                Rendre le site inaccessible aux utilisateurs (sauf admins)
                            </p>
                        </div>
                        <Switch
                            checked={settings.maintenanceMode}
                            onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                        />
                    </div>
                </div>

                <div className="bg-background rounded-lg border p-6">
                    <h2 className="text-xl font-semibold mb-4">Commissions</h2>
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="commission-rate">Taux de commission (%)</Label>
                            <Input
                                id="commission-rate"
                                type="number"
                                value={settings.commissionRate}
                                onChange={(e) => setSettings({ ...settings, commissionRate: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button onClick={() => saveSettingsMutation.mutate()}>
                        {saveSettingsMutation.isPending ? (
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        Enregistrer les modifications
                    </Button>
                </div>
            </div>
        </div>
    );
}
