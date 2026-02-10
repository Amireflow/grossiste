import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Store, Package, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { COUNTRIES } from "@/lib/constants";

const onboardingSchema = z.object({
  role: z.enum(["shop_owner", "supplier"]),
  businessName: z.string().min(2, "Le nom doit contenir au moins 2 caracteres"),
  phone: z.string().min(8, "Numero de telephone invalide"),
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
      country: "Benin",
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
      toast({ title: "Erreur", description: "Impossible de creer le profil", variant: "destructive" });
    },
  });

  const selectedRole = form.watch("role");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className={`flex items-center gap-2 ${step === "role" ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step === "role" ? "bg-primary text-primary-foreground" : "bg-primary text-primary-foreground"}`}>
              {step === "details" ? <CheckCircle2 className="w-4 h-4" /> : "1"}
            </div>
            <span className="text-sm font-medium hidden sm:block">Profil</span>
          </div>
          <div className="w-8 h-px bg-border" />
          <div className={`flex items-center gap-2 ${step === "details" ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step === "details" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              2
            </div>
            <span className="text-sm font-medium hidden sm:block">Details</span>
          </div>
        </div>

        {step === "role" ? (
          <div className="animate-fade-in-up" key="role-step">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-md bg-primary flex items-center justify-center mx-auto mb-4">
                <Store className="w-7 h-7 text-primary-foreground" />
              </div>
              <h1 className="font-serif text-2xl font-bold mb-2 tracking-tight">Bienvenue sur SokoB2B</h1>
              <p className="text-muted-foreground text-sm">Choisissez votre profil pour commencer</p>
            </div>
            <div className="grid gap-3">
              <Card
                className={`cursor-pointer hover-elevate overflow-visible transition-all ${selectedRole === "shop_owner" ? "ring-2 ring-primary" : ""}`}
                onClick={() => form.setValue("role", "shop_owner")}
                data-testid="card-role-shop"
              >
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-md bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                    <Store className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base mb-1">Commercant</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Je possede une boutique, epicerie ou kiosque et je veux commander des produits aupres de fournisseurs.
                    </p>
                  </div>
                  {selectedRole === "shop_owner" && (
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-1" />
                  )}
                </CardContent>
              </Card>
              <Card
                className={`cursor-pointer hover-elevate overflow-visible transition-all ${selectedRole === "supplier" ? "ring-2 ring-primary" : ""}`}
                onClick={() => form.setValue("role", "supplier")}
                data-testid="card-role-supplier"
              >
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-md bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                    <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base mb-1">Fournisseur</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Je suis grossiste ou importateur et je veux vendre mes produits aux commerces de proximite.
                    </p>
                  </div>
                  {selectedRole === "supplier" && (
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-1" />
                  )}
                </CardContent>
              </Card>
            </div>
            <Button className="w-full mt-6" size="lg" onClick={() => setStep("details")} data-testid="button-continue-role">
              Continuer
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        ) : (
          <div className="animate-fade-in-up" key="details-step">
            <div className="text-center mb-6">
              <h1 className="font-serif text-2xl font-bold mb-2 tracking-tight">
                {selectedRole === "shop_owner" ? "Configurez votre boutique" : "Configurez votre profil fournisseur"}
              </h1>
              <p className="text-muted-foreground text-sm">Completez les informations de votre activite</p>
            </div>
            <Card>
              <CardContent className="p-5 pt-6">
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
                          <FormLabel>Telephone</FormLabel>
                          <FormControl>
                            <Input placeholder="+229 97 00 00 00" {...field} data-testid="input-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-3">
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
                            <Input placeholder="Quartier, rue, repere..." {...field} data-testid="input-address" />
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
                              placeholder="Decrivez votre activite en quelques mots..."
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
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Retour
                      </Button>
                      <Button type="submit" className="flex-1" disabled={createProfile.isPending} data-testid="button-submit-profile">
                        {createProfile.isPending ? "Creation..." : "Creer mon profil"}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
