import {
  users, userProfiles, categories, products, orders, orderItems, cartItems, productBoosts, walletTransactions,
  type UserProfile, type InsertUserProfile,
  type Category, type InsertCategory,
  type Product, type InsertProduct,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type CartItem, type InsertCartItem,
  type ProductBoost, type InsertProductBoost,
  type WalletTransaction, type InsertWalletTransaction,
  type User,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, ilike, or, gte, lte } from "drizzle-orm";

export interface IStorage {
  getProfileByUserId(userId: string): Promise<UserProfile | undefined>;
  createProfile(data: InsertUserProfile): Promise<UserProfile>;
  updateProfile(userId: string, data: Partial<InsertUserProfile>): Promise<UserProfile | undefined>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;

  getCategories(): Promise<Category[]>;
  createCategory(data: InsertCategory): Promise<Category>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;

  getProducts(categoryId?: string): Promise<Product[]>;
  getProductById(id: string): Promise<Product | undefined>;
  getProductsBySupplier(supplierId: string): Promise<Product[]>;
  getMarketplaceProducts(categoryId?: string, search?: string, supplierId?: string): Promise<(Product & { supplierName: string; supplierCity: string | null; supplierImage: string | null; isSponsored: boolean; boostLevel: string | null })[]>;
  createProduct(data: InsertProduct): Promise<Product>;
  updateProduct(id: string, data: Partial<InsertProduct>): Promise<Product | undefined>;

  getCartItems(userId: string): Promise<(CartItem & { product: Product })[]>;
  addToCart(data: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, quantity: number): Promise<CartItem | undefined>;
  removeCartItem(id: string): Promise<void>;
  clearCart(userId: string): Promise<void>;

  getOrdersByBuyer(buyerId: string): Promise<(Order & { items: OrderItem[] })[]>;
  getOrdersBySupplier(supplierId: string): Promise<(Order & { items: OrderItem[] })[]>;
  createOrder(data: InsertOrder): Promise<Order>;
  createOrderItem(data: InsertOrderItem): Promise<OrderItem>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  getOrder(id: string): Promise<(Order & { items: (OrderItem & { product?: { name: string; imageUrl: string | null } })[] }) | undefined>;

  getStats(userId: string, role: string): Promise<{ totalOrders: number; pendingOrders: number; totalProducts: number; totalRevenue: string }>;
  getSuppliers(): Promise<{ id: string; businessName: string; city: string | null; country: string | null; description: string | null; productCount: number; profileImageUrl: string | null }[]>;

  getBoostsBySupplier(supplierId: string): Promise<(ProductBoost & { productName: string })[]>;
  getActiveBoostForProduct(productId: string): Promise<ProductBoost | undefined>;
  createBoost(data: InsertProductBoost): Promise<ProductBoost>;
  updateBoost(id: string, data: Partial<{ status: string; endDate: Date }>): Promise<ProductBoost | undefined>;
  getActiveBoostProductIds(): Promise<Set<string>>;

  getWalletBalance(userId: string): Promise<string>;
  getWalletTransactions(userId: string): Promise<WalletTransaction[]>;
  topUpWallet(userId: string, amount: number, description: string): Promise<WalletTransaction>;
  chargeWalletForBoost(userId: string, amount: number, boostId: string, description: string): Promise<WalletTransaction>;
}

export class DatabaseStorage implements IStorage {
  async getProfileByUserId(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile || undefined;
  }

  async createProfile(data: InsertUserProfile): Promise<UserProfile> {
    const [profile] = await db.insert(userProfiles).values(data).returning();
    return profile;
  }

  async updateProfile(userId: string, data: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const [profile] = await db.update(userProfiles).set(data).where(eq(userProfiles.userId, userId)).returning();
    return profile || undefined;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async createCategory(data: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(data).returning();
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [cat] = await db.select().from(categories).where(eq(categories.slug, slug));
    return cat || undefined;
  }

  async getProducts(categoryId?: string): Promise<Product[]> {
    if (categoryId) {
      return db.select().from(products)
        .where(and(eq(products.categoryId, categoryId), eq(products.isActive, true)))
        .orderBy(desc(products.createdAt));
    }
    return db.select().from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.createdAt));
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProductsBySupplier(supplierId: string): Promise<Product[]> {
    return db.select().from(products)
      .where(eq(products.supplierId, supplierId))
      .orderBy(desc(products.createdAt));
  }

  async getMarketplaceProducts(categoryId?: string, search?: string, supplierId?: string): Promise<(Product & { supplierName: string; supplierCity: string | null; supplierImage: string | null; isSponsored: boolean; boostLevel: string | null })[]> {
    const conditions = [eq(products.isActive, true)];
    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }
    if (supplierId) {
      conditions.push(eq(products.supplierId, supplierId));
    }
    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.description, `%${search}%`)
        )!
      );
    }

    const now = new Date();
    const rows = await db.select({
      product: products,
      supplierName: userProfiles.businessName,
      supplierCity: userProfiles.city,
      supplierImage: users.profileImageUrl, // Add supplier image
      boostLevel: productBoosts.boostLevel,
      boostStatus: productBoosts.status,
      boostEnd: productBoosts.endDate,
      boostStart: productBoosts.startDate,
    })
      .from(products)
      .innerJoin(userProfiles, eq(products.supplierId, userProfiles.userId))
      .innerJoin(users, eq(products.supplierId, users.id)) // Join users table
      .leftJoin(productBoosts, and(
        eq(productBoosts.productId, products.id),
        eq(productBoosts.status, "active"),
        lte(productBoosts.startDate, now),
        gte(productBoosts.endDate, now)
      ))
      .where(and(...conditions))
      .orderBy(
        sql`CASE WHEN ${productBoosts.boostLevel} = 'premium' THEN 0 WHEN ${productBoosts.boostLevel} = 'standard' THEN 1 ELSE 2 END`,
        desc(products.createdAt)
      );

    return rows.map(row => ({
      ...row.product,
      supplierName: row.supplierName,
      supplierCity: row.supplierCity,
      supplierImage: row.supplierImage, // Return supplier image
      isSponsored: !!row.boostLevel && !!row.boostStatus,
      boostLevel: row.boostLevel || null,
    }));
  }

  async createProduct(data: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(data).returning();
    return product;
  }

  async updateProduct(id: string, data: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db.update(products).set(data).where(eq(products.id, id)).returning();
    return product || undefined;
  }

  async getCartItems(userId: string): Promise<(CartItem & { product: Product })[]> {
    const items = await db.select().from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId));

    return items.map((row) => ({
      ...row.cart_items,
      product: row.products,
    }));
  }

  async addToCart(data: InsertCartItem): Promise<CartItem> {
    const existing = await db.select().from(cartItems)
      .where(and(eq(cartItems.userId, data.userId), eq(cartItems.productId, data.productId)));

    if (existing.length > 0) {
      const [updated] = await db.update(cartItems)
        .set({ quantity: (existing[0].quantity || 0) + (data.quantity || 1) })
        .where(eq(cartItems.id, existing[0].id))
        .returning();
      return updated;
    }

    const [item] = await db.insert(cartItems).values(data).returning();
    return item;
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem | undefined> {
    const [item] = await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, id)).returning();
    return item || undefined;
  }

  async removeCartItem(id: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(userId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  }

  async getOrdersByBuyer(buyerId: string): Promise<(Order & { items: (OrderItem & { product?: { name: string; imageUrl: string | null } })[] })[]> {
    const allOrders = await db.select().from(orders)
      .where(eq(orders.buyerId, buyerId))
      .orderBy(desc(orders.createdAt));

    const result = [];
    for (const order of allOrders) {
      const rawItems = await db.select({
        orderItem: orderItems,
        product: { name: products.name, imageUrl: products.imageUrl },
      }).from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, order.id));

      const items = rawItems.map((r) => ({
        ...r.orderItem,
        product: r.product || undefined,
      }));
      result.push({ ...order, items });
    }
    return result;
  }

  async getOrdersBySupplier(supplierId: string): Promise<(Order & { items: (OrderItem & { product?: { name: string; imageUrl: string | null } })[] })[]> {
    const allOrders = await db.select().from(orders)
      .where(eq(orders.supplierId, supplierId))
      .orderBy(desc(orders.createdAt));

    const result = [];
    for (const order of allOrders) {
      const rawItems = await db.select({
        orderItem: orderItems,
        product: { name: products.name, imageUrl: products.imageUrl },
      }).from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, order.id));

      const items = rawItems.map((r) => ({
        ...r.orderItem,
        product: r.product || undefined,
      }));
      result.push({ ...order, items });
    }
    return result;
  }

  async createOrder(data: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(data).returning();
    return order;
  }

  async createOrderItem(data: InsertOrderItem): Promise<OrderItem> {
    const [item] = await db.insert(orderItems).values(data).returning();
    return item;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const [order] = await db.update(orders)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  async getOrder(id: string): Promise<(Order & { items: (OrderItem & { product?: { name: string; imageUrl: string | null } })[] }) | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;

    const rawItems = await db.select({
      orderItem: orderItems,
      product: { name: products.name, imageUrl: products.imageUrl },
    }).from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id));

    const items = rawItems.map((r) => ({
      ...r.orderItem,
      product: r.product || undefined,
    }));

    return { ...order, items };
  }

  async getStats(userId: string, role: string): Promise<{ totalOrders: number; pendingOrders: number; totalProducts: number; totalRevenue: string }> {
    if (role === "supplier") {
      const totalOrdersResult = await db.select({ count: sql<number>`count(*)` }).from(orders)
        .where(eq(orders.supplierId, userId));
      const pendingResult = await db.select({ count: sql<number>`count(*)` }).from(orders)
        .where(and(eq(orders.supplierId, userId), eq(orders.status, "pending")));
      const productsResult = await db.select({ count: sql<number>`count(*)` }).from(products)
        .where(and(eq(products.supplierId, userId), eq(products.isActive, true)));
      const revenueResult = await db.select({ total: sql<string>`coalesce(sum(total_amount::numeric), 0)` }).from(orders)
        .where(and(eq(orders.supplierId, userId), eq(orders.status, "delivered")));

      return {
        totalOrders: Number(totalOrdersResult[0]?.count || 0),
        pendingOrders: Number(pendingResult[0]?.count || 0),
        totalProducts: Number(productsResult[0]?.count || 0),
        totalRevenue: String(revenueResult[0]?.total || "0"),
      };
    }

    const totalOrdersResult = await db.select({ count: sql<number>`count(*)` }).from(orders)
      .where(eq(orders.buyerId, userId));
    const pendingResult = await db.select({ count: sql<number>`count(*)` }).from(orders)
      .where(and(eq(orders.buyerId, userId), eq(orders.status, "pending")));
    const productsResult = await db.select({ count: sql<number>`count(distinct product_id)` }).from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(eq(orders.buyerId, userId));
    const revenueResult = await db.select({ total: sql<string>`coalesce(sum(total_amount::numeric), 0)` }).from(orders)
      .where(eq(orders.buyerId, userId));

    return {
      totalOrders: Number(totalOrdersResult[0]?.count || 0),
      pendingOrders: Number(pendingResult[0]?.count || 0),
      totalProducts: Number(productsResult[0]?.count || 0),
      totalRevenue: String(revenueResult[0]?.total || "0"),
    };
  }

  async getSuppliers(): Promise<{ id: string; businessName: string; city: string | null; country: string | null; description: string | null; productCount: number; profileImageUrl: string | null }[]> {
    const rows = await db.select({
      id: userProfiles.userId,
      businessName: userProfiles.businessName,
      city: userProfiles.city,
      country: userProfiles.country,
      description: userProfiles.description,
      productCount: sql<number>`count(${products.id})::int`,
      profileImageUrl: users.profileImageUrl, // Add profile image
    })
      .from(userProfiles)
      .innerJoin(users, eq(userProfiles.userId, users.id)) // Join users table
      .leftJoin(products, and(eq(products.supplierId, userProfiles.userId), eq(products.isActive, true)))
      .where(eq(userProfiles.role, "supplier"))
      .groupBy(userProfiles.userId, userProfiles.businessName, userProfiles.city, userProfiles.country, userProfiles.description, users.profileImageUrl);

    return rows;
  }

  async getBoostsBySupplier(supplierId: string): Promise<(ProductBoost & { productName: string })[]> {
    const rows = await db.select({
      boost: productBoosts,
      productName: products.name,
    })
      .from(productBoosts)
      .innerJoin(products, eq(productBoosts.productId, products.id))
      .where(eq(productBoosts.supplierId, supplierId))
      .orderBy(desc(productBoosts.createdAt));

    return rows.map(r => ({ ...r.boost, productName: r.productName }));
  }

  async getActiveBoostForProduct(productId: string): Promise<ProductBoost | undefined> {
    const now = new Date();
    const [boost] = await db.select().from(productBoosts)
      .where(and(
        eq(productBoosts.productId, productId),
        eq(productBoosts.status, "active"),
        lte(productBoosts.startDate, now),
        gte(productBoosts.endDate, now)
      ));
    return boost || undefined;
  }

  async createBoost(data: InsertProductBoost): Promise<ProductBoost> {
    const [boost] = await db.insert(productBoosts).values(data).returning();
    return boost;
  }

  async updateBoost(id: string, data: Partial<{ status: string; endDate: Date }>): Promise<ProductBoost | undefined> {
    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.endDate) updateData.endDate = data.endDate;
    const [boost] = await db.update(productBoosts).set(updateData).where(eq(productBoosts.id, id)).returning();
    return boost || undefined;
  }

  async getActiveBoostProductIds(): Promise<Set<string>> {
    const now = new Date();
    const rows = await db.select({ productId: productBoosts.productId })
      .from(productBoosts)
      .where(and(
        eq(productBoosts.status, "active"),
        lte(productBoosts.startDate, now),
        gte(productBoosts.endDate, now)
      ));
    return new Set(rows.map(r => r.productId));
  }

  async getWalletBalance(userId: string): Promise<string> {
    const [profile] = await db.select({ walletBalance: userProfiles.walletBalance })
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));
    return profile?.walletBalance || "0";
  }

  async getWalletTransactions(userId: string): Promise<WalletTransaction[]> {
    return db.select().from(walletTransactions)
      .where(eq(walletTransactions.userId, userId))
      .orderBy(desc(walletTransactions.createdAt));
  }

  async topUpWallet(userId: string, amount: number, description: string): Promise<WalletTransaction> {
    return db.transaction(async (tx) => {
      await tx.update(userProfiles)
        .set({ walletBalance: sql`(coalesce(${userProfiles.walletBalance}::numeric, 0) + ${amount})::text` })
        .where(eq(userProfiles.userId, userId));

      const [walletTx] = await tx.insert(walletTransactions).values({
        userId,
        type: "topup",
        amount: String(amount),
        description,
      }).returning();
      return walletTx;
    });
  }

  async chargeWalletForBoost(userId: string, amount: number, boostId: string, description: string): Promise<WalletTransaction> {
    return db.transaction(async (tx) => {
      const [result] = await tx.update(userProfiles)
        .set({ walletBalance: sql`(coalesce(${userProfiles.walletBalance}::numeric, 0) - ${amount})::text` })
        .where(and(
          eq(userProfiles.userId, userId),
          sql`coalesce(${userProfiles.walletBalance}::numeric, 0) >= ${amount}`
        ))
        .returning({ walletBalance: userProfiles.walletBalance });

      if (!result) {
        throw new Error("Solde insuffisant");
      }

      const [walletTx] = await tx.insert(walletTransactions).values({
        userId,
        type: "boost_charge",
        amount: String(amount),
        boostId,
        description,
      }).returning();
      return walletTx;
    });
  }
}

export const storage = new DatabaseStorage();
