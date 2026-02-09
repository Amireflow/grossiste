import { storage } from "./storage";
import { db } from "./db";
import { users, userProfiles, products } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export async function seedDatabase() {
  const existingCategories = await storage.getCategories();
  if (existingCategories.length > 0) {
    const existingProducts = await storage.getProducts();
    if (existingProducts.length > 0) {
      return;
    }
    await seedProducts();
    return;
  }

  console.log("Seeding database with categories...");

  const categoriesToCreate = [
    {
      name: "Food & Groceries",
      nameFr: "Alimentation",
      slug: "alimentation",
      imageUrl: "/images/category-food.png",
      description: "Denrées alimentaires de base, céréales, huiles, conserves",
    },
    {
      name: "Beverages",
      nameFr: "Boissons",
      slug: "boissons",
      imageUrl: "/images/category-beverages.png",
      description: "Eaux, jus de fruits, sodas, boissons locales",
    },
    {
      name: "Hygiene & Cleaning",
      nameFr: "Hygiène & Entretien",
      slug: "hygiene-entretien",
      imageUrl: "/images/category-hygiene.png",
      description: "Savons, détergents, produits d'entretien, hygiène corporelle",
    },
    {
      name: "Pharmaceuticals",
      nameFr: "Parapharmacie",
      slug: "parapharmacie",
      imageUrl: "/images/category-pharma.png",
      description: "Produits pharmaceutiques de première nécessité, premiers soins",
    },
  ];

  for (const cat of categoriesToCreate) {
    await storage.createCategory(cat);
  }

  console.log("Database seeded with categories successfully!");
  await seedProducts();
}

async function seedProducts() {
  const allCategories = await storage.getCategories();
  const catMap: Record<string, string> = {};
  for (const cat of allCategories) {
    catMap[cat.slug] = cat.id;
  }

  const [existingSupplier1] = await db.select().from(users).where(eq(users.id, "demo-supplier-001"));
  if (!existingSupplier1) {
    await db.insert(users).values({
      id: "demo-supplier-001",
      email: "fournisseur@sokob2b.com",
      firstName: "Mamadou",
      lastName: "Diallo",
    });
    await storage.createProfile({
      userId: "demo-supplier-001",
      role: "supplier",
      businessName: "Diallo Distribution SARL",
      phone: "+221771234567",
      address: "Zone Industrielle, Dakar",
      city: "Dakar",
      country: "Sénégal",
      currency: "XOF",
      description: "Grossiste en produits alimentaires et biens de consommation pour l'Afrique de l'Ouest",
    });
  }

  const [existingSupplier2] = await db.select().from(users).where(eq(users.id, "demo-supplier-002"));
  if (!existingSupplier2) {
    await db.insert(users).values({
      id: "demo-supplier-002",
      email: "grossiste@sokob2b.com",
      firstName: "Aïcha",
      lastName: "Koné",
    });
    await storage.createProfile({
      userId: "demo-supplier-002",
      role: "supplier",
      businessName: "Koné & Fils Import-Export",
      phone: "+225070456789",
      address: "Plateau, Abidjan",
      city: "Abidjan",
      country: "Côte d'Ivoire",
      currency: "XOF",
      description: "Importateur de boissons, produits d'hygiène et parapharmacie",
    });
  }

  const demoProducts = [
    { supplierId: "demo-supplier-001", categorySlug: "alimentation", name: "Riz Brisé Premium 25kg", description: "Riz blanc brisé de qualité supérieure, idéal pour la revente en détail. Origine Thaïlande.", price: "12500", unit: "sac 25kg", minOrder: 5, stock: 200, imageUrl: "/images/product-rice.png" },
    { supplierId: "demo-supplier-001", categorySlug: "alimentation", name: "Huile de Palme Raffinée 5L", description: "Huile de palme rouge raffinée, conditionnée en bidon de 5 litres. Qualité alimentaire.", price: "4500", unit: "bidon 5L", minOrder: 3, stock: 150, imageUrl: "/images/product-palm-oil.png" },
    { supplierId: "demo-supplier-001", categorySlug: "alimentation", name: "Concentré de Tomate 400g x12", description: "Carton de 12 boîtes de concentré de tomate double. Marque populaire.", price: "8500", unit: "carton", minOrder: 2, stock: 300, imageUrl: "/images/product-tomato-paste.png" },
    { supplierId: "demo-supplier-001", categorySlug: "alimentation", name: "Farine de Blé T55 50kg", description: "Farine de blé tendre pour boulangerie et pâtisserie. Sac de 50kg.", price: "18000", unit: "sac 50kg", minOrder: 2, stock: 80, imageUrl: "/images/product-flour.png" },
    { supplierId: "demo-supplier-001", categorySlug: "alimentation", name: "Sucre en Poudre 20kg", description: "Sucre blanc cristallisé en sac de 20kg. Qualité premium pour revente.", price: "9800", unit: "sac 20kg", minOrder: 3, stock: 120, imageUrl: "/images/product-sugar.png" },
    { supplierId: "demo-supplier-001", categorySlug: "alimentation", name: "Couscous de Mil 10kg", description: "Couscous de mil traditionnel ouest-africain, séché et prêt à cuire.", price: "7500", unit: "sac 10kg", minOrder: 2, stock: 90, imageUrl: "/images/product-couscous.png" },
    { supplierId: "demo-supplier-001", categorySlug: "alimentation", name: "Lait en Poudre 400g x24", description: "Carton de 24 sachets de lait en poudre entier. Format populaire.", price: "22000", unit: "carton", minOrder: 1, stock: 60, imageUrl: "/images/product-milk.png" },
    { supplierId: "demo-supplier-001", categorySlug: "alimentation", name: "Café Soluble 200g x48", description: "Carton de 48 sachets de café soluble instantané. Marque leader.", price: "15000", unit: "carton", minOrder: 1, stock: 45, imageUrl: "/images/product-coffee.png" },
    { supplierId: "demo-supplier-002", categorySlug: "boissons", name: "Eau Minérale 1.5L x24", description: "Pack de 24 bouteilles d'eau minérale naturelle 1.5L. Eau source locale.", price: "4800", unit: "pack 24", minOrder: 5, stock: 500, imageUrl: "/images/product-water.png" },
    { supplierId: "demo-supplier-002", categorySlug: "boissons", name: "Jus d'Orange 33cl x12", description: "Carton de 12 bouteilles de jus d'orange naturel 33cl. Sans conservateurs.", price: "6500", unit: "carton", minOrder: 3, stock: 200, imageUrl: "/images/product-juice.png" },
    { supplierId: "demo-supplier-002", categorySlug: "boissons", name: "Soda Cola 1L x6", description: "Pack de 6 bouteilles de cola 1 litre. Boisson gazeuse rafraîchissante.", price: "3500", unit: "pack 6", minOrder: 5, stock: 350, imageUrl: "/images/product-soda.png" },
    { supplierId: "demo-supplier-002", categorySlug: "hygiene-entretien", name: "Savon de Ménage 200g x12", description: "Lot de 12 savons de ménage multi-usage. Idéal pour la lessive et le nettoyage.", price: "3200", unit: "lot 12", minOrder: 5, stock: 400, imageUrl: "/images/product-soap.png" },
    { supplierId: "demo-supplier-002", categorySlug: "hygiene-entretien", name: "Détergent Liquide 1L x6", description: "Carton de 6 bouteilles de détergent liquide multi-surfaces.", price: "5500", unit: "carton", minOrder: 3, stock: 180, imageUrl: "/images/product-detergent.png" },
    { supplierId: "demo-supplier-002", categorySlug: "hygiene-entretien", name: "Dentifrice 100ml x24", description: "Carton de 24 tubes de dentifrice menthe fraîche. Protection anti-caries.", price: "9500", unit: "carton", minOrder: 2, stock: 120, imageUrl: "/images/product-toothpaste.png" },
    { supplierId: "demo-supplier-002", categorySlug: "parapharmacie", name: "Paracétamol 500mg x100", description: "Boîte de 100 comprimés de paracétamol 500mg. Antidouleur et antipyrétique.", price: "2800", unit: "boîte", minOrder: 5, stock: 250, imageUrl: "/images/product-paracetamol.png" },
    { supplierId: "demo-supplier-002", categorySlug: "parapharmacie", name: "Gel Hydroalcoolique 500ml x12", description: "Carton de 12 flacons de gel antiseptique hydroalcoolique 500ml.", price: "7200", unit: "carton", minOrder: 2, stock: 160, imageUrl: "/images/product-sanitizer.png" },
  ];

  console.log("Seeding demo products...");
  for (const p of demoProducts) {
    const categoryId = catMap[p.categorySlug];
    if (categoryId) {
      await storage.createProduct({
        supplierId: p.supplierId,
        categoryId,
        name: p.name,
        description: p.description,
        price: p.price,
        currency: "XOF",
        unit: p.unit,
        minOrder: p.minOrder,
        stock: p.stock,
        imageUrl: p.imageUrl,
        isActive: true,
      });
    }
  }
  console.log("Demo products seeded successfully!");
}
