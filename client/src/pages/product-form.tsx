import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft, Save, XCircle, ImagePlus, GripVertical, Star,
  Package, Tag, DollarSign, Layers, Info,
} from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UNITS } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import type { Category, Product } from "@shared/schema";

const MAX_IMAGES = 10;

const productFormSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Catégorie requise"),
  price: z.string().min(1, "Prix requis"),
  unit: z.string().min(1, "Unité requise"),
  minOrder: z.coerce.number().min(1, "Minimum 1"),
  stock: z.coerce.number().min(0, "Le stock ne peut pas être négatif"),
  imageUrl: z.string().optional(),
  images: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function ProductFormPage() {
  const params = useParams<{ id: string }>();
  const isEditing = !!params.id;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const { data: categories } = useQuery<Category[]>({ queryKey: ["/api/categories"] });

  const { data: existingProduct, isLoading: productLoading } = useQuery<Product>({
    queryKey: ["/api/products", params.id],
    enabled: isEditing,
  });

  // Initialize images from existing product
  const getInitialImages = useCallback(() => {
    if (!existingProduct) return [];
    const imgs: string[] = [];
    if (existingProduct.imageUrl) imgs.push(existingProduct.imageUrl);
    if ((existingProduct as any).images) {
      try {
        const parsed = JSON.parse((existingProduct as any).images);
        if (Array.isArray(parsed)) imgs.push(...parsed);
      } catch { }
    }
    return imgs;
  }, [existingProduct]);

  // Set images when product loads
  if (existingProduct && imageUrls.length === 0) {
    const initial = getInitialImages();
    if (initial.length > 0) setImageUrls(initial);
  }

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
      images: "",
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
        images: (existingProduct as any).images || "",
      }
      : undefined,
  });

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      return data.url;
    } catch {
      return null;
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remaining = MAX_IMAGES - imageUrls.length;
    if (remaining <= 0) {
      toast({ title: "Limite atteinte", description: `Maximum ${MAX_IMAGES} images`, variant: "destructive" });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remaining);
    setUploading(true);

    const uploaded: string[] = [];
    for (const file of filesToUpload) {
      const url = await uploadImage(file);
      if (url) uploaded.push(url);
    }

    if (uploaded.length > 0) {
      const newUrls = [...imageUrls, ...uploaded];
      setImageUrls(newUrls);
      // First image is the main imageUrl
      form.setValue("imageUrl", newUrls[0]);
      // Rest go to images JSON
      form.setValue("images", newUrls.length > 1 ? JSON.stringify(newUrls.slice(1)) : "");
      toast({ title: `${uploaded.length} image${uploaded.length > 1 ? "s" : ""} ajoutée${uploaded.length > 1 ? "s" : ""}` });
    }

    if (uploaded.length < filesToUpload.length) {
      toast({ title: "Certaines images n'ont pas pu être téléchargées", variant: "destructive" });
    }

    setUploading(false);
  };

  const removeImage = (index: number) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newUrls);
    form.setValue("imageUrl", newUrls[0] || "");
    form.setValue("images", newUrls.length > 1 ? JSON.stringify(newUrls.slice(1)) : "");
  };

  const setMainImage = (index: number) => {
    if (index === 0) return;
    const newUrls = [...imageUrls];
    const [moved] = newUrls.splice(index, 1);
    newUrls.unshift(moved);
    setImageUrls(newUrls);
    form.setValue("imageUrl", newUrls[0]);
    form.setValue("images", newUrls.length > 1 ? JSON.stringify(newUrls.slice(1)) : "");
    toast({ title: "Image principale modifiée" });
  };

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
      toast({ title: isEditing ? "Produit modifié ✓" : "Produit créé ✓" });
      navigate("/products");
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de sauvegarder", variant: "destructive" });
    },
  });

  if (isEditing && productLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
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
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/products">
          <Button variant="ghost" size="icon" data-testid="button-back-products">
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight">
            {isEditing ? "Modifier le produit" : "Nouveau produit"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEditing ? "Modifiez les informations du produit" : "Ajoutez un produit à votre catalogue"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))} className="space-y-6">

          {/* Images Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ImagePlus className="w-4 h-4 text-primary" />
                Photos du produit
                <Badge variant="secondary" className="text-[10px] ml-auto">
                  {imageUrls.length}/{MAX_IMAGES}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Image Grid */}
              {imageUrls.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {imageUrls.map((url, index) => (
                    <div
                      key={`${url}-${index}`}
                      className={`relative group aspect-square rounded-lg overflow-hidden border-2 transition-all ${index === 0 ? "border-primary ring-1 ring-primary/20" : "border-border hover:border-primary/50"
                        }`}
                    >
                      <img src={url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />

                      {/* Main image badge */}
                      {index === 0 && (
                        <div className="absolute top-1 left-1">
                          <Badge className="text-[9px] px-1 py-0 bg-primary">
                            <Star className="w-2.5 h-2.5 mr-0.5 fill-current" />
                            Principal
                          </Badge>
                        </div>
                      )}

                      {/* Actions overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        {index !== 0 && (
                          <Button
                            type="button"
                            size="icon"
                            variant="secondary"
                            className="h-7 w-7"
                            onClick={() => setMainImage(index)}
                            title="Définir comme image principale"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="h-7 w-7"
                          onClick={() => removeImage(index)}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Add more button (inline) */}
                  {imageUrls.length < MAX_IMAGES && (
                    <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary">
                      <ImagePlus className="w-5 h-5" />
                      <span className="text-[10px]">Ajouter</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files)}
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>
              )}

              {/* Empty state / Upload zone */}
              {imageUrls.length === 0 && (
                <label className="flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-all cursor-pointer bg-muted/20 hover:bg-muted/40">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <ImagePlus className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Cliquez pour ajouter des photos</p>
                      <p className="text-xs text-muted-foreground">
                        Jusqu'à {MAX_IMAGES} images · JPG, PNG, WebP
                      </p>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    disabled={uploading}
                    data-testid="input-product-image-upload"
                  />
                </label>
              )}

              {uploading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Téléchargement en cours...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                Informations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        className="resize-none min-h-[100px]"
                        placeholder="Décrivez votre produit en détail : qualité, provenance, conditionnement..."
                        {...field}
                        data-testid="input-product-description"
                      />
                    </FormControl>
                    <FormDescription>Optionnel · Une bonne description aide à vendre</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Pricing & Stock */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Prix & Stock
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 sticky bottom-4 bg-background/80 backdrop-blur-sm p-3 rounded-xl border shadow-lg">
            <Link href="/products">
              <Button type="button" variant="outline" data-testid="button-cancel">
                Annuler
              </Button>
            </Link>
            <Button type="submit" className="flex-1" disabled={saveMutation.isPending} data-testid="button-save-product">
              <Save className="w-4 h-4 mr-1.5" />
              {saveMutation.isPending ? "Enregistrement..." : "Enregistrer le produit"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
