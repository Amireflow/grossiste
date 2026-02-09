import { storage } from "./storage";
import { db } from "./db";
import { users, userProfiles, products, categories } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export async function seedDatabase() {
  const existingCategories = await storage.getCategories();

  const allCategories = [
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
    {
      name: "Baby & Childcare",
      nameFr: "Bébé & Puériculture",
      slug: "bebe-puericulture",
      imageUrl: "/images/category-baby.png",
      description: "Couches, lait infantile, alimentation bébé, soins enfants",
    },
    {
      name: "Cosmetics & Beauty",
      nameFr: "Cosmétique & Beauté",
      slug: "cosmetique-beaute",
      imageUrl: "/images/category-beauty.png",
      description: "Crèmes, maquillage, soins capillaires, parfums",
    },
    {
      name: "Tobacco & Accessories",
      nameFr: "Tabac & Accessoires",
      slug: "tabac-accessoires",
      imageUrl: "/images/category-tobacco.png",
      description: "Cigarettes, allumettes, briquets, accessoires fumeurs",
    },
    {
      name: "Stationery & School",
      nameFr: "Papeterie & Fournitures",
      slug: "papeterie-fournitures",
      imageUrl: "/images/category-stationery.png",
      description: "Cahiers, stylos, fournitures scolaires et de bureau",
    },
    {
      name: "Phone & Accessories",
      nameFr: "Téléphonie & Accessoires",
      slug: "telephonie-accessoires",
      imageUrl: "/images/category-phone.png",
      description: "Recharges, câbles, chargeurs, coques, accessoires téléphone",
    },
    {
      name: "Condiments & Spices",
      nameFr: "Condiments & Épices",
      slug: "condiments-epices",
      imageUrl: "/images/category-spices.png",
      description: "Bouillons, épices, sauces, assaisonnements locaux",
    },
    {
      name: "Confectionery & Snacks",
      nameFr: "Confiserie & Biscuits",
      slug: "confiserie-biscuits",
      imageUrl: "/images/category-snacks.png",
      description: "Bonbons, biscuits, chocolats, chips, snacks",
    },
    {
      name: "Household & Kitchen",
      nameFr: "Ménage & Cuisine",
      slug: "menage-cuisine",
      imageUrl: "/images/category-household.png",
      description: "Ustensiles, plastiques, piles, bougies, articles ménagers",
    },
  ];

  const existingSlugs = new Set(existingCategories.map(c => c.slug));
  const newCategories = allCategories.filter(c => !existingSlugs.has(c.slug));

  if (newCategories.length > 0) {
    console.log(`Seeding ${newCategories.length} new categories...`);
    for (const cat of newCategories) {
      await storage.createCategory(cat);
    }
    console.log("New categories seeded successfully!");
  }

  const existingProducts = await storage.getProducts();
  if (existingProducts.length > 0) {
    await seedNewCategoryProducts();
    return;
  }

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

  const [existingSupplier3] = await db.select().from(users).where(eq(users.id, "demo-supplier-003"));
  if (!existingSupplier3) {
    await db.insert(users).values({
      id: "demo-supplier-003",
      email: "distribution@sokob2b.com",
      firstName: "Fatou",
      lastName: "Traoré",
    });
    await storage.createProfile({
      userId: "demo-supplier-003",
      role: "supplier",
      businessName: "Traoré & Co Distribution",
      phone: "+22370456123",
      address: "ACI 2000, Bamako",
      city: "Bamako",
      country: "Mali",
      currency: "XOF",
      description: "Distribution de produits cosmétiques, bébé et fournitures scolaires",
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
    { supplierId: "demo-supplier-003", categorySlug: "bebe-puericulture", name: "Couches Bébé Taille 3 x72", description: "Paquet de 72 couches ultra-absorbantes pour bébé (4-9kg). Confort optimal.", price: "8500", unit: "paquet", minOrder: 3, stock: 200, imageUrl: "/images/product-diapers.png" },
    { supplierId: "demo-supplier-003", categorySlug: "bebe-puericulture", name: "Lait Infantile 1er Âge 400g x6", description: "Lot de 6 boîtes de lait en poudre pour nourrisson 0-6 mois.", price: "24000", unit: "lot 6", minOrder: 2, stock: 80, imageUrl: "/images/product-baby-milk.png" },
    { supplierId: "demo-supplier-003", categorySlug: "cosmetique-beaute", name: "Crème Éclaircissante 200ml x12", description: "Carton de 12 tubes de crème de soin corporel hydratante.", price: "11000", unit: "carton", minOrder: 2, stock: 150, imageUrl: "/images/product-cream.png" },
    { supplierId: "demo-supplier-003", categorySlug: "cosmetique-beaute", name: "Shampoing Karité 250ml x24", description: "Carton de 24 flacons de shampoing au beurre de karité. Cheveux secs et crépus.", price: "14500", unit: "carton", minOrder: 1, stock: 100, imageUrl: "/images/product-shampoo.png" },
    { supplierId: "demo-supplier-003", categorySlug: "papeterie-fournitures", name: "Cahiers 200 pages x50", description: "Lot de 50 cahiers grand format 200 pages quadrillées. Qualité scolaire.", price: "17500", unit: "lot 50", minOrder: 2, stock: 300, imageUrl: "/images/product-notebooks.png" },
    { supplierId: "demo-supplier-003", categorySlug: "papeterie-fournitures", name: "Stylos Bille Bleu x100", description: "Boîte de 100 stylos bille bleus. Écriture fluide, encre longue durée.", price: "5500", unit: "boîte 100", minOrder: 3, stock: 400, imageUrl: "/images/product-pens.png" },
    { supplierId: "demo-supplier-001", categorySlug: "condiments-epices", name: "Bouillon Maggi x100 sachets", description: "Boîte de 100 cubes de bouillon Maggi. Assaisonnement incontournable.", price: "4200", unit: "boîte 100", minOrder: 5, stock: 500, imageUrl: "/images/product-bouillon.png" },
    { supplierId: "demo-supplier-001", categorySlug: "condiments-epices", name: "Piment en Poudre 500g x12", description: "Carton de 12 sachets de piment moulu. Épice locale forte.", price: "6800", unit: "carton", minOrder: 2, stock: 180, imageUrl: "/images/product-pepper.png" },
    { supplierId: "demo-supplier-002", categorySlug: "confiserie-biscuits", name: "Biscuits Sablés 200g x24", description: "Carton de 24 paquets de biscuits sablés. Goûter populaire.", price: "7200", unit: "carton", minOrder: 3, stock: 250, imageUrl: "/images/product-biscuits.png" },
    { supplierId: "demo-supplier-002", categorySlug: "confiserie-biscuits", name: "Bonbons Assortis 5kg", description: "Sac de 5kg de bonbons assortis individuellement emballés. Idéal pour la revente.", price: "5800", unit: "sac 5kg", minOrder: 2, stock: 200, imageUrl: "/images/product-candy.png" },
    { supplierId: "demo-supplier-003", categorySlug: "menage-cuisine", name: "Piles AA x48", description: "Pack de 48 piles alcalines AA longue durée. Multi-usage.", price: "6500", unit: "pack 48", minOrder: 3, stock: 300, imageUrl: "/images/product-batteries.png" },
    { supplierId: "demo-supplier-003", categorySlug: "menage-cuisine", name: "Bougies Blanches x24", description: "Lot de 24 bougies blanches longue combustion. Anti-coupures de courant.", price: "3200", unit: "lot 24", minOrder: 5, stock: 400, imageUrl: "/images/product-candles.png" },
    { supplierId: "demo-supplier-001", categorySlug: "telephonie-accessoires", name: "Chargeurs USB-C x10", description: "Lot de 10 chargeurs rapides USB-C compatibles Samsung/Android.", price: "8500", unit: "lot 10", minOrder: 2, stock: 150, imageUrl: "/images/product-chargers.png" },
    { supplierId: "demo-supplier-003", categorySlug: "tabac-accessoires", name: "Briquets Jetables x50", description: "Lot de 50 briquets jetables assortis. Couleurs variées.", price: "3800", unit: "lot 50", minOrder: 5, stock: 350, imageUrl: "/images/product-lighters.png" },
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

async function seedNewCategoryProducts() {
  const allCategories = await storage.getCategories();
  const catMap: Record<string, string> = {};
  for (const cat of allCategories) {
    catMap[cat.slug] = cat.id;
  }

  const newCategorySlugs = [
    "bebe-puericulture", "cosmetique-beaute", "tabac-accessoires",
    "papeterie-fournitures", "telephonie-accessoires", "condiments-epices",
    "confiserie-biscuits", "menage-cuisine",
  ];

  const hasNewCategoryProducts = newCategorySlugs.some(slug => catMap[slug]);
  if (!hasNewCategoryProducts) return;

  const existingProducts = await storage.getProducts();
  const existingNames = new Set(existingProducts.map(p => p.name));

  const [existingSupplier3] = await db.select().from(users).where(eq(users.id, "demo-supplier-003"));
  if (!existingSupplier3) {
    await db.insert(users).values({
      id: "demo-supplier-003",
      email: "distribution@sokob2b.com",
      firstName: "Fatou",
      lastName: "Traoré",
    });
    await storage.createProfile({
      userId: "demo-supplier-003",
      role: "supplier",
      businessName: "Traoré & Co Distribution",
      phone: "+22370456123",
      address: "ACI 2000, Bamako",
      city: "Bamako",
      country: "Mali",
      currency: "XOF",
      description: "Distribution de produits cosmétiques, bébé et fournitures scolaires",
    });
  }

  const newProducts = [
    { supplierId: "demo-supplier-003", categorySlug: "bebe-puericulture", name: "Couches Bébé Taille 3 x72", description: "Paquet de 72 couches ultra-absorbantes pour bébé (4-9kg). Confort optimal.", price: "8500", unit: "paquet", minOrder: 3, stock: 200, imageUrl: "/images/product-diapers.png" },
    { supplierId: "demo-supplier-003", categorySlug: "bebe-puericulture", name: "Lait Infantile 1er Âge 400g x6", description: "Lot de 6 boîtes de lait en poudre pour nourrisson 0-6 mois.", price: "24000", unit: "lot 6", minOrder: 2, stock: 80, imageUrl: "/images/product-baby-milk.png" },
    { supplierId: "demo-supplier-003", categorySlug: "cosmetique-beaute", name: "Crème Éclaircissante 200ml x12", description: "Carton de 12 tubes de crème de soin corporel hydratante.", price: "11000", unit: "carton", minOrder: 2, stock: 150, imageUrl: "/images/product-cream.png" },
    { supplierId: "demo-supplier-003", categorySlug: "cosmetique-beaute", name: "Shampoing Karité 250ml x24", description: "Carton de 24 flacons de shampoing au beurre de karité. Cheveux secs et crépus.", price: "14500", unit: "carton", minOrder: 1, stock: 100, imageUrl: "/images/product-shampoo.png" },
    { supplierId: "demo-supplier-003", categorySlug: "papeterie-fournitures", name: "Cahiers 200 pages x50", description: "Lot de 50 cahiers grand format 200 pages quadrillées. Qualité scolaire.", price: "17500", unit: "lot 50", minOrder: 2, stock: 300, imageUrl: "/images/product-notebooks.png" },
    { supplierId: "demo-supplier-003", categorySlug: "papeterie-fournitures", name: "Stylos Bille Bleu x100", description: "Boîte de 100 stylos bille bleus. Écriture fluide, encre longue durée.", price: "5500", unit: "boîte 100", minOrder: 3, stock: 400, imageUrl: "/images/product-pens.png" },
    { supplierId: "demo-supplier-001", categorySlug: "condiments-epices", name: "Bouillon Maggi x100 sachets", description: "Boîte de 100 cubes de bouillon Maggi. Assaisonnement incontournable.", price: "4200", unit: "boîte 100", minOrder: 5, stock: 500, imageUrl: "/images/product-bouillon.png" },
    { supplierId: "demo-supplier-001", categorySlug: "condiments-epices", name: "Piment en Poudre 500g x12", description: "Carton de 12 sachets de piment moulu. Épice locale forte.", price: "6800", unit: "carton", minOrder: 2, stock: 180, imageUrl: "/images/product-pepper.png" },
    { supplierId: "demo-supplier-002", categorySlug: "confiserie-biscuits", name: "Biscuits Sablés 200g x24", description: "Carton de 24 paquets de biscuits sablés. Goûter populaire.", price: "7200", unit: "carton", minOrder: 3, stock: 250, imageUrl: "/images/product-biscuits.png" },
    { supplierId: "demo-supplier-002", categorySlug: "confiserie-biscuits", name: "Bonbons Assortis 5kg", description: "Sac de 5kg de bonbons assortis individuellement emballés. Idéal pour la revente.", price: "5800", unit: "sac 5kg", minOrder: 2, stock: 200, imageUrl: "/images/product-candy.png" },
    { supplierId: "demo-supplier-003", categorySlug: "menage-cuisine", name: "Piles AA x48", description: "Pack de 48 piles alcalines AA longue durée. Multi-usage.", price: "6500", unit: "pack 48", minOrder: 3, stock: 300, imageUrl: "/images/product-batteries.png" },
    { supplierId: "demo-supplier-003", categorySlug: "menage-cuisine", name: "Bougies Blanches x24", description: "Lot de 24 bougies blanches longue combustion. Anti-coupures de courant.", price: "3200", unit: "lot 24", minOrder: 5, stock: 400, imageUrl: "/images/product-candles.png" },
    { supplierId: "demo-supplier-001", categorySlug: "telephonie-accessoires", name: "Chargeurs USB-C x10", description: "Lot de 10 chargeurs rapides USB-C compatibles Samsung/Android.", price: "8500", unit: "lot 10", minOrder: 2, stock: 150, imageUrl: "/images/product-chargers.png" },
    { supplierId: "demo-supplier-003", categorySlug: "tabac-accessoires", name: "Briquets Jetables x50", description: "Lot de 50 briquets jetables assortis. Couleurs variées.", price: "3800", unit: "lot 50", minOrder: 5, stock: 350, imageUrl: "/images/product-lighters.png" },
  ];

  let seeded = 0;
  for (const p of newProducts) {
    if (existingNames.has(p.name)) continue;
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
      seeded++;
    }
  }
  if (seeded > 0) {
    console.log(`Seeded ${seeded} new products for new categories!`);
  }
}
