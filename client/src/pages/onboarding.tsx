import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Store, Package, ArrowRight } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { COUNTRIES } from "@/lib/constants";

const onboardingSchema = z.object({
  role: z.enum(["shop_owner", "supplier"]),
  businessName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  address: z.string().optional(),
  city: z.string().min(2, "Ville requise"),
  country: z.string().min(2, "Pays requis"),
  currency: z.enum(["XOF", "XAF", "NGN", "GHS"]),
  description: z.string().optional(),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const [step, setStep] = useState<"role" | "details">("role");
  const { toast } = useToast();

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      role: "shop_owner",
      businessName: "",
      phone: "",
      address: "",
      city: "",
      country: "Bénin",
      currency: "XOF",
      description: "",
    },
  });

  const createProfile = useMutation({
    mutationFn: async (data: OnboardingValues) => {
      const res = await apiRequest("POST", "/api/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de créer le profil", variant: "destructive" });
    },
  });

  const selectedRole = form.watch("role");

  if (step === "role") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-md bg-primary flex items-center justify-center mx-auto mb-4">
              <Store className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="font-serif text-2xl font-bold mb-2">Bienvenue sur SokoB2B</h1>
            <p className="text-muted-foreground">Choisissez votre profil pour commencer</p>
          </div>
          <div className="grid gap-4">
            <Card
              className={`cursor-pointer hover-elevate ${selectedRole === "shop_owner" ? "ring-2 ring-primary" : ""}`}
              onClick={() => form.setValue("role", "shop_owner")}
              data-testid="card-role-shop"
            >
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Store className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Commerçant</h3>
                  <p className="text-sm text-muted-foreground">
                    Je possède une boutique, épicerie ou kiosque et je veux commander des produits auprès de fournisseurs.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card
              className={`cursor-pointer hover-elevate ${selectedRole === "supplier" ? "ring-2 ring-primary" : ""}`}
              onClick={() => form.setValue("role", "supplier")}
              data-testid="card-role-supplier"
            >
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Fournisseur</h3>
                  <p className="text-sm text-muted-foreground">
                    Je suis grossiste ou importateur et je veux vendre mes produits aux commerces de proximité.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          <Button className="w-full mt-6" size="lg" onClick={() => setStep("details")} data-testid="button-continue-role">
            Continuer
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="font-serif text-2xl font-bold mb-2">
            {selectedRole === "shop_owner" ? "Configurez votre boutique" : "Configurez votre profil fournisseur"}
          </h1>
          <p className="text-muted-foreground">Complétez les informations de votre activité</p>
        </div>
        <Card>
          <CardHeader className="pb-4" />
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createProfile.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{selectedRole === "shop_owner" ? "Nom de la boutique" : "Nom de l'entreprise"}</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Boutique Mama Afi" {...field} data-testid="input-business-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input placeholder="+229 97 00 00 00" {...field} data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ville</FormLabel>
                        <FormControl>
                          <Input placeholder="Cotonou" {...field} data-testid="input-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pays</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-country">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COUNTRIES.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Devise</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-currency">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="XOF">Franc CFA (BCEAO)</SelectItem>
                          <SelectItem value="XAF">Franc CFA (BEAC)</SelectItem>
                          <SelectItem value="NGN">Naira (NGN)</SelectItem>
                          <SelectItem value="GHS">Cedi (GHS)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse (optionnel)</FormLabel>
                      <FormControl>
                        <Input placeholder="Quartier, rue, repère..." {...field} data-testid="input-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optionnel)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Décrivez votre activité en quelques mots..."
                          className="resize-none"
                          {...field}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep("role")} data-testid="button-back">
                    Retour
                  </Button>
                  <Button type="submit" className="flex-1" disabled={createProfile.isPending} data-testid="button-submit-profile">
                    {createProfile.isPending ? "Création..." : "Créer mon profil"}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
