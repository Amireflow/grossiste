import { storage } from "./storage";

export async function seedDatabase() {
  const existingCategories = await storage.getCategories();
  if (existingCategories.length > 0) {
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
}
