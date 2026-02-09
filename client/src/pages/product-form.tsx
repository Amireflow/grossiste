import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Save } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UNITS } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import type { Category, Product } from "@shared/schema";

const productFormSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Catégorie requise"),
  price: z.string().min(1, "Prix requis"),
  unit: z.string().min(1, "Unité requise"),
  minOrder: z.coerce.number().min(1, "Minimum 1"),
  stock: z.coerce.number().min(0, "Le stock ne peut pas être négatif"),
  imageUrl: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function ProductFormPage() {
  const params = useParams<{ id: string }>();
  const isEditing = !!params.id;
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: categories } = useQuery<Category[]>({ queryKey: ["/api/categories"] });

  const { data: existingProduct, isLoading: productLoading } = useQuery<Product>({
    queryKey: ["/api/products", params.id],
    enabled: isEditing,
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: "",
      price: "",
      unit: "unité",
      minOrder: 1,
      stock: 0,
      imageUrl: "",
    },
    values: existingProduct
      ? {
          name: existingProduct.name,
          description: existingProduct.description || "",
          categoryId: existingProduct.categoryId,
          price: existingProduct.price,
          unit: existingProduct.unit,
          minOrder: existingProduct.minOrder || 1,
          stock: existingProduct.stock || 0,
          imageUrl: existingProduct.imageUrl || "",
        }
      : undefined,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      if (isEditing) {
        const res = await apiRequest("PATCH", `/api/products/${params.id}`, data);
        return res.json();
      }
      const res = await apiRequest("POST", "/api/products", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: isEditing ? "Produit modifié" : "Produit créé" });
      navigate("/products");
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de sauvegarder", variant: "destructive" });
    },
  });

  if (isEditing && productLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <Card>
          <CardContent className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/products">
          <Button variant="ghost" size="icon" data-testid="button-back-products">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-serif text-2xl font-bold">
            {isEditing ? "Modifier le produit" : "Nouveau produit"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditing ? "Modifiez les informations du produit" : "Ajoutez un produit à votre catalogue"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4" />
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du produit</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Riz parfumé 25kg" {...field} data-testid="input-product-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-product-category">
                          <SelectValue placeholder="Choisir une catégorie" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.nameFr}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                        className="resize-none"
                        placeholder="Décrivez le produit..."
                        {...field}
                        data-testid="input-product-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix (FCFA)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="15000" {...field} data-testid="input-product-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unité</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-product-unit">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {UNITS.map((u) => (
                            <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commande minimum</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} data-testid="input-min-order" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock disponible</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} data-testid="input-stock" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL de l'image (optionnel)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} data-testid="input-product-image" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-2">
                <Link href="/products">
                  <Button type="button" variant="outline" data-testid="button-cancel">
                    Annuler
                  </Button>
                </Link>
                <Button type="submit" className="flex-1" disabled={saveMutation.isPending} data-testid="button-save-product">
                  <Save className="w-4 h-4 mr-1" />
                  {saveMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
